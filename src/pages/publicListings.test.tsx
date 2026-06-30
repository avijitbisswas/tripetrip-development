import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import PublicVendorPage from '@/src/pages/PublicVendorPage';
import StayListingDetail from '@/src/pages/stays/ListingDetail';
import ListingDetail from '@/src/pages/ListingDetail';

vi.mock('@/src/services/vendors', () => ({
  getVendorBySlug: vi.fn(),
}));

vi.mock('@/src/services/listings', async () => {
  const actual = await vi.importActual<object>('@/src/services/listings');
  return {
    ...actual,
    listListings: vi.fn(),
    getListingById: vi.fn(),
  };
});

import { getVendorBySlug } from '@/src/services/vendors';
import { getListingById, listListings } from '@/src/services/listings';

const mockedGetVendorBySlug = vi.mocked(getVendorBySlug);
const mockedListListings = vi.mocked(listListings);
const mockedGetListingById = vi.mocked(getListingById);

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('public vendor listings', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  it('routes vendor stay listings to the stay detail path and other listings to the generic listing path', async () => {
    mockedGetVendorBySlug.mockResolvedValue({
      id: 'vendor-1',
      user_id: 'user-1',
      business_name: 'Tripetrip Stays',
      business_type: 'hotel',
      business_email: null,
      business_phone: null,
      description: null,
      slug: 'tripetrip-stays',
      custom_website: null,
      logo_url: null,
      banner_url: null,
      social_links: null,
      address: null,
      city: null,
      state: null,
      pincode: null,
      lat: null,
      lng: null,
      verification_status: 'verified',
      trust_score: 92,
      total_reviews: 14,
      is_active: true,
      created_at: new Date().toISOString(),
    });
    mockedListListings.mockResolvedValue({
      items: [
        {
          id: 'stay-db-1',
          vendor_id: 'vendor-1',
          title: 'Cloud Valley Stay',
          description: 'Lake view stay',
          category: 'Stays',
          base_price: 6400,
          price_unit: 'per_night',
          max_capacity: 4,
          images: ['https://example.com/stay.jpg'],
          amenities: ['Breakfast'],
          location: 'Nainital',
          lat: null,
          lng: null,
          specifics: {},
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: null,
        },
        {
          id: 'tour-db-1',
          vendor_id: 'vendor-1',
          title: 'Mountain Food Trail',
          description: 'Local food crawl',
          category: 'Food',
          base_price: 2200,
          price_unit: 'per_person',
          max_capacity: 8,
          images: ['https://example.com/food.jpg'],
          amenities: ['Guide'],
          location: 'Shimla',
          lat: null,
          lng: null,
          specifics: {},
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: null,
        },
      ],
      page: 1,
      pageSize: 24,
      total: 2,
    });

    render(
      <MemoryRouter initialEntries={['/v/tripetrip-stays']}>
        <Routes>
          <Route path="/v/:slug" element={<PublicVendorPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: /Cloud Valley Stay/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Cloud Valley Stay/i })).toHaveAttribute('href', '/stays/stay-db-1');
    expect(screen.getByRole('link', { name: /Mountain Food Trail/i })).toHaveAttribute('href', '/listing/tour-db-1');
  });

  it('renders a data-backed stay detail page when the listing id is not part of the static catalog', async () => {
    mockedGetListingById.mockResolvedValue({
      id: 'stay-db-1',
      vendor_id: 'vendor-1',
      title: 'Cloud Valley Stay',
      description: 'Lake-facing rooms with breakfast and parking.',
      category: 'Stays',
      base_price: 6400,
      price_unit: 'per_night',
      max_capacity: 4,
      images: ['https://example.com/stay.jpg'],
      amenities: ['Breakfast', 'Parking'],
      location: 'Nainital',
      lat: null,
      lng: null,
      specifics: { property_type: 'Resort', check_in: '13:00', check_out: '11:00' },
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: null,
    });

    render(
      <MemoryRouter initialEntries={['/stays/stay-db-1']}>
        <Routes>
          <Route path="/stays/:id" element={<StayListingDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: /Cloud Valley Stay/i })).toBeInTheDocument();
    expect(screen.getByText(/Lake-facing rooms with breakfast and parking/i)).toBeInTheDocument();
    expect(screen.getByText(/Nainital/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Breakfast/i).length).toBeGreaterThan(0);
  });

  it('renders a data-backed generic listing page when the listing id is not part of the static catalog', async () => {
    mockedGetListingById.mockResolvedValue({
      id: 'experience-db-1',
      vendor_id: 'vendor-1',
      title: 'Mountain Food Trail',
      description: 'Curated local tasting with a host-led walk.',
      category: 'Food',
      base_price: 2200,
      price_unit: 'per_person',
      max_capacity: 8,
      images: ['https://example.com/food.jpg'],
      amenities: ['Guide', 'Snacks'],
      location: 'Shimla',
      lat: null,
      lng: null,
      specifics: { duration: '3 hours' },
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: null,
    });

    render(
      <MemoryRouter initialEntries={['/listing/experience-db-1']}>
        <Routes>
          <Route path="/listing/:id" element={<ListingDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: /Mountain Food Trail/i })).toBeInTheDocument();
    expect(screen.getByText(/Curated local tasting with a host-led walk/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Shimla/i).length).toBeGreaterThan(0);
    await waitFor(() => expect(mockedGetListingById).toHaveBeenCalledWith('experience-db-1'));
  });
});
