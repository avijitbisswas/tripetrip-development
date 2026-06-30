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
