import { createDealBookingPayment, type DealBookingRecord } from './dealBookingWorkflow';
import type { ManualPaymentIntent } from '@/src/features/payments/manualPayment';
import type { DealInventoryRecord } from './dealInventory';

type PaymentRepository = {
  create: (
    payment: ManualPaymentIntent,
    metadata?: { travelerName?: string; purpose?: string },
  ) => Promise<ManualPaymentIntent & { travelerName?: string; purpose?: string }>;
};

type BookingRepository = {
  create: (booking: DealBookingRecord) => Promise<DealBookingRecord>;
};

type InventoryRepository = {
  reserve: (dealId: string) => Promise<Pick<DealInventoryRecord, 'dealId' | 'remainingInventory'> | null>;
  release: (dealId: string) => Promise<Pick<DealInventoryRecord, 'dealId' | 'remainingInventory'> | null>;
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
  | { status: 400 | 409 | 502; body: { error: string } };

export async function handleCreateDealBooking(
  input: DealBookingRequest,
  dependencies: { paymentRepository: PaymentRepository; bookingRepository: BookingRepository; inventoryRepository?: InventoryRepository },
  options: { upiId?: string } = {},
): Promise<DealBookingRouteResult> {
  const { dealId, dealTitle, amount, travelerName, travelerEmail, travelDate, participants } = input;

  if (!dealId || !dealTitle || !amount || amount <= 0) {
    return {
      status: 400,
      body: { error: 'Missing dealId, dealTitle, or positive amount' },
    };
  }

  let didReserveInventory = false;

  try {
    const reservedInventory = dependencies.inventoryRepository ? await dependencies.inventoryRepository.reserve(dealId) : { dealId, remainingInventory: 0 };
    if (!reservedInventory) {
      return {
        status: 409,
        body: { error: 'Deal is sold out' },
      };
    }
    didReserveInventory = Boolean(dependencies.inventoryRepository);

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
    if (didReserveInventory) {
      try {
        await dependencies.inventoryRepository?.release(dealId);
      } catch {
        // Preserve the API error response even when compensating inventory cleanup fails.
      }
    }
    return {
      status: 502,
      body: { error: 'Deal booking persistence failed' },
    };
  }
}
