export type ManualPaymentStatus = 'awaiting_admin_approval' | 'approved' | 'rejected';
export type ManualAdminApprovalStatus = 'pending' | 'approved' | 'rejected';

export type ManualPaymentIntent = {
  id: string;
  bookingId: string;
  amount: number;
  currency: 'INR';
  method: 'barcode_manual';
  status: ManualPaymentStatus;
  adminApprovalStatus: ManualAdminApprovalStatus;
  reference: string;
  barcodePayload: string;
  instructions: string;
};

export type ManualPaymentInput = {
  amount: number;
  bookingId?: string;
  travelerName?: string;
  purpose?: string;
  upiId?: string;
};

function normalizeAmount(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.round(amount);
}

export function buildManualPaymentIntent(input: ManualPaymentInput): ManualPaymentIntent {
  const amount = normalizeAmount(input.amount);
  const bookingId = input.bookingId || `TRIP${Date.now()}`;
  const purpose = input.purpose || 'Tripetrip booking';
  const upiId = input.upiId || 'tripetrip@upi';
  const reference = `${bookingId}-${amount}`;
  const barcodePayload = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=Tripetrip&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`${bookingId}-${purpose}`)}`;

  return {
    id: `manual_${Date.now()}`,
    bookingId,
    amount,
    currency: 'INR',
    method: 'barcode_manual',
    status: 'awaiting_admin_approval',
    adminApprovalStatus: 'pending',
    reference,
    barcodePayload,
    instructions: 'Scan the barcode, complete payment, then wait for Tripetrip admin approval.',
  };
}

export function updateManualPaymentStatus(
  intent: ManualPaymentIntent,
  approvalStatus: Exclude<ManualAdminApprovalStatus, 'pending'>,
): ManualPaymentIntent {
  return {
    ...intent,
    status: approvalStatus,
    adminApprovalStatus: approvalStatus,
  };
}
