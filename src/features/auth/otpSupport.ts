import type { ChallengePurpose, OtpChallengePayload } from './otpFlow';

type AdminListedUser = {
  id: string;
  email?: string | null;
};

type AdminListUsers = (params?: { page?: number; perPage?: number }) => Promise<{
  data?: {
    users?: AdminListedUser[];
    nextPage?: number | null;
    lastPage?: number | null;
  } | null;
  error?: { message?: string } | null;
}>;

function toBase64Url(bytes: Uint8Array) {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function getEncryptionKey(secret: string) {
  const secretBytes = new TextEncoder().encode(secret);
  const digest = await crypto.subtle.digest('SHA-256', secretBytes);
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function createEncryptedChallengeToken(payload: OtpChallengePayload, secret: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getEncryptionKey(secret);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(JSON.stringify(payload)),
  );

  return `${toBase64Url(iv)}.${toBase64Url(new Uint8Array(ciphertext))}`;
}

export async function verifyEncryptedChallengeToken(token: string, secret: string) {
  const [ivPart, cipherPart] = token.split('.');
  if (!ivPart || !cipherPart) return null;

  try {
    const key = await getEncryptionKey(secret);
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64Url(ivPart) },
      key,
      fromBase64Url(cipherPart),
    );

    return JSON.parse(new TextDecoder().decode(plaintext)) as OtpChallengePayload;
  } catch {
    return null;
  }
}

export async function findUserByEmail(
  listUsers: AdminListUsers,
  email: string,
) {
  const normalizedEmail = email.trim().toLowerCase();
  let page = 1;

  while (page) {
    const { data, error } = await listUsers({ page, perPage: 1000 });
    if (error) {
      throw new Error(error.message || 'Unable to inspect existing users');
    }

    const users = data?.users || [];
    const match = users.find((user) => user.email?.trim().toLowerCase() === normalizedEmail);
    if (match?.id) {
      return {
        id: match.id,
        email: match.email || normalizedEmail,
      };
    }

    page = data?.nextPage || 0;
  }

  return null;
}

export function buildOtpEmailHtml(input: {
  otp: string;
  purpose: ChallengePurpose;
  fullName?: string;
}) {
  const headline =
    input.purpose === 'register' ? 'Verify your Tripetrip email' : 'Reset your Tripetrip password';
  const intro =
    input.purpose === 'register'
      ? `Hi ${input.fullName || 'there'}, use this OTP to finish creating your account.`
      : 'Use this OTP to reset your Tripetrip password.';

  return `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a">
      <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;padding:32px">
        <p style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#6366f1;margin:0 0 16px">Tripetrip Security</p>
        <h1 style="font-size:24px;line-height:1.2;margin:0 0 16px">${headline}</h1>
        <p style="font-size:14px;line-height:1.7;color:#475569;margin:0 0 24px">${intro}</p>
        <div style="font-size:32px;font-weight:700;letter-spacing:0.3em;background:#eef2ff;color:#4338ca;border-radius:16px;padding:18px 24px;text-align:center;margin:0 0 24px">
          ${input.otp}
        </div>
        <p style="font-size:13px;line-height:1.7;color:#64748b;margin:0">This code expires in 10 minutes.</p>
      </div>
    </div>
  `.trim();
}
