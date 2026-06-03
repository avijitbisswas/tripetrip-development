import { dealModels, getDealBySlug, providers } from './data';

export async function fetchDeals() {
  return { deals: dealModels, providers };
}

export async function fetchDeal(slug: string) {
  return getDealBySlug(slug);
}

export async function reserveDeal(slug: string) {
  return {
    bookingId: 'TRIP67845291',
    slug,
    status: 'reserved' as const,
  };
}
