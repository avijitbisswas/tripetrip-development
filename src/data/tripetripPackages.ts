import type { LucideIcon } from 'lucide-react';
import { BadgeCheck, Bus, Camera, Coffee, Hotel, Sailboat, ShieldCheck } from 'lucide-react';

export type TripPackage = {
  id: string;
  title: string;
  location: string;
  region: string;
  duration: string;
  provider: string;
  providerLogo: string;
  rating: number;
  reviews: number;
  bookings: number;
  originalPrice: number;
  directPrice: number;
  savings: number;
  heroImage: string;
  images: string[];
  tripType: string;
  overview: string;
  highlights: string[];
  included: string[];
  excluded: string[];
  itinerary: { day: string; title: string; text: string }[];
};

export const inclusions: { label: string; icon: LucideIcon }[] = [
  { label: 'Hotel', icon: Hotel },
  { label: 'Breakfast', icon: Coffee },
  { label: 'Transfer', icon: Bus },
  { label: 'Sightseeing', icon: Camera },
  { label: 'Tour Guide', icon: BadgeCheck },
];

export const trustBadges = [
  { label: 'Verified Partners', icon: ShieldCheck },
  { label: 'Best Direct Prices', icon: BadgeCheck },
  { label: 'Secure Booking', icon: ShieldCheck },
  { label: '24x7 Support', icon: Sailboat },
];

export const packages: TripPackage[] = [
  {
    id: 'goa-beach-escape',
    title: 'Goa Beach Escape',
    location: 'Goa',
    region: 'India',
    duration: '4D/3N',
    provider: 'TripGo Holidays',
    providerLogo: 'TG',
    rating: 4.8,
    reviews: 120,
    bookings: 500,
    originalPrice: 12499,
    directPrice: 9999,
    savings: 2500,
    heroImage: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&q=88&w=1800',
    images: [
      'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&q=88&w=1800',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=88&w=900',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=88&w=900',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=88&w=900',
      'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&q=88&w=900',
    ],
    tripType: 'Beach',
    overview: 'Experience Goa with pristine beaches, water activities, delicious cuisine and vibrant nightlife.',
    highlights: ['Beautiful Beaches', 'Water Activities', 'Night Cruise', 'Beach Parties', 'Local Sightseeing'],
    included: ['3 Nights Hotel Accommodation', 'Daily Breakfast', 'Airport/Railway Transfer', 'Sightseeing by Private Cab', 'All Taxes & Fees'],
    excluded: ['Airfare/Train Fare', 'Lunch & Dinner', 'Personal Expenses', 'Water Activities', 'Travel Insurance'],
    itinerary: [
      { day: 'Day 1', title: 'Arrival in Goa', text: 'Arrive at Goa airport or railway station. Transfer to hotel and relax.' },
      { day: 'Day 2', title: 'North Goa Sightseeing', text: 'Visit Fort Aguada, Calangute Beach, Baga Beach and Anjuna Beach.' },
      { day: 'Day 3', title: 'South Goa & Leisure', text: 'Visit Basilica of Bom Jesus, Colva Beach and sunset cruise.' },
      { day: 'Day 4', title: 'Departure', text: 'Check out and transfer to airport or railway station.' },
    ],
  },
  {
    id: 'kashmir-paradise',
    title: 'Kashmir Paradise',
    location: 'Kashmir',
    region: 'India',
    duration: '5D/4N',
    provider: 'Paradise Trips',
    providerLogo: 'KP',
    rating: 4.7,
    reviews: 98,
    bookings: 320,
    originalPrice: 15999,
    directPrice: 12999,
    savings: 3000,
    heroImage: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&q=88&w=1800',
    images: ['https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&q=88&w=1800', 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&q=88&w=900'],
    tripType: 'Mountains',
    overview: 'A refined Himalayan journey through valleys, houseboats, snow viewpoints and local experiences.',
    highlights: ['Dal Lake Shikara', 'Gulmarg Cable Car', 'Pahalgam Valley', 'Houseboat Stay'],
    included: ['Hotel Accommodation', 'Daily Breakfast', 'Private Cab', 'Shikara Ride'],
    excluded: ['Flights', 'Lunch & Dinner', 'Snow Activity Tickets'],
    itinerary: [{ day: 'Day 1', title: 'Srinagar Arrival', text: 'Hotel check-in, lake walk and local market visit.' }],
  },
  {
    id: 'bali-bliss',
    title: 'Bali Bliss',
    location: 'Bali',
    region: 'Indonesia',
    duration: '4D/3N',
    provider: 'Wander World',
    providerLogo: 'BW',
    rating: 4.9,
    reviews: 156,
    bookings: 840,
    originalPrice: 24999,
    directPrice: 19999,
    savings: 5000,
    heroImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=88&w=1800',
    images: ['https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=88&w=1800', 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&q=88&w=900'],
    tripType: 'International',
    overview: 'Private pool villas, temple sunsets and tropical coastline experiences planned with direct local partners.',
    highlights: ['Uluwatu Sunset', 'Private Villa', 'Temple Trail', 'Beach Club'],
    included: ['Villa Stay', 'Breakfast', 'Airport Transfers', 'Local Driver'],
    excluded: ['Flights', 'Visa', 'Personal Expenses'],
    itinerary: [{ day: 'Day 1', title: 'Arrival in Bali', text: 'Airport pickup and villa check-in.' }],
  },
  {
    id: 'kerala-backwaters',
    title: 'Kerala Backwaters',
    location: 'Kerala',
    region: 'India',
    duration: '3D/2N',
    provider: 'Green Trails',
    providerLogo: 'GT',
    rating: 4.6,
    reviews: 88,
    bookings: 260,
    originalPrice: 10499,
    directPrice: 7999,
    savings: 2500,
    heroImage: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&q=88&w=1800',
    images: ['https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&q=88&w=1800', 'https://images.unsplash.com/photo-1593693411515-c20261bcad6e?auto=format&fit=crop&q=88&w=900'],
    tripType: 'Luxury',
    overview: 'A calm, premium houseboat and resort break through Alleppey and Kumarakom.',
    highlights: ['Private Houseboat', 'Ayurveda Spa', 'Village Canoe', 'Lake Resort'],
    included: ['Houseboat Stay', 'All Meals on Cruise', 'Transfers', 'Local Host'],
    excluded: ['Flights', 'Spa Charges', 'Tips'],
    itinerary: [{ day: 'Day 1', title: 'Alleppey Cruise', text: 'Board private houseboat and cruise through palm-lined canals.' }],
  },
];

export const featuredPackage = packages[0];

export function findPackage(id?: string) {
  return packages.find((item) => item.id === id) ?? featuredPackage;
}

export function formatRupees(value: number) {
  return `₹${value.toLocaleString('en-IN')}`;
}
