import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildManualPaymentIntent } from './manualPayment';
import { createManualPaymentRepository } from './manualPaymentRepository';

describe('manual payment repository', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(1780912345678);
  });

  it('stores manual payment intents in memory when Supabase is unavailable', async () => {
    const repository = createManualPaymentRepository();
    const intent = buildManualPaymentIntent({ bookingId: 'TRIP67845291', amount: 9999 });

    await expect(repository.create(intent)).resolves.toEqual(intent);
    await expect(repository.get(intent.id)).resolves.toEqual(intent);
    await expect(repository.list()).resolves.toEqual([intent]);

    await expect(repository.updateStatus(intent.id, 'approved')).resolves.toEqual({
      ...intent,
      status: 'approved',
      adminApprovalStatus: 'approved',
    });
  });

  it('maps manual payment intents to Supabase rows for production persistence', async () => {
    const intent = buildManualPaymentIntent({
      bookingId: 'TRIP67845291',
      amount: 9999,
      travelerName: 'Ananya Sen',
      purpose: 'Goa Beach Escape',
    });
    const row = {
      id: intent.id,
      booking_id: intent.bookingId,
      amount: intent.amount,
      currency: intent.currency,
      method: intent.method,
      status: intent.status,
      admin_approval_status: intent.adminApprovalStatus,
      reference: intent.reference,
      barcode_payload: intent.barcodePayload,
      instructions: intent.instructions,
      traveler_name: 'Ananya Sen',
      purpose: 'Goa Beach Escape',
    };
    const insertSingle = vi.fn().mockResolvedValue({ data: row, error: null });
    const insertSelect = vi.fn(() => ({ single: insertSingle }));
    const insert = vi.fn(() => ({ select: insertSelect }));
    const updateSingle = vi.fn().mockResolvedValue({
      data: { ...row, status: 'rejected', admin_approval_status: 'rejected' },
      error: null,
    });
    const updateSelect = vi.fn(() => ({ single: updateSingle }));
    const eq = vi.fn(() => ({ select: updateSelect }));
    const update = vi.fn(() => ({ eq }));
    const from = vi
      .fn()
      .mockReturnValueOnce({ insert })
      .mockReturnValueOnce({ update });

    const repository = createManualPaymentRepository({ supabase: { from } });

    await expect(repository.create(intent, { travelerName: 'Ananya Sen', purpose: 'Goa Beach Escape' })).resolves.toEqual({
      ...intent,
      travelerName: 'Ananya Sen',
      purpose: 'Goa Beach Escape',
    });
    expect(from).toHaveBeenCalledWith('manual_payment_intents');
    expect(insert).toHaveBeenCalledWith(row);

    await expect(repository.updateStatus(intent.id, 'rejected')).resolves.toMatchObject({
      id: intent.id,
      status: 'rejected',
      adminApprovalStatus: 'rejected',
    });
    expect(update).toHaveBeenCalledWith({
      status: 'rejected',
      admin_approval_status: 'rejected',
      rejected_at: expect.any(String),
    });
    expect(eq).toHaveBeenCalledWith('id', intent.id);
  });
});
