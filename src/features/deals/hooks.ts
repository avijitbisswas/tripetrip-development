import { useQuery } from '@tanstack/react-query';
import { fetchDeal, fetchDeals } from './api';

export function useDealsQuery() {
  return useQuery({ queryKey: ['deals'], queryFn: fetchDeals });
}

export function useDealQuery(slug: string) {
  return useQuery({ queryKey: ['deals', slug], queryFn: () => fetchDeal(slug) });
}
