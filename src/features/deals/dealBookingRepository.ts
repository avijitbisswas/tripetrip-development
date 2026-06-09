import {
  applyDealBookingPaymentDecision,
  type DealBookingRecord,
  type DealBookingStatus,
  type DealVoucherStatus,
} from './dealBookingWorkflow';
import type { ManualAdminApprovalStatus } from '@/src/features/payments/manualPayment';

type DealBookingRow = {
  id: string;
  deal_id: string;
  deal_title: string;
  traveler_name?: string | null;
  traveler_email?: string | null;
  travel_date?: string | null;
  participants: number;
  amount: number;
  status: DealBookingStatus;
  payment_status: ManualAdminApprovalStatus;
  voucher_status: DealVoucherStatus;
  payment_intent_id: string;
  voucher_code: string;
  created_at: string;
  updated_at: string;
};

type SupabaseQuery<T> = PromiseLike<{ data: T | null; error: { message?: string } | null }>;
export type DealBookingSupabaseClient = {
  from: (table: string) => {
    insert?: (row: DealBookingRow) => { select: () => { single: () => SupabaseQuery<DealBookingRow> } };
    select?: (columns?: string) => {
      eq?: (column: string, value: string) => { single: () => SupabaseQuery<DealBookingRow> };
    };
    update?: (row: Partial<DealBookingRow>) => {
      eq: (column: string, value: string) => { select: () => { single: () => SupabaseQuery<DealBookingRow> } };
    };
  };
};

function toRow(booking: DealBookingRecord): DealBookingRow {
  return {
    id: booking.id,
    deal_id: booking.dealId,
    deal_title: booking.dealTitle,
    traveler_name: booking.travelerName || null,
    traveler_email: booking.travelerEmail || null,
    travel_date: booking.travelDate || null,
    participants: booking.participants,
    amount: booking.amount,
    status: booking.status,
    payment_status: booking.paymentStatus,
    voucher_status: booking.voucherStatus,
    payment_intent_id: booking.paymentIntentId,
    voucher_code: booking.voucherCode,
    created_at: booking.createdAt,
    updated_at: booking.updatedAt,
  };
}

function fromRow(row: DealBookingRow): DealBookingRecord {
  return {
    id: row.id,
    dealId: row.deal_id,
    dealTitle: row.deal_title,
    travelerName: row.traveler_name || undefined,
    travelerEmail: row.traveler_email || undefined,
    travelDate: row.travel_date || undefined,
    participants: Number(row.participants),
    amount: Number(row.amount),
    status: row.status,
    paymentStatus: row.payment_status,
    voucherStatus: row.voucher_status,
    paymentIntentId: row.payment_intent_id,
    voucherCode: row.voucher_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function raise(error: { message?: string } | null) {
  if (error) throw new Error(error.message || 'Deal booking persistence failed');
}

export function createDealBookingRepository(options: { supabase?: DealBookingSupabaseClient | null } = {}) {
  const memory = new Map<string, DealBookingRecord>();
  const supabase = options.supabase;

  return {
    async create(booking: DealBookingRecord) {
      if (!supabase) {
        memory.set(booking.id, booking);
        return booking;
      }

      const { data, error } = await supabase.from('deal_booking_confirmations').insert?.(toRow(booking)).select().single();
      raise(error);
      return fromRow(data as DealBookingRow);
    },

    async getByBookingId(bookingId: string) {
      if (!supabase) return memory.get(bookingId) || null;

      const { data, error } = await supabase.from('deal_booking_confirmations').select?.('*').eq?.('id', bookingId).single();
      raise(error);
      return data ? fromRow(data as DealBookingRow) : null;
    },

    async getByPaymentIntentId(paymentIntentId: string) {
      if (!supabase) {
        return Array.from(memory.values()).find((booking) => booking.paymentIntentId === paymentIntentId) || null;
      }

      const { data, error } = await supabase
        .from('deal_booking_confirmations')
        .select?.('*')
        .eq?.('payment_intent_id', paymentIntentId)
        .single();
      raise(error);
      return data ? fromRow(data as DealBookingRow) : null;
    },

    async updatePaymentDecision(paymentIntentId: string, decision: Exclude<ManualAdminApprovalStatus, 'pending'>) {
      const current = await this.getByPaymentIntentId(paymentIntentId);
      if (!current) return null;

      const updated = applyDealBookingPaymentDecision(current, decision);
      if (!supabase) {
        memory.set(updated.id, updated);
        return updated;
      }

      const { data, error } = await supabase
        .from('deal_booking_confirmations')
        .update?.({
          status: updated.status,
          payment_status: updated.paymentStatus,
          voucher_status: updated.voucherStatus,
          updated_at: updated.updatedAt,
        })
        .eq('payment_intent_id', paymentIntentId)
        .select()
        .single();
      raise(error);
      return data ? fromRow(data as DealBookingRow) : null;
    },
  };
}
