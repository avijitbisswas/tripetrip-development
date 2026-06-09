import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDealInventoryRepository } from './dealInventory';

describe('deal inventory repository', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(1781000000000);
  });

  it('reserves and releases deal inventory in memory for local QA flows', async () => {
    const repository = createDealInventoryRepository({
      seed: [
        {
          dealId: 'goa-beach-escape',
          totalInventory: 3,
          remainingInventory: 2,
          reservedCount: 1,
          soldCount: 0,
          updatedAt: '2026-06-09T00:00:00.000Z',
        },
      ],
    });

    await expect(repository.reserve('goa-beach-escape')).resolves.toMatchObject({
      dealId: 'goa-beach-escape',
      remainingInventory: 1,
      reservedCount: 2,
    });
    await expect(repository.release('goa-beach-escape')).resolves.toMatchObject({
      dealId: 'goa-beach-escape',
      remainingInventory: 2,
      reservedCount: 1,
    });
  });

  it('rejects reservations when inventory is sold out', async () => {
    const repository = createDealInventoryRepository({
      seed: [
        {
          dealId: 'goa-beach-escape',
          totalInventory: 1,
          remainingInventory: 0,
          reservedCount: 1,
          soldCount: 0,
          updatedAt: '2026-06-09T00:00:00.000Z',
        },
      ],
    });

    await expect(repository.reserve('goa-beach-escape')).resolves.toEqual(null);
  });

  it('maps inventory updates to Supabase rows for production persistence', async () => {
    const row = {
      deal_id: 'goa-beach-escape',
      total_inventory: 3,
      remaining_inventory: 2,
      reserved_count: 1,
      sold_count: 0,
      updated_at: '2026-06-09T00:00:00.000Z',
    };
    const readSingle = vi.fn().mockResolvedValue({ data: row, error: null });
    const readEq = vi.fn(() => ({ single: readSingle }));
    const select = vi.fn(() => ({ eq: readEq }));
    const updateSingle = vi.fn().mockResolvedValue({
      data: { ...row, remaining_inventory: 1, reserved_count: 2 },
      error: null,
    });
    const updateSelect = vi.fn(() => ({ single: updateSingle }));
    const updateEq = vi.fn(() => ({ select: updateSelect }));
    const update = vi.fn(() => ({ eq: updateEq }));
    const from = vi.fn().mockReturnValueOnce({ select }).mockReturnValueOnce({ update });
    const repository = createDealInventoryRepository({ supabase: { from } });

    await expect(repository.reserve('goa-beach-escape')).resolves.toMatchObject({
      dealId: 'goa-beach-escape',
      remainingInventory: 1,
      reservedCount: 2,
    });
    expect(from).toHaveBeenCalledWith('deal_inventory');
    expect(update).toHaveBeenCalledWith({
      remaining_inventory: 1,
      reserved_count: 2,
      updated_at: expect.any(String),
    });
    expect(updateEq).toHaveBeenCalledWith('deal_id', 'goa-beach-escape');
  });
});
