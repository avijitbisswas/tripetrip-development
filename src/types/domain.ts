export type UserRole = 'traveler' | 'vendor' | 'admin';

export type PriceUnit = 'per_night' | 'per_person' | 'per_day' | 'fixed';

export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export type PaymentStatus = 'pending' | 'escrowed' | 'released' | 'refunded';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
}

export interface VendorProfile {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string;
  business_email: string | null;
  business_phone: string | null;
  description: string | null;
  slug: string;
  custom_website: string | null;
  logo_url: string | null;
  banner_url: string | null;
  social_links: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
  } | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  lat: number | null;
  lng: number | null;
  verification_status: VerificationStatus;
  trust_score: number;
  total_reviews: number;
  is_active: boolean;
  created_at: string;
}

export interface Listing {
  id: string;
  vendor_id: string;
  title: string;
  description: string;
  category: string;
  base_price: number;
  price_unit: PriceUnit;
  max_capacity: number | null;
  images: string[];
  amenities: string[];
  location: string;
  lat: number | null;
  lng: number | null;
  specifics: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface Booking {
  id: string;
  listing_id: string;
  vendor_id: string;
  traveler_id: string;
  traveler_name: string | null;
  start_date: string;
  end_date: string | null;
  guests: number;
  total_price: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  created_at: string;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
