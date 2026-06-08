import express from 'express';
import { createServer as createViteServer } from 'vite';
import net from 'net';
import path from 'path';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { Resend } from 'resend';
import { buildVendorAIBriefPrompt, normalizeVendorAIBrief } from './src/features/vendor-os/aiProvider';

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
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

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

  app.post('/api/payments/create-order', async (_req, res) => {
    res.json({
      message: 'Order creation endpoint ready',
      order_id: 'pending_razorpay_integration',
    });
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
