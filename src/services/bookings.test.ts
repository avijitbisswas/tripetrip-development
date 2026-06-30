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
    vi.mocked(supabase.from).mockReturnValue({ insert } as never);

    const booking = await createBooking({
      listingId: 'listing-1',
      vendorId: 'vendor-1',
      travelerId: 'traveler-1',
      travelerName: 'Avi',
      startDate: '2026-07-02T00:00:00.000Z',
      guests: 2,
      totalPrice: 6400,
    });

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
