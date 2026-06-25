export type RegisterRole = 'traveler' | 'vendor';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string) {
  return emailPattern.test(normalizeEmail(value));
}

export function normalizeMobileNumber(value: string) {
  const trimmed = value.trim();
  const hasPlusPrefix = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (hasPlusPrefix && digits.length >= 11 && digits.length <= 15) {
    return `+${digits}`;
  }

  if (!hasPlusPrefix && digits.length >= 11 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
}

export function isValidMobileNumber(value: string) {
  return Boolean(normalizeMobileNumber(value));
}

export function isValidPassword(value: string) {
  return passwordPattern.test(value);
}

export function isRegisterRole(role: string | undefined): role is RegisterRole {
  return role === 'traveler' || role === 'vendor';
}

export function maskEmail(email: string) {
  const normalized = normalizeEmail(email);
  const [localPart, domain] = normalized.split('@');
  if (!localPart || !domain) return normalized;

  if (localPart.length <= 2) {
    return `${localPart[0] || '*'}***@${domain}`;
  }

  return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`;
}
