import { describe, expect, it } from 'vitest';
import { ServiceError, toServiceError } from './errors';

describe('toServiceError', () => {
  it('keeps known service errors unchanged', () => {
    const error = new ServiceError('Auth failed', 'AUTH_FAILED', 401);

    expect(toServiceError(error)).toBe(error);
  });

  it('normalizes unknown errors', () => {
    const error = toServiceError(new Error('Network down'), 'LISTINGS_FAILED');

    expect(error.message).toBe('Network down');
    expect(error.code).toBe('LISTINGS_FAILED');
    expect(error.status).toBe(500);
  });
});
