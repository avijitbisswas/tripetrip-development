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

const CONFIG_HEALTH_VERSION = '2026-06-15';
const COMMUNITY_MESSAGE_PREFIX = '__tripetrip_community__:';
const COMMUNITY_AUDIENCES = new Set(['everyone', 'circle', 'mentions']);
const COMMUNITY_VISIBILITIES = new Set(['feed', 'profile']);

type CommunityMessagePayload = {
  role: string;
  content: string;
  audience?: 'everyone' | 'circle' | 'mentions';
  visibility?: 'feed' | 'profile';
  location?: string | null;
  scheduledAt?: string | null;
  important?: boolean;
  media?: {
    type: 'image' | 'gif';
    url: string;
    alt?: string;
  } | null;
  poll?: {
    options: string[];
  } | null;
};

function getConfigHealth() {
  const hasSupabaseUrl = Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_PROJECT_REF);
  const hasSupabaseServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY);
  const hasCloudinaryName = Boolean(process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
  const hasCloudinaryApiKey = Boolean(process.env.CLOUDINARY_API_KEY);
  const hasCloudinaryApiSecret = Boolean(process.env.CLOUDINARY_API_SECRET);
  const hasResendApiKey = Boolean(process.env.RESEND_API_KEY);
  const hasResendFromEmail = Boolean(process.env.RESEND_FROM_EMAIL);
  const hasGeminiApiKey = Boolean(process.env.GEMINI_API_KEY);
  const hasManualPaymentUpi = Boolean(process.env.MANUAL_PAYMENT_UPI_ID || process.env.TRIPETRIP_UPI_ID);

  return {
    status: 'ok',
    version: CONFIG_HEALTH_VERSION,
    supabase: {
      configured: hasSupabaseUrl && hasSupabaseServiceKey,
      url: hasSupabaseUrl,
      serviceKey: hasSupabaseServiceKey,
    },
    cloudinary: {
      configured: hasCloudinaryName && hasCloudinaryApiKey && hasCloudinaryApiSecret,
      cloudName: hasCloudinaryName,
      apiKey: hasCloudinaryApiKey,
      apiSecret: hasCloudinaryApiSecret,
    },
    email: {
      configured: hasResendApiKey && hasResendFromEmail,
      resendApiKey: hasResendApiKey,
      resendFromEmail: hasResendFromEmail,
    },
    ai: {
      configured: hasGeminiApiKey,
      geminiApiKey: hasGeminiApiKey,
    },
    payments: {
      configured: hasManualPaymentUpi,
      manualPaymentUpi: hasManualPaymentUpi,
    },
  };
}

function getBearerToken(headerValue?: string) {
  const match = (headerValue || '').match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function normalizeCommunityPayload(input: Partial<CommunityMessagePayload>) {
  const content = String(input.content || '').trim();
  const role = String(input.role || '').trim();
  const audience = COMMUNITY_AUDIENCES.has(String(input.audience))
    ? (String(input.audience) as CommunityMessagePayload['audience'])
    : 'everyone';
  const visibility = COMMUNITY_VISIBILITIES.has(String(input.visibility))
    ? (String(input.visibility) as CommunityMessagePayload['visibility'])
    : 'feed';
  const location = String(input.location || '').trim();
  const scheduledAtValue = String(input.scheduledAt || '').trim();
  const scheduledAt =
    scheduledAtValue && !Number.isNaN(new Date(scheduledAtValue).getTime())
      ? new Date(scheduledAtValue).toISOString()
      : null;
  const media =
    input.media &&
    (input.media.type === 'image' || input.media.type === 'gif') &&
    typeof input.media.url === 'string' &&
    input.media.url.trim()
      ? {
          type: input.media.type,
          url: input.media.url.trim(),
          ...(typeof input.media.alt === 'string' && input.media.alt.trim() ? { alt: input.media.alt.trim() } : {}),
        }
      : null;
  const pollOptions = Array.isArray(input.poll?.options)
    ? input.poll.options.map((option) => String(option || '').trim()).filter(Boolean).slice(0, 4)
    : [];
  const poll = pollOptions.length >= 2 ? { options: pollOptions } : null;

  return {
    role,
    content,
    audience,
    visibility,
    ...(location ? { location } : {}),
    ...(scheduledAt ? { scheduledAt } : {}),
    ...(input.important ? { important: true } : {}),
    ...(media ? { media } : {}),
    ...(poll ? { poll } : {}),
  };
}

function encodeCommunityMessage(payload: CommunityMessagePayload) {
  return `${COMMUNITY_MESSAGE_PREFIX}${JSON.stringify(normalizeCommunityPayload(payload))}`;
}

function parseCommunityMessage(value: unknown) {
  if (typeof value !== 'string' || !value.startsWith(COMMUNITY_MESSAGE_PREFIX)) {
    return null;
  }

  try {
    const parsed = JSON.parse(value.slice(COMMUNITY_MESSAGE_PREFIX.length)) as Partial<CommunityMessagePayload>;
    const normalized = normalizeCommunityPayload(parsed);
    if (!normalized.role || !normalized.content) return null;
    return normalized;
  } catch {
    return null;
  }
}

function mapCommunityMessage(row: Record<string, unknown>) {
  const parsed = parseCommunityMessage(row.content);
  const author = row.profiles as
    | {
        id?: string;
        full_name?: string | null;
        role?: string;
        avatar_url?: string | null;
      }
    | undefined;

  if (!parsed) return null;

  return {
    id: String(row.id),
    authorId: String(row.sender_id),
    role: parsed.role,
    content: parsed.content,
    createdAt: String(row.created_at || ''),
    audience: parsed.audience,
    visibility: parsed.visibility,
    location: parsed.location || null,
    scheduledAt: parsed.scheduledAt || null,
    important: Boolean(parsed.important),
    media: parsed.media || null,
    poll: parsed.poll || null,
    author: {
      id: String(author?.id || row.sender_id),
      fullName: author?.full_name || 'Tripetrip Member',
      role: String(author?.role || parsed.role),
      avatarUrl: author?.avatar_url || null,
    },
  };
}

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
  const supabaseProjectRef = process.env.SUPABASE_PROJECT_REF?.trim();
  const resolvedSupabaseUrl = supabaseUrl || (supabaseProjectRef ? `https://${supabaseProjectRef}.supabase.co` : undefined);
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
        getUser: (token: string) => Promise<{
          data: { user: { id: string } | null } | null;
          error: { message?: string } | null;
        }>;
      };
      from: (table: string) => unknown;
    };
  const serverSupabaseClient =
    resolvedSupabaseUrl && supabaseServiceKey
      ? createManualPaymentSupabaseClient(resolvedSupabaseUrl, supabaseServiceKey, {
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

  async function getAuthenticatedProfile(authHeader?: string) {
    if (!serverSupabaseClient) return { error: { status: 503, body: { error: 'Community service is not configured' } } };

    const token = getBearerToken(authHeader);
    if (!token) return { error: { status: 401, body: { error: 'Authentication required' } } };

    const { data: userData, error: userError } = await serverSupabaseClient.auth.getUser(token);
    const userId = userData?.user?.id;

    if (userError || !userId) {
      return { error: { status: 401, body: { error: 'Authentication required' } } };
    }

    const { data: profile, error: profileError } = await (serverSupabaseClient.from('profiles') as any)
      .select('id, full_name, role, avatar_url')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return { error: { status: 404, body: { error: 'Profile not found' } } };
    }

    return {
      profile: {
        id: profile.id,
        fullName: profile.full_name || 'Tripetrip Member',
        role: profile.role,
        avatarUrl: profile.avatar_url || null,
      },
    };
  }

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/config/health', (_req, res) => {
    res.json(getConfigHealth());
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

  app.get('/api/community/posts', async (req, res) => {
    const auth = await getAuthenticatedProfile(req.headers.authorization);
    if ('error' in auth) {
      return res.status(auth.error.status).json(auth.error.body);
    }

    const authorId = typeof req.query.authorId === 'string' ? req.query.authorId : undefined;
    const { data, error } = await (serverSupabaseClient!.from('messages') as any)
      .select('id, sender_id, content, created_at, profiles:sender_id(id, full_name, role, avatar_url)')
      .like('content', `${COMMUNITY_MESSAGE_PREFIX}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return res.status(502).json({ error: error.message || 'Unable to load community feed' });
    }

    const now = Date.now();
    const posts = (data || [])
      .map(mapCommunityMessage)
      .filter((post: ReturnType<typeof mapCommunityMessage>): post is NonNullable<typeof post> => Boolean(post) && post.role === auth.profile.role)
      .filter((post: NonNullable<ReturnType<typeof mapCommunityMessage>>) => !authorId || post.authorId === authorId)
      .filter((post: NonNullable<ReturnType<typeof mapCommunityMessage>>) => {
        const scheduledAt = post.scheduledAt ? new Date(post.scheduledAt).getTime() : null;
        const isFutureScheduled = scheduledAt ? scheduledAt > now : false;
        const isOwnProfile = Boolean(authorId) && authorId === auth.profile.id;

        if (isFutureScheduled && !isOwnProfile) return false;
        if (!authorId && post.visibility === 'profile') return false;
        return true;
      });

    res.json({
      viewer: auth.profile,
      posts,
    });
  });

  app.post('/api/community/posts', async (req, res) => {
    const auth = await getAuthenticatedProfile(req.headers.authorization);
    if ('error' in auth) {
      return res.status(auth.error.status).json(auth.error.body);
    }

    const payload = normalizeCommunityPayload({
      ...(req.body as Partial<CommunityMessagePayload>),
      role: auth.profile.role,
    });

    if (payload.content.length < 2 || payload.content.length > 280) {
      return res.status(400).json({ error: 'Post must be between 2 and 280 characters' });
    }

    const { data, error } = await (serverSupabaseClient!.from('messages') as any)
      .insert({
        sender_id: auth.profile.id,
        receiver_id: auth.profile.id,
        content: encodeCommunityMessage(payload),
      })
      .select('id, sender_id, content, created_at, profiles:sender_id(id, full_name, role, avatar_url)')
      .single();

    if (error || !data) {
      return res.status(502).json({ error: error?.message || 'Unable to create community post' });
    }

    res.json({ post: mapCommunityMessage(data) });
  });

  app.get('/api/community/profile/:profileId', async (req, res) => {
    const auth = await getAuthenticatedProfile(req.headers.authorization);
    if ('error' in auth) {
      return res.status(auth.error.status).json(auth.error.body);
    }

    const { data, error } = await (serverSupabaseClient!.from('profiles') as any)
      .select('id, full_name, role, avatar_url')
      .eq('id', req.params.profileId)
      .eq('role', auth.profile.role)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Community profile not found' });
    }

    res.json({
      viewer: auth.profile,
      profile: {
        id: data.id,
        fullName: data.full_name || 'Tripetrip Member',
        role: data.role,
        avatarUrl: data.avatar_url || null,
      },
    });
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
