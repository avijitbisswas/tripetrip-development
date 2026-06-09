export type DealInventoryRecord = {
  dealId: string;
  totalInventory: number;
  remainingInventory: number;
  reservedCount: number;
  soldCount: number;
  updatedAt: string;
};

type DealInventoryRow = {
  deal_id: string;
  total_inventory: number;
  remaining_inventory: number;
  reserved_count: number;
  sold_count: number;
  updated_at: string;
};

type SupabaseQuery<T> = PromiseLike<{ data: T | null; error: { message?: string } | null }>;
export type DealInventorySupabaseClient = {
  from: (table: string) => {
    select?: (columns?: string) => {
      eq?: (column: string, value: string) => { single: () => SupabaseQuery<DealInventoryRow> };
    };
    update?: (row: Partial<DealInventoryRow>) => {
      eq: (column: string, value: string) => { select: () => { single: () => SupabaseQuery<DealInventoryRow> } };
    };
  };
};

const defaultInventory: DealInventoryRecord[] = [
  { dealId: 'goa-beach-escape', totalInventory: 40, remainingInventory: 8, reservedCount: 0, soldCount: 342, updatedAt: new Date(0).toISOString() },
  { dealId: 'manali-snow-retreat', totalInventory: 24, remainingInventory: 9, reservedCount: 0, soldCount: 117, updatedAt: new Date(0).toISOString() },
  { dealId: 'scuba-diving-adventure', totalInventory: 24, remainingInventory: 8, reservedCount: 0, soldCount: 206, updatedAt: new Date(0).toISOString() },
];

function fromRow(row: DealInventoryRow): DealInventoryRecord {
  return {
    dealId: row.deal_id,
    totalInventory: Number(row.total_inventory),
    remainingInventory: Number(row.remaining_inventory),
    reservedCount: Number(row.reserved_count),
    soldCount: Number(row.sold_count),
    updatedAt: row.updated_at,
  };
}

function toUpdate(record: DealInventoryRecord): Partial<DealInventoryRow> {
  return {
    remaining_inventory: record.remainingInventory,
    reserved_count: record.reservedCount,
    updated_at: record.updatedAt,
  };
}

function raise(error: { message?: string } | null) {
  if (error) throw new Error(error.message || 'Deal inventory persistence failed');
}

export function createDealInventoryRepository(options: { seed?: DealInventoryRecord[]; supabase?: DealInventorySupabaseClient | null } = {}) {
  const memory = new Map<string, DealInventoryRecord>(
    (options.seed || defaultInventory).map((record) => [record.dealId, { ...record }]),
  );
  const supabase = options.supabase;

  async function read(dealId: string) {
    if (!supabase) return memory.get(dealId) || null;

    const { data, error } = await supabase.from('deal_inventory').select?.('*').eq?.('deal_id', dealId).single();
    raise(error);
    return data ? fromRow(data as DealInventoryRow) : null;
  }

  async function save(record: DealInventoryRecord) {
    if (!supabase) {
      memory.set(record.dealId, record);
      return record;
    }

    const { data, error } = await supabase
      .from('deal_inventory')
      .update?.(toUpdate(record))
      .eq('deal_id', record.dealId)
      .select()
      .single();
    raise(error);
    return data ? fromRow(data as DealInventoryRow) : record;
  }

  return {
    async get(dealId: string) {
      return read(dealId);
    },

    async reserve(dealId: string) {
      const current = await read(dealId);
      if (!current || current.remainingInventory <= 0) return null;

      return save({
        ...current,
        remainingInventory: current.remainingInventory - 1,
        reservedCount: current.reservedCount + 1,
        updatedAt: new Date(Date.now()).toISOString(),
      });
    },

    async release(dealId: string) {
      const current = await read(dealId);
      if (!current) return null;

      return save({
        ...current,
        remainingInventory: current.remainingInventory + 1,
        reservedCount: Math.max(0, current.reservedCount - 1),
        updatedAt: new Date(Date.now()).toISOString(),
      });
    },
  };
}
