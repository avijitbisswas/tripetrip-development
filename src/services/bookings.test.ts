import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '@/src/lib/supabase';
import { createBooking, getBookingById } from './bookings';

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('booking services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a booking in Supabase and returns the saved row', async () => {
    const listingSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'listing-1',
        vendor_id: 'vendor-1',
        is_active: true,
        max_capacity: 4,
        vendor_profiles: {
          id: 'vendor-1',
          is_active: true,
          verification_status: 'verified',
        },
      },
      error: null,
    });
    const listingEq = vi.fn(() => ({ single: listingSingle }));
    const listingSelect = vi.fn(() => ({ eq: listingEq }));
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'booking-1',
        listing_id: 'listing-1',
        vendor_id: 'vendor-1',
        traveler_id: 'traveler-1',
        traveler_name: 'Avi',
        start_date: '2026-07-02T00:00:00.000Z',
        end_date: null,
        guests: 2,
        total_price: 6400,
        status: 'pending',
        payment_status: 'pending',
        created_at: '2026-06-29T00:00:00.000Z',
      },
      error: null,
    });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'listings') return { select: listingSelect } as never;
      return { insert } as never;
    });

    const booking = await createBooking({
      listingId: 'listing-1',
      vendorId: 'vendor-1',
      travelerId: 'traveler-1',
      travelerName: 'Avi',
      startDate: '2026-07-02T00:00:00.000Z',
      guests: 2,
      totalPrice: 6400,
    });

    expect(supabase.from).toHaveBeenCalledWith('listings');
    expect(supabase.from).toHaveBeenCalledWith('bookings');
    expect(insert).toHaveBeenCalledWith({
      listing_id: 'listing-1',
      vendor_id: 'vendor-1',
      traveler_id: 'traveler-1',
      traveler_name: 'Avi',
      start_date: '2026-07-02T00:00:00.000Z',
      end_date: null,
      guests: 2,
      total_price: 6400,
      status: 'pending',
      payment_status: 'pending',
    });
    expect(booking.id).toBe('booking-1');
  });

  it('blocks public booking when the provider is not approved', async () => {
    const listingSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'listing-1',
        vendor_id: 'vendor-1',
        is_active: true,
        max_capacity: 4,
        vendor_profiles: {
          id: 'vendor-1',
          is_active: true,
          verification_status: 'pending',
        },
      },
      error: null,
    });
    const listingEq = vi.fn(() => ({ single: listingSingle }));
    const listingSelect = vi.fn(() => ({ eq: listingEq }));
    vi.mocked(supabase.from).mockReturnValue({ select: listingSelect } as never);

    await expect(
      createBooking({
        listingId: 'listing-1',
        vendorId: 'vendor-1',
        travelerId: 'traveler-1',
        travelerName: 'Avi',
        startDate: '2026-07-02T00:00:00.000Z',
        guests: 2,
        totalPrice: 6400,
      }),
    ).rejects.toMatchObject({
      code: 'BOOKING_VENDOR_NOT_APPROVED',
    });
  });

  it('blocks public booking when guest count exceeds listing capacity', async () => {
    const listingSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'listing-1',
        vendor_id: 'vendor-1',
        is_active: true,
        max_capacity: 2,
        vendor_profiles: {
          id: 'vendor-1',
          is_active: true,
          verification_status: 'verified',
        },
      },
      error: null,
    });
    const listingEq = vi.fn(() => ({ single: listingSingle }));
    const listingSelect = vi.fn(() => ({ eq: listingEq }));
    vi.mocked(supabase.from).mockReturnValue({ select: listingSelect } as never);

    await expect(
      createBooking({
        listingId: 'listing-1',
        vendorId: 'vendor-1',
        travelerId: 'traveler-1',
        travelerName: 'Avi',
        startDate: '2026-07-02T00:00:00.000Z',
        guests: 3,
        totalPrice: 6400,
      }),
    ).rejects.toMatchObject({
      code: 'BOOKING_CAPACITY_EXCEEDED',
    });
  });

  it('loads a booking by id', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'booking-1',
        listing_id: 'listing-1',
        vendor_id: 'vendor-1',
        traveler_id: 'traveler-1',
        traveler_name: 'Avi',
        start_date: '2026-07-02T00:00:00.000Z',
        end_date: null,
        guests: 2,
        total_price: 6400,
        status: 'pending',
        payment_status: 'pending',
        created_at: '2026-06-29T00:00:00.000Z',
      },
      error: null,
    });
    const eq = vi.fn(() => ({ single }));
    const select = vi.fn(() => ({ eq }));
    vi.mocked(supabase.from).mockReturnValue({ select } as never);

    const booking = await getBookingById('booking-1');

    expect(supabase.from).toHaveBeenCalledWith('bookings');
    expect(select).toHaveBeenCalledWith('*');
    expect(eq).toHaveBeenCalledWith('id', 'booking-1');
    expect(booking.id).toBe('booking-1');
  });
});
