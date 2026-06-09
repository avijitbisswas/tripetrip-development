import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleCreateDealBooking } from './dealBookingRoute';

describe('deal booking route handler', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(1781000000000);
  });

  it('returns a validation error for incomplete booking requests', async () => {
    const result = await handleCreateDealBooking(
      { dealId: 'goa-beach-escape', amount: 9999 },
      {
        paymentRepository: { create: vi.fn() },
        bookingRepository: { create: vi.fn() },
      },
    );

    expect(result).toEqual({
      status: 400,
      body: { error: 'Missing dealId, dealTitle, or positive amount' },
    });
  });

  it('creates a booking and payment response when persistence succeeds', async () => {
    const paymentRepository = {
      create: vi.fn(async (payment) => ({ ...payment, travelerName: 'QA Smoke', purpose: 'Goa Beach Escape' })),
    };
    const bookingRepository = {
      create: vi.fn(async (booking) => booking),
    };

    const result = await handleCreateDealBooking(
      {
        dealId: 'goa-beach-escape',
        dealTitle: 'Goa Beach Escape',
        amount: 9999,
        travelerName: 'QA Smoke',
        travelDate: '2026-06-24',
        participants: 2,
      },
      { paymentRepository, bookingRepository },
    );

    expect(result.status).toBe(200);
    if (result.status !== 200) throw new Error('Expected successful booking response');
    expect(result.body.booking).toMatchObject({
      id: 'TRIP00000000',
      status: 'awaiting_payment_approval',
      voucherStatus: 'locked',
    });
    expect(result.body.payment).toMatchObject({
      bookingId: 'TRIP00000000',
      reference: 'TRIP00000000-9999',
    });
  });

  it('returns a clean API error when persistence fails instead of crashing the server', async () => {
    const result = await handleCreateDealBooking(
      {
        dealId: 'goa-beach-escape',
        dealTitle: 'Goa Beach Escape',
        amount: 9999,
      },
      {
        paymentRepository: { create: vi.fn(async () => Promise.reject(new Error('Invalid API key'))) },
        bookingRepository: { create: vi.fn() },
      },
    );

    expect(result).toEqual({
      status: 502,
      body: { error: 'Deal booking persistence failed' },
    });
  });
});
