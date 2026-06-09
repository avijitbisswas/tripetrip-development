import express from 'express';
import { createServer as createViteServer } from 'vite';
import net from 'net';
import path from 'path';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { buildVendorAIBriefPrompt, normalizeVendorAIBrief } from './src/features/vendor-os/aiProvider';
import { buildManualPaymentIntent } from './src/features/payments/manualPayment';
import { createManualPaymentRepository, type ManualPaymentSupabaseClient } from './src/features/payments/manualPaymentRepository';
import { createDealBookingRepository, type DealBookingSupabaseClient } from './src/features/deals/dealBookingRepository';
import { handleCreateDealBooking } from './src/features/deals/dealBookingRoute';
import { createDealInventoryRepository, type DealInventorySupabaseClient } from './src/features/deals/dealInventory';
import { handleRegisterUser } from './src/features/auth/registerRoute';

dotenv.config();

async function findAvailablePort(startPort: number, maxAttempts = 20) {
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    const available = await new Promise<boolean>((resolve) => {
      const tester = net.createServer()
        .once('error', () => resolve(false))
        .once('listening', () => tester.close(() => resolve(true)))
        .listen(port, '0.0.0.0');
    });

    if (available) {
      return port;
    }
  }

  return 0;
}

async function startServer() {
  const app = express();
  const desiredPort = Number(process.env.PORT) || 3000;
  const PORT = await findAvailablePort(desiredPort);

  if (PORT === 0) {
    throw new Error(`Unable to find an available HTTP port starting at ${desiredPort}`);
  }

  if (PORT !== desiredPort) {
    console.warn(`Port ${desiredPort} is already in use, switching Tripetrip server to port ${PORT}.`);
  }

  app.use(express.json());

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  const createManualPaymentSupabaseClient = createClient as unknown as (
    url: string,
    key: string,
    options: { auth: { persistSession: boolean; autoRefreshToken: boolean } },
  ) => ManualPaymentSupabaseClient &
    DealBookingSupabaseClient &
    DealInventorySupabaseClient & {
      auth: {
        admin: Parameters<typeof handleRegisterUser>[1]['adminAuth'];
      };
    };
  const serverSupabaseClient =
    supabaseUrl && supabaseServiceKey
      ? createManualPaymentSupabaseClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        })
      : null;
  const paymentRepository = createManualPaymentRepository({
    supabase: serverSupabaseClient,
  });
  const dealBookingRepository = createDealBookingRepository({
    supabase: serverSupabaseClient,
  });
  const dealInventoryRepository = createDealInventoryRepository({
    supabase: serverSupabaseClient,
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/cloudinary/sign', (_req, res) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'tripetrip';

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(503).json({
        error: 'Cloudinary upload is not configured',
      });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const signaturePayload = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(signaturePayload).digest('hex');

    res.json({
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder,
    });
  });

  app.post('/api/email/send', async (req, res) => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;

    if (!apiKey || !from) {
      return res.status(503).json({
        error: 'Email is not configured',
      });
    }

    const { to, subject, html } = req.body as {
      to?: string;
      subject?: string;
      html?: string;
    };

    if (!to || !subject || !html) {
      return res.status(400).json({
        error: 'Missing to, subject, or html',
      });
    }

    try {
      const resend = new Resend(apiKey);
      const { data, error } = await resend.emails.send({
        from,
        to,
        subject,
        html,
      });

      if (error) {
        return res.status(502).json({ error: error.message });
      }

      res.json({ id: data?.id ?? null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Email send failed';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/vendor-os/ai/brief', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (!apiKey) {
      return res.status(503).json({
        error: 'AI provider is not configured',
      });
    }

    const { organizationName, branchName, signals } = req.body as {
      organizationName?: string;
      branchName?: string;
      signals?: string[];
    };

    try {
      const prompt = buildVendorAIBriefPrompt({
        organizationName,
        branchName,
        signals: Array.isArray(signals) ? signals : [],
      });
      const providerResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
        },
      );

      if (!providerResponse.ok) {
        return res.status(502).json({ error: 'AI provider request failed' });
      }

      const payload = (await providerResponse.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text =
        payload.candidates?.[0]?.content?.parts
          ?.map((part) => part.text || '')
          .join('\n')
          .trim() || '';

      res.json(normalizeVendorAIBrief(text));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI brief generation failed';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    if (!serverSupabaseClient) {
      return res.status(503).json({ error: 'Registration service is not configured' });
    }

    const result = await handleRegisterUser(
      req.body as {
        email?: string;
        password?: string;
        fullName?: string;
        role?: string;
      },
      {
        adminAuth: serverSupabaseClient.auth.admin,
        supabase: serverSupabaseClient as unknown as Parameters<typeof handleRegisterUser>[1]['supabase'],
      },
    );

    res.status(result.status).json(result.body);
  });

  app.post('/api/payments/create-order', async (req, res) => {
    const { amount, bookingId, travelerName, purpose } = req.body as {
      amount?: number;
      bookingId?: string;
      travelerName?: string;
      purpose?: string;
    };

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'A positive amount is required' });
    }

    const intent = buildManualPaymentIntent({
      amount,
      bookingId,
      travelerName,
      purpose,
      upiId: process.env.MANUAL_PAYMENT_UPI_ID || process.env.TRIPETRIP_UPI_ID,
    });
    const savedIntent = await paymentRepository.create(intent, { travelerName, purpose });

    res.json(savedIntent);
  });

  app.post('/api/deals/bookings', async (req, res) => {
    const result = await handleCreateDealBooking(
      req.body as {
      dealId?: string;
      dealTitle?: string;
      amount?: number;
      travelerName?: string;
      travelerEmail?: string;
      travelDate?: string;
      participants?: number;
      },
      { paymentRepository, bookingRepository: dealBookingRepository, inventoryRepository: dealInventoryRepository },
      { upiId: process.env.MANUAL_PAYMENT_UPI_ID || process.env.TRIPETRIP_UPI_ID },
    );

    res.status(result.status).json(result.body);
  });

  app.get('/api/deals/bookings/:bookingId', async (req, res) => {
    const booking = await dealBookingRepository.getByBookingId(req.params.bookingId);
    if (!booking) return res.status(404).json({ error: 'Deal booking not found' });
    res.json({ booking });
  });

  app.get('/api/admin/payments/manual', async (_req, res) => {
    const intents = await paymentRepository.list();
    res.json({ payments: intents });
  });

  app.post('/api/admin/payments/:paymentId/approve', async (req, res) => {
    const updated = await paymentRepository.updateStatus(req.params.paymentId, 'approved');
    if (!updated) return res.status(404).json({ error: 'Manual payment not found' });
    const booking = await dealBookingRepository.updatePaymentDecision(req.params.paymentId, 'approved');
    res.json({ payment: updated, booking });
  });

  app.post('/api/admin/payments/:paymentId/reject', async (req, res) => {
    const updated = await paymentRepository.updateStatus(req.params.paymentId, 'rejected');
    if (!updated) return res.status(404).json({ error: 'Manual payment not found' });
    const booking = await dealBookingRepository.updatePaymentDecision(req.params.paymentId, 'rejected');
    res.json({ payment: updated, booking });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tripetrip Server running on http://localhost:${PORT}`);
  });
}

startServer();
