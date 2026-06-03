import { supabase } from '@/src/lib/supabase';
import type { Listing, PaginatedResult } from '@/src/types/domain';
import { ServiceError } from './errors';

export interface ListingFilters {
  category?: string | null;
  search?: string | null;
  page?: number;
  pageSize?: number;
  vendorId?: string;
}

export type ListingInput = Omit<Listing, 'id' | 'created_at' | 'updated_at'>;

export function getListingRange(page = 1, pageSize = 12) {
  const safePage = Math.max(page, 1);
  const safePageSize = Math.max(Math.min(pageSize, 50), 1);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  return { from, to };
}

export async function listListings(filters: ListingFilters = {}): Promise<PaginatedResult<Listing>> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 12;
  const { from, to } = getListingRange(page, pageSize);

  let request = supabase
    .from('listings')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters.vendorId) {
    request = request.eq('vendor_id', filters.vendorId);
  }

  if (filters.category) {
    const category = filters.category.charAt(0).toUpperCase() + filters.category.slice(1).toLowerCase();
    if (category === 'Stays') {
      request = request.in('category', ['Stays', 'Hotels']);
    } else {
      request = request.eq('category', category);
    }
  }

  if (filters.search) {
    request = request.ilike('title', `%${filters.search}%`);
  }

  const { data, error, count } = await request.returns<Listing[]>();

  if (error) {
    throw new ServiceError(error.message, 'LISTINGS_READ_FAILED', 500);
  }

  return {
    items: data ?? [],
    page,
    pageSize,
    total: count ?? 0,
  };
}

export async function getListingById(id: string) {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single<Listing>();

  if (error) {
    throw new ServiceError(error.message, 'LISTING_READ_FAILED', 404);
  }

  return data;
}

export async function createListing(input: ListingInput) {
  const { data, error } = await supabase
    .from('listings')
    .insert(input)
    .select()
    .single<Listing>();

  if (error) {
    throw new ServiceError(error.message, 'LISTING_CREATE_FAILED', 500);
  }

  return data;
}

export async function updateListing(id: string, input: Partial<ListingInput>) {
  const { data, error } = await supabase
    .from('listings')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single<Listing>();

  if (error) {
    throw new ServiceError(error.message, 'LISTING_UPDATE_FAILED', 500);
  }

  return data;
}
