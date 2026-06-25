import { handleRegisterUser } from './registerRoute';
import {
  type RegisterRole,
  isRegisterRole,
  isValidEmail,
  isValidPassword,
  maskEmail,
  normalizeEmail,
  normalizeMobileNumber,
} from './validation';

export type ChallengePurpose = 'register' | 'reset-password';

type RequestRegistrationOtpInput = {
  email?: string;
  fullName?: string;
  mobile?: string;
  role?: string;
};

type VerifyRegistrationOtpInput = {
  challengeToken?: string;
  otp?: string;
  password?: string;
};

type RequestPasswordResetOtpInput = {
  email?: string;
};

type ResetPasswordWithOtpInput = {
  challengeToken?: string;
  otp?: string;
  password?: string;
};

type ExistingUser = {
  id: string;
  email: string;
};

export type OtpChallengePayload = {
  purpose: ChallengePurpose;
  email: string;
  otp: string;
  expiresAt: string;
  fullName?: string;
  mobile?: string;
  role?: RegisterRole;
  userId?: string;
};

type AdminAuth = Parameters<typeof handleRegisterUser>[1]['adminAuth'] & {
  updateUserById: (
    userId: string,
    attributes: { password: string; email_confirm: boolean },
  ) => Promise<{ data?: { user: { id: string } | null } | null; error?: { message?: string } | null }>;
};

type SupabaseWriter = Parameters<typeof handleRegisterUser>[1]['supabase'];

type EmailOtpSender = (input: {
  to: string;
  otp: string;
  purpose: ChallengePurpose;
  fullName?: string;
}) => Promise<void>;

function isExpired(expiresAt: string, now: Date) {
  return Number.isNaN(new Date(expiresAt).getTime()) || new Date(expiresAt).getTime() < now.getTime();
}

function validateOtp(otp: string | undefined) {
  return typeof otp === 'string' && /^\d{6}$/.test(otp.trim()) ? otp.trim() : null;
}

function buildOtpExpiry(now: Date) {
  return new Date(now.getTime() + 10 * 60 * 1000).toISOString();
}

export async function handleRequestRegistrationOtp(
  input: RequestRegistrationOtpInput,
  dependencies: {
    findUserByEmail: (email: string) => Promise<ExistingUser | null>;
    createChallengeToken: (payload: OtpChallengePayload) => string | Promise<string>;
    sendOtpEmail: EmailOtpSender;
    generateOtp?: () => string;
    now?: () => Date;
  },
) {
  const fullName = input.fullName?.trim() || '';
  const email = typeof input.email === 'string' ? normalizeEmail(input.email) : '';
  const mobile = typeof input.mobile === 'string' ? normalizeMobileNumber(input.mobile) : null;
  const role = typeof input.role === 'string' && isRegisterRole(input.role) ? input.role : null;

  if (!fullName || !isValidEmail(email) || !mobile || !role) {
    return {
      status: 400 as const,
      body: { error: 'Enter a valid full name, email, mobile number, and account type' },
    };
  }

  const existingUser = await dependencies.findUserByEmail(email);
  if (existingUser) {
    return {
      status: 409 as const,
      body: { error: 'An account with this email already exists' },
    };
  }

  const now = dependencies.now?.() || new Date();
  const otp = dependencies.generateOtp?.() || String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = buildOtpExpiry(now);
  const challengeToken = await dependencies.createChallengeToken({
    purpose: 'register',
    email,
    otp,
    expiresAt,
    fullName,
    mobile,
    role,
  });

  await dependencies.sendOtpEmail({
    to: email,
    otp,
    purpose: 'register',
    fullName,
  });

  return {
    status: 200 as const,
    body: {
      challengeToken,
      expiresAt,
      maskedEmail: maskEmail(email),
    },
  };
}

export async function handleVerifyRegistrationOtp(
  input: VerifyRegistrationOtpInput,
  dependencies: {
    verifyChallengeToken: (token: string) => OtpChallengePayload | null | Promise<OtpChallengePayload | null>;
    adminAuth: AdminAuth;
    supabase: SupabaseWriter;
    now?: () => Date;
  },
) {
  const challengeToken = input.challengeToken?.trim();
  const otp = validateOtp(input.otp);
  if (!challengeToken || !otp || !input.password || !isValidPassword(input.password)) {
    return {
      status: 400 as const,
      body: { error: 'Enter a valid OTP and password' },
    };
  }

  const challenge = await dependencies.verifyChallengeToken(challengeToken);
  const now = dependencies.now?.() || new Date();
  if (!challenge || challenge.purpose !== 'register' || !challenge.role || !challenge.mobile || !challenge.fullName) {
    return {
      status: 400 as const,
      body: { error: 'This verification request is invalid or has expired' },
    };
  }

  if (isExpired(challenge.expiresAt, now) || challenge.otp !== otp) {
    return {
      status: 400 as const,
      body: { error: 'The OTP is invalid or has expired' },
    };
  }

  const result = await handleRegisterUser(
    {
      email: challenge.email,
      password: input.password,
      fullName: challenge.fullName,
      phone: challenge.mobile,
      role: challenge.role,
    },
    {
      adminAuth: dependencies.adminAuth,
      supabase: dependencies.supabase,
    },
  );

  if (result.status !== 200) {
    return result;
  }

  return {
    status: 200 as const,
    body: {
      user: {
        ...result.body.user,
        email: challenge.email,
        phone: challenge.mobile,
      },
    },
  };
}

export async function handleRequestPasswordResetOtp(
  input: RequestPasswordResetOtpInput,
  dependencies: {
    findUserByEmail: (email: string) => Promise<ExistingUser | null>;
    createChallengeToken: (payload: OtpChallengePayload) => string | Promise<string>;
    sendOtpEmail: EmailOtpSender;
    generateOtp?: () => string;
    now?: () => Date;
  },
) {
  const email = typeof input.email === 'string' ? normalizeEmail(input.email) : '';
  if (!isValidEmail(email)) {
    return {
      status: 400 as const,
      body: { error: 'Enter a valid email address' },
    };
  }

  const existingUser = await dependencies.findUserByEmail(email);
  if (!existingUser) {
    return {
      status: 404 as const,
      body: { error: 'No account was found for this email address' },
    };
  }

  const now = dependencies.now?.() || new Date();
  const otp = dependencies.generateOtp?.() || String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = buildOtpExpiry(now);
  const challengeToken = await dependencies.createChallengeToken({
    purpose: 'reset-password',
    email,
    otp,
    expiresAt,
    userId: existingUser.id,
  });

  await dependencies.sendOtpEmail({
    to: email,
    otp,
    purpose: 'reset-password',
  });

  return {
    status: 200 as const,
    body: {
      challengeToken,
      expiresAt,
      maskedEmail: maskEmail(email),
    },
  };
}

export async function handleResetPasswordWithOtp(
  input: ResetPasswordWithOtpInput,
  dependencies: {
    verifyChallengeToken: (token: string) => OtpChallengePayload | null | Promise<OtpChallengePayload | null>;
    adminAuth: AdminAuth;
    now?: () => Date;
  },
) {
  const challengeToken = input.challengeToken?.trim();
  const otp = validateOtp(input.otp);
  if (!challengeToken || !otp || !input.password || !isValidPassword(input.password)) {
    return {
      status: 400 as const,
      body: { error: 'Enter a valid OTP and password' },
    };
  }

  const challenge = await dependencies.verifyChallengeToken(challengeToken);
  const now = dependencies.now?.() || new Date();
  if (!challenge || challenge.purpose !== 'reset-password' || !challenge.userId) {
    return {
      status: 400 as const,
      body: { error: 'This reset request is invalid or has expired' },
    };
  }

  if (isExpired(challenge.expiresAt, now) || challenge.otp !== otp) {
    return {
      status: 400 as const,
      body: { error: 'The OTP is invalid or has expired' },
    };
  }

  const { error } = await dependencies.adminAuth.updateUserById(challenge.userId, {
    password: input.password,
    email_confirm: true,
  });

  if (error) {
    return {
      status: 502 as const,
      body: { error: error.message || 'Unable to update password' },
    };
  }

  return {
    status: 200 as const,
    body: {
      success: true,
      email: challenge.email,
    },
  };
}
