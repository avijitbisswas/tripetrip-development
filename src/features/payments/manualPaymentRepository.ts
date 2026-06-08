import { updateManualPaymentStatus, type ManualAdminApprovalStatus, type ManualPaymentIntent } from './manualPayment';

type ManualPaymentRow = {
  id: string;
  booking_id: string;
  amount: number;
  currency: 'INR';
  method: 'barcode_manual';
  status: ManualPaymentIntent['status'];
  admin_approval_status: ManualAdminApprovalStatus;
  reference: string;
  barcode_payload: string;
  instructions: string;
  traveler_name?: string | null;
  purpose?: string | null;
};

type SupabaseQuery<T> = PromiseLike<{ data: T | null; error: { message?: string } | null }>;
export type ManualPaymentSupabaseClient = {
  from: (table: string) => {
    insert?: (row: ManualPaymentRow) => { select: () => { single: () => SupabaseQuery<ManualPaymentRow> } };
    select?: (columns?: string) => {
      order?: (column: string, options?: { ascending?: boolean }) => SupabaseQuery<ManualPaymentRow[]>;
      eq?: (column: string, value: string) => { single: () => SupabaseQuery<ManualPaymentRow> };
    };
    update?: (row: Partial<ManualPaymentRow> & { approved_at?: string; rejected_at?: string }) => {
      eq: (column: string, value: string) => { select: () => { single: () => SupabaseQuery<ManualPaymentRow> } };
    };
  };
};

type CreateMetadata = {
  travelerName?: string;
  purpose?: string;
};

function toRow(intent: ManualPaymentIntent, metadata: CreateMetadata = {}): ManualPaymentRow {
  return {
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
    traveler_name: metadata.travelerName || null,
    purpose: metadata.purpose || null,
  };
}

function fromRow(row: ManualPaymentRow): ManualPaymentIntent & CreateMetadata {
  return {
    id: row.id,
    bookingId: row.booking_id,
    amount: Number(row.amount),
    currency: row.currency,
    method: row.method,
    status: row.status,
    adminApprovalStatus: row.admin_approval_status,
    reference: row.reference,
    barcodePayload: row.barcode_payload,
    instructions: row.instructions,
    travelerName: row.traveler_name || undefined,
    purpose: row.purpose || undefined,
  };
}

function raise(error: { message?: string } | null) {
  if (error) throw new Error(error.message || 'Manual payment persistence failed');
}

export function createManualPaymentRepository(options: { supabase?: ManualPaymentSupabaseClient | null } = {}) {
  const memory = new Map<string, ManualPaymentIntent & CreateMetadata>();
  const supabase = options.supabase;

  return {
    async create(intent: ManualPaymentIntent, metadata?: CreateMetadata) {
      if (!supabase) {
        const record = { ...intent, ...metadata };
        memory.set(intent.id, record);
        return record;
      }

      const { data, error } = await supabase.from('manual_payment_intents').insert?.(toRow(intent, metadata)).select().single();
      raise(error);
      return fromRow(data as ManualPaymentRow);
    },

    async get(id: string) {
      if (!supabase) return memory.get(id) || null;

      const { data, error } = await supabase.from('manual_payment_intents').select?.('*').eq?.('id', id).single();
      raise(error);
      return data ? fromRow(data as ManualPaymentRow) : null;
    },

    async list() {
      if (!supabase) return Array.from(memory.values());

      const { data, error } = await supabase
        .from('manual_payment_intents')
        .select?.('*')
        .order?.('created_at', { ascending: false });
      raise(error);
      return (data || []).map((row) => fromRow(row as ManualPaymentRow));
    },

    async updateStatus(id: string, status: Exclude<ManualAdminApprovalStatus, 'pending'>) {
      if (!supabase) {
        const current = memory.get(id);
        if (!current) return null;
        const updated = { ...updateManualPaymentStatus(current, status), travelerName: current.travelerName, purpose: current.purpose };
        memory.set(id, updated);
        return updated;
      }

      const timestampKey = status === 'approved' ? 'approved_at' : 'rejected_at';
      const { data, error } = await supabase
        .from('manual_payment_intents')
        .update?.({
          status,
          admin_approval_status: status,
          [timestampKey]: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      raise(error);
      return data ? fromRow(data as ManualPaymentRow) : null;
    },
  };
}
