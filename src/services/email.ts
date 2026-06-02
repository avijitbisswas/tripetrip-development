import { ServiceError } from './errors';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendTransactionalEmail(input: SendEmailInput) {
  const response = await fetch('/api/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new ServiceError('Email request failed', 'EMAIL_SEND_FAILED', response.status);
  }

  return response.json() as Promise<{ id: string | null }>;
}
