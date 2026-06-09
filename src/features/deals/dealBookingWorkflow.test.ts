import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDealBookingPaymentDecision, createDealBookingPayment } from './dealBookingWorkflow';

describe('deal booking workflow', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(1781000000000);
  });

  it('creates a pending deal booking with a manual barcode payment intent and locked voucher', () => {
    const workflow = createDealBookingPayment({
      dealId: 'goa-beach-escape',
      dealTitle: 'Goa Beach Escape',
      amount: 9999,
      travelerName: 'Ananya Sen',
      travelerEmail: 'ananya@example.com',
      travelDate: '2026-06-24',
      participants: 2,
    });

    expect(workflow.booking).toMatchObject({
      id: 'TRIP00000000',
      dealId: 'goa-beach-escape',
      dealTitle: 'Goa Beach Escape',
      travelerName: 'Ananya Sen',
      travelerEmail: 'ananya@example.com',
      travelDate: '2026-06-24',
      participants: 2,
      amount: 9999,
      status: 'awaiting_payment_approval',
      voucherStatus: 'locked',
    });
    expect(workflow.payment).toMatchObject({
      bookingId: 'TRIP00000000',
      amount: 9999,
      status: 'awaiting_admin_approval',
      adminApprovalStatus: 'pending',
      reference: 'TRIP00000000-9999',
    });
  });

  it('unlocks vouchers after approval and blocks them after rejection', () => {
    const workflow = createDealBookingPayment({
      dealId: 'goa-beach-escape',
      dealTitle: 'Goa Beach Escape',
      amount: 9999,
    });

    expect(applyDealBookingPaymentDecision(workflow.booking, 'approved')).toMatchObject({
      id: 'TRIP00000000',
      status: 'confirmed',
      voucherStatus: 'released',
      paymentStatus: 'approved',
    });
    expect(applyDealBookingPaymentDecision(workflow.booking, 'rejected')).toMatchObject({
      id: 'TRIP00000000',
      status: 'payment_rejected',
      voucherStatus: 'blocked',
      paymentStatus: 'rejected',
    });
  });
});
