import type { DealModel, Provider } from './types';

export const providers: Provider[] = [
  { id: 'tripgo', name: 'TripGo Holidays', logo: 'TG', verified: true, rating: 4.8, responseTime: '< 15 min' },
  { id: 'himtrips', name: 'HimTrips', logo: 'HT', verified: true, rating: 4.7, responseTime: '< 25 min' },
  { id: 'oceanic', name: 'Oceanic Adventures', logo: 'OA', verified: true, rating: 4.9, responseTime: '< 10 min' },
];

export const dealModels: DealModel[] = [
  {
    id: 'deal_goa',
    slug: 'goa-beach-escape',
    title: 'Goa Beach Escape',
    description: 'Premium beach escape with hotel, breakfast, sightseeing, and direct-booking savings.',
    dealType: 'FLASH_SALE',
    category: 'PACKAGE',
    providerId: 'tripgo',
    destination: 'Goa, India',
    coverImage: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&q=90&w=1200',
    gallery: [
      'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&q=90&w=1200',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=90&w=1200',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=90&w=1200',
    ],
    originalPrice: 14999,
    discountedPrice: 9999,
    discountPercentage: 30,
    amountSaved: 5000,
    startDate: '2026-05-24',
    endDate: '2026-06-30',
    inventoryCount: 40,
    remainingInventory: 8,
    maxBookings: 500,
    bookingCount: 342,
    rating: 4.8,
    reviewCount: 320,
    featured: true,
    active: true,
    createdAt: '2026-06-02T00:00:00.000Z',
    updatedAt: '2026-06-02T00:00:00.000Z',
  },
  {
    id: 'deal_manali',
    slug: 'manali-snow-retreat',
    title: 'Manali Snow Retreat',
    description: 'Last-minute mountain stay with verified direct-booking pricing.',
    dealType: 'LAST_MINUTE',
    category: 'STAY',
    providerId: 'himtrips',
    destination: 'Manali, Himachal',
    coverImage: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&q=90&w=1200',
    gallery: [],
    originalPrice: 18999,
    discountedPrice: 13999,
    discountPercentage: 26,
    amountSaved: 5000,
    startDate: '2026-06-02',
    endDate: '2026-06-08',
    inventoryCount: 24,
    remainingInventory: 9,
    maxBookings: 220,
    bookingCount: 117,
    rating: 4.7,
    reviewCount: 184,
    featured: true,
    active: true,
    createdAt: '2026-06-02T00:00:00.000Z',
    updatedAt: '2026-06-02T00:00:00.000Z',
  },
];

export function getDealBySlug(slug: string) {
  return dealModels.find((deal) => deal.slug === slug) ?? dealModels[0];
}

export function getProvider(providerId: string) {
  return providers.find((provider) => provider.id === providerId) ?? providers[0];
}
