import { createDealBookingPayment, type DealBookingRecord } from './dealBookingWorkflow';
import type { ManualPaymentIntent } from '@/src/features/payments/manualPayment';

type PaymentRepository = {
  create: (
    payment: ManualPaymentIntent,
    metadata?: { travelerName?: string; purpose?: string },
  ) => Promise<ManualPaymentIntent & { travelerName?: string; purpose?: string }>;
};

type BookingRepository = {
  create: (booking: DealBookingRecord) => Promise<DealBookingRecord>;
};

type DealBookingRequest = {
  dealId?: string;
  dealTitle?: string;
  amount?: number;
  travelerName?: string;
  travelerEmail?: string;
  travelDate?: string;
  participants?: number;
};

export type DealBookingRouteResult =
  | { status: 200; body: { booking: DealBookingRecord; payment: ManualPaymentIntent } }
  | { status: 400 | 502; body: { error: string } };

export async function handleCreateDealBooking(
  input: DealBookingRequest,
  dependencies: { paymentRepository: PaymentRepository; bookingRepository: BookingRepository },
  options: { upiId?: string } = {},
): Promise<DealBookingRouteResult> {
  const { dealId, dealTitle, amount, travelerName, travelerEmail, travelDate, participants } = input;

  if (!dealId || !dealTitle || !amount || amount <= 0) {
    return {
      status: 400,
      body: { error: 'Missing dealId, dealTitle, or positive amount' },
    };
  }

  try {
    const workflow = createDealBookingPayment({
      dealId,
      dealTitle,
      amount,
      travelerName,
      travelerEmail,
      travelDate,
      participants,
      upiId: options.upiId,
    });
    const payment = await dependencies.paymentRepository.create(workflow.payment, { travelerName, purpose: dealTitle });
    const booking = await dependencies.bookingRepository.create({
      ...workflow.booking,
      paymentIntentId: payment.id,
    });

    return { status: 200, body: { booking, payment } };
  } catch {
    return {
      status: 502,
      body: { error: 'Deal booking persistence failed' },
    };
  }
}
