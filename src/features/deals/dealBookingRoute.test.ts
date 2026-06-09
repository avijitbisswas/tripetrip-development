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
        inventoryRepository: { reserve: vi.fn(), release: vi.fn() },
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
    const inventoryRepository = {
      reserve: vi.fn(async () => ({ dealId: 'goa-beach-escape', remainingInventory: 7 })),
      release: vi.fn(),
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
      { paymentRepository, bookingRepository, inventoryRepository },
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
    expect(inventoryRepository.reserve).toHaveBeenCalledWith('goa-beach-escape');
    expect(inventoryRepository.release).not.toHaveBeenCalled();
  });

  it('returns a sold-out response when no inventory can be reserved', async () => {
    const result = await handleCreateDealBooking(
      {
        dealId: 'goa-beach-escape',
        dealTitle: 'Goa Beach Escape',
        amount: 9999,
      },
      {
        paymentRepository: { create: vi.fn() },
        bookingRepository: { create: vi.fn() },
        inventoryRepository: {
          reserve: vi.fn(async () => null),
          release: vi.fn(),
        },
      },
    );

    expect(result).toEqual({
      status: 409,
      body: { error: 'Deal is sold out' },
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
        inventoryRepository: {
          reserve: vi.fn(async () => ({ dealId: 'goa-beach-escape', remainingInventory: 7 })),
          release: vi.fn(async () => ({ dealId: 'goa-beach-escape', remainingInventory: 8 })),
        },
      },
    );

    expect(result).toEqual({
      status: 502,
      body: { error: 'Deal booking persistence failed' },
    });
  });

  it('releases reserved inventory when persistence fails', async () => {
    const inventoryRepository = {
      reserve: vi.fn(async () => ({ dealId: 'goa-beach-escape', remainingInventory: 7 })),
      release: vi.fn(async () => ({ dealId: 'goa-beach-escape', remainingInventory: 8 })),
    };

    await handleCreateDealBooking(
      {
        dealId: 'goa-beach-escape',
        dealTitle: 'Goa Beach Escape',
        amount: 9999,
      },
      {
        paymentRepository: { create: vi.fn(async () => Promise.reject(new Error('Invalid API key'))) },
        bookingRepository: { create: vi.fn() },
        inventoryRepository,
      },
    );

    expect(inventoryRepository.release).toHaveBeenCalledWith('goa-beach-escape');
  });

  it('returns a clean API error when inventory reservation fails', async () => {
    const inventoryRepository = {
      reserve: vi.fn(async () => Promise.reject(new Error('Invalid API key'))),
      release: vi.fn(),
    };

    const result = await handleCreateDealBooking(
      {
        dealId: 'goa-beach-escape',
        dealTitle: 'Goa Beach Escape',
        amount: 9999,
      },
      {
        paymentRepository: { create: vi.fn() },
        bookingRepository: { create: vi.fn() },
        inventoryRepository,
      },
    );

    expect(result).toEqual({
      status: 502,
      body: { error: 'Deal booking persistence failed' },
    });
    expect(inventoryRepository.release).not.toHaveBeenCalled();
  });

  it('still returns a clean API error when reserved inventory cannot be released', async () => {
    const inventoryRepository = {
      reserve: vi.fn(async () => ({ dealId: 'goa-beach-escape', remainingInventory: 7 })),
      release: vi.fn(async () => Promise.reject(new Error('Invalid API key'))),
    };

    const result = await handleCreateDealBooking(
      {
        dealId: 'goa-beach-escape',
        dealTitle: 'Goa Beach Escape',
        amount: 9999,
      },
      {
        paymentRepository: { create: vi.fn(async () => Promise.reject(new Error('Invalid API key'))) },
        bookingRepository: { create: vi.fn() },
        inventoryRepository,
      },
    );

    expect(result).toEqual({
      status: 502,
      body: { error: 'Deal booking persistence failed' },
    });
    expect(inventoryRepository.release).toHaveBeenCalledWith('goa-beach-escape');
  });
});
