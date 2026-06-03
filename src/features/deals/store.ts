import { create } from 'zustand';

interface DealState {
  wishlist: string[];
  alerts: string[];
  toggleWishlist: (slug: string) => void;
  subscribePriceDrop: (slug: string) => void;
}

export const useDealStore = create<DealState>((set) => ({
  wishlist: [],
  alerts: [],
  toggleWishlist: (slug) =>
    set((state) => ({
      wishlist: state.wishlist.includes(slug) ? state.wishlist.filter((item) => item !== slug) : [...state.wishlist, slug],
    })),
  subscribePriceDrop: (slug) =>
    set((state) => ({
      alerts: state.alerts.includes(slug) ? state.alerts : [...state.alerts, slug],
    })),
}));
