export type DealType = 'FLASH_SALE' | 'LAST_MINUTE' | 'FESTIVAL' | 'SEASONAL' | 'WEEKEND';
export type DealCategory = 'STAY' | 'PACKAGE' | 'ACTIVITY' | 'TRANSPORT';

export interface Provider {
  id: string;
  name: string;
  logo: string;
  verified: boolean;
  rating: number;
  responseTime: string;
}

export interface DealModel {
  id: string;
  slug: string;
  title: string;
  description: string;
  dealType: DealType;
  category: DealCategory;
  providerId: string;
  destination: string;
  coverImage: string;
  gallery: string[];
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  amountSaved: number;
  startDate: string;
  endDate: string;
  inventoryCount: number;
  remainingInventory: number;
  maxBookings: number;
  bookingCount: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
