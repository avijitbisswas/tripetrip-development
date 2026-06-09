import { buildManualPaymentIntent, type ManualAdminApprovalStatus, type ManualPaymentIntent } from '@/src/features/payments/manualPayment';

export type DealBookingStatus = 'awaiting_payment_approval' | 'confirmed' | 'payment_rejected';
export type DealVoucherStatus = 'locked' | 'released' | 'blocked';

export type DealBookingRecord = {
  id: string;
  dealId: string;
  dealTitle: string;
  travelerName?: string;
  travelerEmail?: string;
  travelDate?: string;
  participants: number;
  amount: number;
  status: DealBookingStatus;
  paymentStatus: ManualAdminApprovalStatus;
  voucherStatus: DealVoucherStatus;
  paymentIntentId: string;
  voucherCode: string;
  createdAt: string;
  updatedAt: string;
};

export type DealBookingInput = {
  dealId: string;
  dealTitle: string;
  amount: number;
  travelerName?: string;
  travelerEmail?: string;
  travelDate?: string;
  participants?: number;
  bookingId?: string;
  upiId?: string;
};

export type DealBookingWorkflow = {
  booking: DealBookingRecord;
  payment: ManualPaymentIntent;
};

function buildBookingId() {
  const suffix = String(Date.now()).slice(-8).padStart(8, '0');
  return `TRIP${suffix}`;
}

export function createDealBookingPayment(input: DealBookingInput): DealBookingWorkflow {
  const now = new Date(Date.now()).toISOString();
  const bookingId = input.bookingId || buildBookingId();
  const payment = buildManualPaymentIntent({
    amount: input.amount,
    bookingId,
    travelerName: input.travelerName,
    purpose: input.dealTitle,
    upiId: input.upiId,
  });

  return {
    booking: {
      id: bookingId,
      dealId: input.dealId,
      dealTitle: input.dealTitle,
      travelerName: input.travelerName,
      travelerEmail: input.travelerEmail,
      travelDate: input.travelDate,
      participants: input.participants || 1,
      amount: payment.amount,
      status: 'awaiting_payment_approval',
      paymentStatus: 'pending',
      voucherStatus: 'locked',
      paymentIntentId: payment.id,
      voucherCode: `VCH-${bookingId}`,
      createdAt: now,
      updatedAt: now,
    },
    payment,
  };
}

export function applyDealBookingPaymentDecision(
  booking: DealBookingRecord,
  decision: Exclude<ManualAdminApprovalStatus, 'pending'>,
): DealBookingRecord {
  const approved = decision === 'approved';

  return {
    ...booking,
    status: approved ? 'confirmed' : 'payment_rejected',
    paymentStatus: decision,
    voucherStatus: approved ? 'released' : 'blocked',
    updatedAt: new Date(Date.now()).toISOString(),
  };
}
