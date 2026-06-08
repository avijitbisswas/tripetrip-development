import { describe, expect, it, vi } from 'vitest';
import { buildManualPaymentIntent, updateManualPaymentStatus } from './manualPayment';

describe('manual payment helpers', () => {
  it('creates a barcode-ready payment intent awaiting admin approval', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1780912345678);

    const intent = buildManualPaymentIntent({
      amount: 9999,
      bookingId: 'TRIP67845291',
      travelerName: 'Rohit Sharma',
      purpose: 'Goa Beach Escape',
      upiId: 'tripetrip@upi',
    });

    expect(intent).toEqual({
      id: 'manual_1780912345678',
      bookingId: 'TRIP67845291',
      amount: 9999,
      currency: 'INR',
      method: 'barcode_manual',
      status: 'awaiting_admin_approval',
      adminApprovalStatus: 'pending',
      reference: 'TRIP67845291-9999',
      barcodePayload: 'upi://pay?pa=tripetrip%40upi&pn=Tripetrip&am=9999.00&cu=INR&tn=TRIP67845291-Goa%20Beach%20Escape',
      instructions: 'Scan the barcode, complete payment, then wait for Tripetrip admin approval.',
    });
  });

  it('approves or rejects a manual payment without changing the reference', () => {
    const intent = buildManualPaymentIntent({ amount: 1200, bookingId: 'TRIP123' });

    expect(updateManualPaymentStatus(intent, 'approved')).toMatchObject({
      reference: 'TRIP123-1200',
      status: 'approved',
      adminApprovalStatus: 'approved',
    });

    expect(updateManualPaymentStatus(intent, 'rejected')).toMatchObject({
      reference: 'TRIP123-1200',
      status: 'rejected',
      adminApprovalStatus: 'rejected',
    });
  });
});
