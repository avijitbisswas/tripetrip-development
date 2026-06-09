import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDealBookingPayment } from './dealBookingWorkflow';
import { createDealBookingRepository } from './dealBookingRepository';

describe('deal booking repository', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(1781000000000);
  });

  it('stores booking workflow state in memory for local QA flows', async () => {
    const repository = createDealBookingRepository();
    const workflow = createDealBookingPayment({
      dealId: 'goa-beach-escape',
      dealTitle: 'Goa Beach Escape',
      amount: 9999,
      travelerName: 'Ananya Sen',
    });

    await expect(repository.create(workflow.booking)).resolves.toEqual(workflow.booking);
    await expect(repository.getByBookingId('TRIP00000000')).resolves.toEqual(workflow.booking);
    await expect(repository.getByPaymentIntentId(workflow.payment.id)).resolves.toEqual(workflow.booking);

    await expect(repository.updatePaymentDecision(workflow.payment.id, 'approved')).resolves.toMatchObject({
      id: 'TRIP00000000',
      status: 'confirmed',
      paymentStatus: 'approved',
      voucherStatus: 'released',
    });
  });

  it('maps booking workflow rows to Supabase for production persistence', async () => {
    const workflow = createDealBookingPayment({
      dealId: 'goa-beach-escape',
      dealTitle: 'Goa Beach Escape',
      amount: 9999,
      travelerName: 'Ananya Sen',
      travelerEmail: 'ananya@example.com',
      travelDate: '2026-06-24',
      participants: 2,
    });
    const row = {
      id: 'TRIP00000000',
      deal_id: 'goa-beach-escape',
      deal_title: 'Goa Beach Escape',
      traveler_name: 'Ananya Sen',
      traveler_email: 'ananya@example.com',
      travel_date: '2026-06-24',
      participants: 2,
      amount: 9999,
      status: 'awaiting_payment_approval',
      payment_status: 'pending',
      voucher_status: 'locked',
      payment_intent_id: workflow.payment.id,
      voucher_code: 'VCH-TRIP00000000',
      created_at: workflow.booking.createdAt,
      updated_at: workflow.booking.updatedAt,
    };
    const insertSingle = vi.fn().mockResolvedValue({ data: row, error: null });
    const insertSelect = vi.fn(() => ({ single: insertSingle }));
    const insert = vi.fn(() => ({ select: insertSelect }));
    const readSingle = vi.fn().mockResolvedValue({ data: row, error: null });
    const readEq = vi.fn(() => ({ single: readSingle }));
    const select = vi.fn(() => ({ eq: readEq }));
    const updateSingle = vi.fn().mockResolvedValue({
      data: { ...row, status: 'payment_rejected', payment_status: 'rejected', voucher_status: 'blocked' },
      error: null,
    });
    const updateSelect = vi.fn(() => ({ single: updateSingle }));
    const eq = vi.fn(() => ({ select: updateSelect }));
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn().mockReturnValueOnce({ insert }).mockReturnValueOnce({ select }).mockReturnValueOnce({ update });
    const repository = createDealBookingRepository({ supabase: { from } });

    await expect(repository.create(workflow.booking)).resolves.toEqual(workflow.booking);
    expect(from).toHaveBeenCalledWith('deal_booking_confirmations');
    expect(insert).toHaveBeenCalledWith(row);

    await expect(repository.updatePaymentDecision(workflow.payment.id, 'rejected')).resolves.toMatchObject({
      id: 'TRIP00000000',
      status: 'payment_rejected',
      paymentStatus: 'rejected',
      voucherStatus: 'blocked',
    });
    expect(update).toHaveBeenCalledWith({
      status: 'payment_rejected',
      payment_status: 'rejected',
      voucher_status: 'blocked',
      updated_at: expect.any(String),
    });
    expect(eq).toHaveBeenCalledWith('payment_intent_id', workflow.payment.id);
  });
});
