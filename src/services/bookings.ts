import { supabase } from '@/src/lib/supabase';
import type { Booking } from '@/src/types/domain';
import { ServiceError } from './errors';

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
