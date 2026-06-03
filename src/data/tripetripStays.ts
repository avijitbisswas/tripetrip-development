import type { LucideIcon } from 'lucide-react';
import { BadgeCheck, BedDouble, Coffee, Dumbbell, Home, ParkingCircle, ShieldCheck, Sparkles, Waves, Wifi } from 'lucide-react';

export type TripPackage = {
  id: string;
  title: string;
  location: string;
  region: string;
  duration: string;
  propertyType: string;
  provider: string;
  providerLogo: string;
  hostPhoto: string;
  rating: number;
  reviews: number;
  bookings: number;
  originalPrice: number;
  directPrice: number;
  savings: number;
  heroImage: string;
  images: string[];
  overview: string;
  highlights: string[];
  included: string[];
  excluded: string[];
  features: string[];
  amenities: string[];
};

export const inclusions: { label: string; icon: LucideIcon }[] = [
  { label: '2 Bedrooms', icon: BedDouble },
  { label: '2 Bathrooms', icon: Home },
  { label: 'Sea View', icon: Waves },
  { label: 'Private Pool', icon: Sparkles },
  { label: 'Free WiFi', icon: Wifi },
];

export const trustBadges = [
  { label: 'Verified Properties', icon: ShieldCheck },
  { label: 'Best Direct Prices', icon: BadgeCheck },
  { label: 'Free Cancellation', icon: ShieldCheck },
  { label: 'Secure Booking', icon: ShieldCheck },
];

const villa = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=90&w=1800';
const poolVilla = 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=90&w=1400';
const lakeResort = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=90&w=1400';
const mountainHome = 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=90&w=1400';
const hostel = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=90&w=1400';
const retreat = 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=90&w=1400';
const jungle = 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=90&w=1400';
const haveli = 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&q=90&w=1400';
const cottage = 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&q=90&w=1400';
const camp = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=90&w=1400';
const apartment = 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&q=90&w=1400';

export const packages: TripPackage[] = [
  {
    id: 'luxury-beach-villa',
    title: 'Luxury Beach Villa',
    location: 'Calangute, North Goa',
    region: 'Goa',
    duration: 'Entire Villa',
    propertyType: 'Villa',
    provider: "John D'Souza",
    providerLogo: 'JD',
    hostPhoto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=90&w=300',
    rating: 4.8,
    reviews: 210,
    bookings: 500,
    originalPrice: 10999,
    directPrice: 8499,
    savings: 2500,
    heroImage: villa,
    images: [villa, poolVilla, lakeResort, cottage, retreat],
    overview: 'Experience luxury and tranquility at this stunning beach villa in North Goa. Enjoy a private pool, sea view, modern amenities and personalized service. Perfect for families, couples and groups.',
    highlights: ['Verified Property', 'Superhost', 'Direct Booking Savings'],
    included: ['Daily breakfast', 'Welcome drink', 'Private pool access', 'Housekeeping', 'Free Wi-Fi', 'Parking'],
    excluded: ['Airport transfers', 'Lunch & dinner', 'Alcohol beverages', 'Laundry service'],
    features: ['2 Bedrooms', '2 Bathrooms', 'Sea View', 'Private Pool', 'Free Wi-Fi'],
    amenities: ['Free WiFi', 'Swimming Pool', 'Breakfast Included', 'Air Conditioning', 'Parking', 'Pet Friendly', 'Kitchen', 'Gym'],
  },
  {
    id: 'the-lake-resort',
    title: 'The Lake Resort',
    location: 'Nainital, Uttarakhand',
    region: 'Uttarakhand',
    duration: 'Lakefront Resort',
    propertyType: 'Resort',
    provider: 'Meera Kapoor',
    providerLogo: 'MK',
    hostPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=90&w=300',
    rating: 4.6,
    reviews: 190,
    bookings: 420,
    originalPrice: 6299,
    directPrice: 5499,
    savings: 800,
    heroImage: lakeResort,
    images: [lakeResort, villa, poolVilla, retreat, cottage],
    overview: 'A polished lake resort with premium rooms, mountain views and calm waterfront dining.',
    highlights: ['Verified Property', 'Instant Booking', 'Free Cancellation'],
    included: ['Daily breakfast', 'Lake access', 'Housekeeping', 'WiFi', 'Parking'],
    excluded: ['Spa therapy', 'Lunch', 'Dinner', 'Alcohol'],
    features: ['Lake View', 'Breakfast', 'Spa', 'WiFi', 'Parking'],
    amenities: ['Free WiFi', 'Breakfast Included', 'Parking', 'Gym'],
  },
  {
    id: 'mountain-view-homestay',
    title: 'Mountain View Homestay',
    location: 'Manali, Himachal',
    region: 'Himachal',
    duration: 'Private Homestay',
    propertyType: 'Homestay',
    provider: 'Tashi Negi',
    providerLogo: 'TN',
    hostPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=90&w=300',
    rating: 4.9,
    reviews: 90,
    bookings: 260,
    originalPrice: 2899,
    directPrice: 2199,
    savings: 700,
    heroImage: mountainHome,
    images: [mountainHome, camp, jungle, haveli, cottage],
    overview: 'A warm mountain homestay with panoramic valley views, local meals and quiet work-friendly corners.',
    highlights: ['Verified Property', 'Superhost', 'Pet Friendly'],
    included: ['Breakfast', 'Welcome tea', 'WiFi', 'Housekeeping', 'Parking'],
    excluded: ['Bonfire wood', 'Lunch', 'Dinner', 'Laundry'],
    features: ['Mountain View', 'Heating', 'WiFi', 'Kitchen', 'Parking'],
    amenities: ['Free WiFi', 'Breakfast Included', 'Parking', 'Pet Friendly', 'Kitchen'],
  },
  {
    id: 'backpackers-hostel',
    title: 'Backpackers Hostel',
    location: 'Rishikesh, Uttarakhand',
    region: 'Uttarakhand',
    duration: 'Shared Hostel',
    propertyType: 'Hostel',
    provider: 'Aarav Hostel Co.',
    providerLogo: 'AH',
    hostPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=90&w=300',
    rating: 4.5,
    reviews: 142,
    bookings: 690,
    originalPrice: 699,
    directPrice: 499,
    savings: 200,
    heroImage: hostel,
    images: [hostel, jungle, camp, mountainHome, lakeResort],
    overview: 'A social hostel with clean dorms, a cafe, co-working corners and fast access to rafting points.',
    highlights: ['Verified Property', 'Budget Stay', 'Instant Booking'],
    included: ['WiFi', 'Locker', 'Common kitchen', 'Housekeeping'],
    excluded: ['Breakfast', 'Tours', 'Laundry', 'Transfers'],
    features: ['Dorm Beds', 'Cafe', 'WiFi', 'Lockers', 'Kitchen'],
    amenities: ['Free WiFi', 'Kitchen', 'Parking'],
  },
  {
    id: 'ayurveda-retreat',
    title: 'Ayurveda Retreat',
    location: 'Kumarakom, Kerala',
    region: 'Kerala',
    duration: 'Wellness Resort',
    propertyType: 'Resort',
    provider: 'Green Palm Hosts',
    providerLogo: 'GP',
    hostPhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=90&w=300',
    rating: 4.8,
    reviews: 163,
    bookings: 380,
    originalPrice: 9599,
    directPrice: 7499,
    savings: 2100,
    heroImage: retreat,
    images: [retreat, lakeResort, jungle, cottage, poolVilla],
    overview: 'A serene wellness resort with Ayurveda therapies, pool access and backwater-facing suites.',
    highlights: ['Verified Property', 'Spa Retreat', 'Direct Booking Savings'],
    included: ['Breakfast', 'Pool access', 'Yoga session', 'WiFi', 'Parking'],
    excluded: ['Therapies', 'Lunch', 'Dinner', 'Airport transfer'],
    features: ['Spa', 'Pool', 'Lake View', 'WiFi', 'Breakfast'],
    amenities: ['Free WiFi', 'Swimming Pool', 'Breakfast Included', 'Air Conditioning', 'Parking', 'Gym'],
  },
  {
    id: 'jungle-eco-stay',
    title: 'Jungle Eco Stay',
    location: 'Coorg, Karnataka',
    region: 'Karnataka',
    duration: 'Eco Stay',
    propertyType: 'Camp',
    provider: 'Forestline Stays',
    providerLogo: 'FS',
    hostPhoto: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&q=90&w=300',
    rating: 4.6,
    reviews: 78,
    bookings: 230,
    originalPrice: 4199,
    directPrice: 3299,
    savings: 900,
    heroImage: jungle,
    images: [jungle, camp, mountainHome, cottage, retreat],
    overview: 'A nature-forward eco stay surrounded by coffee estates, walking trails and quiet cottages.',
    highlights: ['Verified Property', 'Eco Stay', 'Pet Friendly'],
    included: ['Breakfast', 'Nature walk', 'WiFi', 'Parking'],
    excluded: ['Lunch', 'Dinner', 'Jeep safari', 'Laundry'],
    features: ['Forest View', 'Breakfast', 'WiFi', 'Trails', 'Parking'],
    amenities: ['Free WiFi', 'Breakfast Included', 'Parking', 'Pet Friendly'],
  },
  {
    id: 'heritage-haveli',
    title: 'Heritage Haveli',
    location: 'Udaipur, Rajasthan',
    region: 'Rajasthan',
    duration: 'Heritage Stay',
    propertyType: 'Heritage',
    provider: 'Royal Courtyard',
    providerLogo: 'RC',
    hostPhoto: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=90&w=300',
    rating: 4.9,
    reviews: 98,
    bookings: 310,
    originalPrice: 7899,
    directPrice: 6599,
    savings: 1300,
    heroImage: haveli,
    images: [haveli, villa, lakeResort, retreat, cottage],
    overview: 'A restored haveli with hand-carved interiors, courtyard dining and lake city access.',
    highlights: ['Verified Property', 'Heritage Stay', 'Superhost'],
    included: ['Breakfast', 'Welcome drink', 'WiFi', 'Housekeeping', 'Parking'],
    excluded: ['City tour', 'Lunch', 'Dinner', 'Laundry'],
    features: ['Courtyard', 'Heritage Rooms', 'WiFi', 'Breakfast', 'Parking'],
    amenities: ['Free WiFi', 'Breakfast Included', 'Air Conditioning', 'Parking'],
  },
  {
    id: 'urban-stays-apartment',
    title: 'Urban Stays Apartment',
    location: 'Bangalore, Karnataka',
    region: 'Karnataka',
    duration: 'Serviced Apartment',
    propertyType: 'Apartment',
    provider: 'Urban Stays',
    providerLogo: 'US',
    hostPhoto: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=90&w=300',
    rating: 4.7,
    reviews: 110,
    bookings: 520,
    originalPrice: 3899,
    directPrice: 2999,
    savings: 900,
    heroImage: apartment,
    images: [apartment, poolVilla, villa, hostel, lakeResort],
    overview: 'A clean serviced apartment with a full kitchen, desk, gym access and parking.',
    highlights: ['Verified Property', 'Instant Booking', 'City Stay'],
    included: ['WiFi', 'Housekeeping', 'Kitchen', 'Gym', 'Parking'],
    excluded: ['Breakfast', 'Laundry', 'Meals', 'Airport transfer'],
    features: ['1 Bedroom', 'Kitchen', 'Desk', 'Gym', 'WiFi'],
    amenities: ['Free WiFi', 'Air Conditioning', 'Parking', 'Kitchen', 'Gym'],
  },
  {
    id: 'island-cottage',
    title: 'Island Cottage',
    location: 'Havelock, Andaman',
    region: 'Andaman',
    duration: 'Beach Cottage',
    propertyType: 'Villa',
    provider: 'Island Hosts',
    providerLogo: 'IH',
    hostPhoto: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&q=90&w=300',
    rating: 4.7,
    reviews: 66,
    bookings: 180,
    originalPrice: 8399,
    directPrice: 6999,
    savings: 1400,
    heroImage: cottage,
    images: [cottage, villa, poolVilla, retreat, lakeResort],
    overview: 'A barefoot-luxury cottage steps from the beach with breezy rooms and direct host support.',
    highlights: ['Verified Property', 'Beachfront', 'Free Cancellation'],
    included: ['Breakfast', 'Beach access', 'WiFi', 'Housekeeping'],
    excluded: ['Ferry tickets', 'Lunch', 'Dinner', 'Diving'],
    features: ['Beach Access', 'Sea View', 'WiFi', 'Breakfast', 'Deck'],
    amenities: ['Free WiFi', 'Breakfast Included', 'Air Conditioning'],
  },
  {
    id: 'desert-camp',
    title: 'Desert Camp',
    location: 'Jaisalmer, Rajasthan',
    region: 'Rajasthan',
    duration: 'Luxury Camp',
    propertyType: 'Camp',
    provider: 'Dune Hosts',
    providerLogo: 'DH',
    hostPhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=90&w=300',
    rating: 4.6,
    reviews: 54,
    bookings: 140,
    originalPrice: 5299,
    directPrice: 4499,
    savings: 800,
    heroImage: camp,
    images: [camp, haveli, jungle, mountainHome, cottage],
    overview: 'A luxury desert camp with ensuite tents, cultural evenings and starlit dining.',
    highlights: ['Verified Property', 'Unique Stay', 'Direct Booking Savings'],
    included: ['Breakfast', 'Welcome drink', 'Cultural show', 'Parking'],
    excluded: ['Camel safari', 'Lunch', 'Dinner', 'Alcohol'],
    features: ['Luxury Tent', 'Desert View', 'Cultural Show', 'Parking', 'Breakfast'],
    amenities: ['Breakfast Included', 'Parking', 'Air Conditioning'],
  },
];

export const featuredPackage = packages[0];

export function findPackage(id?: string) {
  return packages.find((item) => item.id === id) ?? featuredPackage;
}

export function formatRupees(value: number) {
  return `₹${value.toLocaleString('en-IN')}`;
}
