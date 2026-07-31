import { supabase } from '@/src/lib/supabase';
import type { Booking } from '@/src/types/domain';
import { ServiceError } from './errors';

export interface CreateBookingInput {
  listingId: string;
  vendorId: string;
  travelerId: string;
  travelerName: string | null;
  startDate: string;
  endDate?: string | null;
  guests: number;
  totalPrice: number;
}

async function assertBookableListing(input: Pick<CreateBookingInput, 'listingId' | 'vendorId' | 'guests'>) {
  const { data, error } = await supabase
    .from('listings')
    .select('id, vendor_id, is_active, max_capacity, vendor_profiles:vendor_id(id, is_active, verification_status)')
    .eq('id', input.listingId)
    .single<{
      id: string;
      vendor_id: string;
      is_active: boolean;
      max_capacity: number | null;
      vendor_profiles?: {
        id: string;
        is_active: boolean;
        verification_status: string;
      } | null;
    }>();

  if (error || !data) {
    throw new ServiceError('Listing is not available for booking', 'BOOKING_LISTING_UNAVAILABLE', 404);
  }

  if (data.vendor_id !== input.vendorId) {
    throw new ServiceError('Listing vendor mismatch', 'BOOKING_VENDOR_MISMATCH', 400);
  }

  if (!data.is_active) {
    throw new ServiceError('This listing is not active for public booking', 'BOOKING_LISTING_INACTIVE', 409);
  }

  if (data.max_capacity && input.guests > data.max_capacity) {
    throw new ServiceError('Guest count exceeds listing capacity', 'BOOKING_CAPACITY_EXCEEDED', 409);
  }

  const vendor = data.vendor_profiles;
  if (!vendor?.is_active || vendor.verification_status !== 'verified') {
    throw new ServiceError('Provider is not approved for public bookings', 'BOOKING_VENDOR_NOT_APPROVED', 409);
  }
}

export async function listTravelerBookings(travelerId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('traveler_id', travelerId)
    .order('created_at', { ascending: false })
    .returns<Booking[]>();

  if (error) {
    throw new ServiceError(error.message, 'TRAVELER_BOOKINGS_READ_FAILED', 500);
  }

  return data ?? [];
}

export async function createBooking(input: CreateBookingInput) {
  await assertBookableListing(input);

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      listing_id: input.listingId,
      vendor_id: input.vendorId,
      traveler_id: input.travelerId,
      traveler_name: input.travelerName,
      start_date: input.startDate,
      end_date: input.endDate ?? null,
      guests: input.guests,
      total_price: input.totalPrice,
      status: 'pending',
      payment_status: 'pending',
    })
    .select('*')
    .single<Booking>();

  if (error) {
    throw new ServiceError(error.message, 'BOOKING_CREATE_FAILED', 500);
  }

  return data;
}

export async function getBookingById(bookingId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single<Booking>();

  if (error) {
    throw new ServiceError(error.message, 'BOOKING_READ_FAILED', 500);
  }

  return data;
}

export async function listVendorBookings(vendorId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })
    .returns<Booking[]>();

  if (error) {
    throw new ServiceError(error.message, 'VENDOR_BOOKINGS_READ_FAILED', 500);
  }

  return data ?? [];
}
