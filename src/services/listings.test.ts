import { describe, expect, it, vi } from 'vitest';
import { getListingRange } from './listings';

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('getListingRange', () => {
  it('calculates Supabase range for the first page', () => {
    expect(getListingRange(1, 12)).toEqual({ from: 0, to: 11 });
  });

  it('calculates Supabase range for later pages', () => {
    expect(getListingRange(3, 10)).toEqual({ from: 20, to: 29 });
  });
});
