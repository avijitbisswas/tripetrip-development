import type { LucideIcon } from 'lucide-react';
import {
  BadgeCheck,
  CalendarCheck,
  Camera,
  CloudSun,
  Compass,
  HeartPulse,
  MapPinned,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';

export type AdventureReview = {
  name: string;
  location: string;
  rating: number;
  story: string;
  date: string;
  photos: string[];
};

export type AdventureOperator = {
  name: string;
  logo: string;
  years: string;
  trips: string;
  responseTime: string;
  rating: number;
  verified: boolean;
};

export type AdventureExperience = {
  id: string;
  title: string;
  activity: string;
  location: string;
  operator: AdventureOperator;
  image: string;
  gallery: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  safetyRating: number;
  reviewsCount: number;
  rating: number;
  originalPrice: number;
  directPrice: number;
  savings: number;
  instantBook: boolean;
  totalBookings: string;
  maxAltitude?: string;
  bestSeason: string;
  groupSize: string;
  description: string;
  highlights: string[];
  requirements: string[];
  whatToBring: string[];
  meetingPoint: string;
  itinerary: Array<{ time: string; title: string; text: string }>;
  safety: Array<{ label: string; text: string; icon: LucideIcon }>;
  advanced: Array<{ label: string; value: string; icon: LucideIcon }>;
  reviews: AdventureReview[];
};

export const formatRupees = (value: number) => `Rs. ${value.toLocaleString('en-IN')}`;

const mountainHero = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=90&w=2200';
const paraglide = 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&q=90&w=1600';
const scuba = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=90&w=1600';
const rafting = 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&q=90&w=1600';
const atv = 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?auto=format&fit=crop&q=90&w=1600';
const ski = 'https://images.unsplash.com/photo-1551524164-6cf2ac04586d?auto=format&fit=crop&q=90&w=1600';
const desert = 'https://images.unsplash.com/photo-1489493585363-d69421e0edd3?auto=format&fit=crop&q=90&w=1600';
const bungee = 'https://images.unsplash.com/photo-1521673461164-de300ebcfb17?auto=format&fit=crop&q=90&w=1600';
const camping = 'https://images.unsplash.com/photo-1504851149312-7a075b496cc7?auto=format&fit=crop&q=90&w=1600';
const wildlife = 'https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&q=90&w=1600';
const zipline = 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&q=90&w=1600';
const surfing = 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&q=90&w=1600';
const trekking = 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&q=90&w=1600';

export const heroImage = mountainHero;

export const trustBadges = [
  { label: 'Verified Operators', icon: BadgeCheck },
  { label: 'Certified Safety Standards', icon: ShieldCheck },
  { label: 'Instant Booking', icon: CalendarCheck },
  { label: 'Best Direct Prices', icon: Zap },
];

export const activityFilters = [
  ['Trekking', 120],
  ['Scuba Diving', 98],
  ['Paragliding', 86],
  ['Bungee Jumping', 42],
  ['River Rafting', 76],
  ['Camping', 64],
  ['ATV Rides', 53],
  ['Wildlife Safari', 67],
];

export const difficultyFilters = [
  ['Beginner', 152],
  ['Intermediate', 128],
  ['Advanced', 86],
];

export const durationFilters = [
  ['1 Hour', 48],
  ['Half Day', 86],
  ['Full Day', 120],
  ['Multi-Day', 45],
];

export const safetyFilters = ['5 Stars', '4 Stars & Up', '3 Stars & Up'];

const operator: AdventureOperator = {
  name: 'Bir Billing Adventures',
  logo: 'BB',
  years: '6+',
  trips: '12K+',
  responseTime: '8 min',
  rating: 4.8,
  verified: true,
};

export const adventures: AdventureExperience[] = [
  {
    id: 'paragliding-bir-billing',
    title: 'Paragliding in Bir Billing',
    activity: 'Paragliding',
    location: 'Bir Billing, Himachal Pradesh',
    operator,
    image: paraglide,
    gallery: [paraglide, mountainHero, trekking, camping, zipline],
    difficulty: 'Beginner',
    duration: '15-20 min',
    safetyRating: 4.8,
    reviewsCount: 320,
    rating: 4.8,
    originalPrice: 6000,
    directPrice: 2999,
    savings: 2001,
    instantBook: true,
    totalBookings: '1.2K',
    maxAltitude: '1,400 m',
    bestSeason: 'All Year',
    groupSize: '5-10 kg wind window',
    description:
      'Experience the thrill of flying like a bird over the majestic Dhauladhar ranges. Tandem paragliding in Bir Billing pairs you with certified pilots, panoramic valley views, and a smooth landing certificate finish.',
    highlights: ['Panoramic valley views', 'Certified pilots', 'Premium safety gear', 'Photo and video option', 'Adventure insurance add-on'],
    requirements: ['Minimum age 14 years', 'Weight between 30 kg and 95 kg', 'No serious heart or spine condition'],
    whatToBring: ['Government ID', 'Light jacket', 'Closed shoes', 'Sunglasses', 'Small water bottle'],
    meetingPoint: 'Tripetrip Adventure Desk, Bir Landing Site, Himachal Pradesh',
    itinerary: [
      { time: '09:00 AM', title: 'Check-in & Registration', text: 'Meet the operator team, verify booking, and complete registration.' },
      { time: '09:30 AM', title: 'Safety Briefing', text: 'Gear check, harness fitting, weather window check, and pilot briefing.' },
      { time: '10:00 AM', title: 'Take Off', text: 'Launch from Billing with a certified tandem pilot and fly over the valley.' },
      { time: '10:20 AM', title: 'Landing & Certificate', text: 'Smooth landing at Bir, media handoff, and digital adventure certificate.' },
    ],
    safety: [
      { label: 'Equipment Included', text: 'Certified harness, helmet, reserve parachute, and radio support.', icon: ShieldCheck },
      { label: 'Instructor Information', text: 'APPI-trained tandem pilots with 2,500+ flight hours.', icon: BadgeCheck },
      { label: 'Emergency Support', text: 'Ground rescue vehicle and first-aid trained crew on every slot.', icon: HeartPulse },
      { label: 'Medical Requirements', text: 'Not recommended for recent surgery, pregnancy, or serious cardiac conditions.', icon: Sparkles },
      { label: 'Safety Certifications', text: 'Operator verified by Tripetrip safety audit and local aviation standards.', icon: CalendarCheck },
    ],
    advanced: [
      { label: 'Weather Forecast', value: 'Clear skies, 12 km/h wind', icon: CloudSun },
      { label: 'Live Availability', value: '10:00 AM filling fast', icon: CalendarCheck },
      { label: 'Remaining Slots', value: '6 seats left today', icon: Users },
      { label: 'AI Recommendation', value: 'Best for first-time flyers', icon: Sparkles },
      { label: 'Safety Score', value: '98 / 100', icon: ShieldCheck },
      { label: 'Location Map', value: 'Takeoff and landing pinned', icon: MapPinned },
      { label: 'Insurance Add-on', value: 'Rs. 149 per person', icon: HeartPulse },
      { label: 'Photo & Video Package', value: 'GoPro reel available', icon: Camera },
    ],
    reviews: [
      {
        name: 'Priya Mehta',
        location: 'Mumbai',
        rating: 5,
        story: 'My first paragliding experience and it felt absolutely world-class. The pilot was calm, the gear was clean, and the views were unreal.',
        date: '10 May 2026',
        photos: [paraglide, mountainHero],
      },
      {
        name: 'Amanpreet Singh',
        location: 'Delhi',
        rating: 5,
        story: 'Booking direct saved money and the operator confirmed the slot instantly. The safety briefing was very professional.',
        date: '15 May 2026',
        photos: [camping, trekking],
      },
    ],
  },
  {
    id: 'scuba-diving-andaman',
    title: 'Scuba Diving Andaman',
    activity: 'Scuba Diving',
    location: 'Havelock Island, Andaman',
    operator: { ...operator, name: 'Blue Reef Divers', logo: 'BR', years: '9+', trips: '18K+', responseTime: '12 min' },
    image: scuba,
    gallery: [scuba, wildlife, surfing, camping, mountainHero],
    difficulty: 'Beginner',
    duration: '2-3 hours',
    safetyRating: 4.9,
    reviewsCount: 210,
    rating: 4.9,
    originalPrice: 6500,
    directPrice: 4499,
    savings: 2001,
    instantBook: true,
    totalBookings: '910',
    bestSeason: 'Oct-May',
    groupSize: 'Small groups',
    description: 'Dive into clear Andaman waters with a certified instructor, reef briefing, and underwater photo options.',
    highlights: ['PADI-led briefing', 'Reef dive', 'Underwater photos', 'Small group slots'],
    requirements: ['Comfortable in water', 'Minimum age 12 years'],
    whatToBring: ['Swimwear', 'Towel', 'ID proof'],
    meetingPoint: 'Havelock Dive Center Jetty',
    itinerary: [],
    safety: [],
    advanced: [],
    reviews: [],
  },
  {
    id: 'rishikesh-river-rafting',
    title: 'Rishikesh River Rafting',
    activity: 'River Rafting',
    location: 'Rishikesh, Uttarakhand',
    operator: { ...operator, name: 'Ganga Rapids Co.', logo: 'GR' },
    image: rafting,
    gallery: [rafting, mountainHero, camping, trekking, zipline],
    difficulty: 'Intermediate',
    duration: '3 hours',
    safetyRating: 4.7,
    reviewsCount: 480,
    rating: 4.7,
    originalPrice: 1800,
    directPrice: 999,
    savings: 801,
    instantBook: true,
    totalBookings: '2.4K',
    bestSeason: 'Sep-Jun',
    groupSize: '6-8 per raft',
    description: 'Run iconic Ganga rapids with trained river guides, helmets, life jackets, and rescue kayaks.',
    highlights: ['Grade II-III rapids', 'Safety kayak support', 'Cliff jump stop'],
    requirements: ['Basic fitness', 'Minimum age 14 years'],
    whatToBring: ['Dry clothes', 'Strap sandals', 'Waterproof pouch'],
    meetingPoint: 'Tapovan rafting office',
    itinerary: [],
    safety: [],
    advanced: [],
    reviews: [],
  },
  {
    id: 'goa-atv-adventure',
    title: 'Goa ATV Adventure',
    activity: 'ATV Rides',
    location: 'Goa',
    operator: { ...operator, name: 'Goa Trail Motors', logo: 'GT' },
    image: atv,
    gallery: [atv, desert, surfing, camping, rafting],
    difficulty: 'Beginner',
    duration: '1 hour',
    safetyRating: 4.6,
    reviewsCount: 150,
    rating: 4.6,
    originalPrice: 2500,
    directPrice: 1499,
    savings: 1001,
    instantBook: true,
    totalBookings: '640',
    bestSeason: 'All Year',
    groupSize: 'Solo rides',
    description: 'Ride forest and coastal trails on automatic ATVs with a guided safety convoy.',
    highlights: ['Trail guide', 'Helmet included', 'Photo stop'],
    requirements: ['Valid ID', 'Minimum age 16 years'],
    whatToBring: ['Closed shoes', 'Sunscreen'],
    meetingPoint: 'North Goa ATV Park',
    itinerary: [],
    safety: [],
    advanced: [],
    reviews: [],
  },
  {
    id: 'kashmir-ski-experience',
    title: 'Kashmir Ski Experience',
    activity: 'Skiing',
    location: 'Gulmarg, Kashmir',
    operator: { ...operator, name: 'Gulmarg Snow School', logo: 'GS' },
    image: ski,
    gallery: [ski, mountainHero, trekking, camping, paraglide],
    difficulty: 'Intermediate',
    duration: '3-4 hours',
    safetyRating: 4.9,
    reviewsCount: 140,
    rating: 4.9,
    originalPrice: 4000,
    directPrice: 2799,
    savings: 1201,
    instantBook: true,
    totalBookings: '510',
    bestSeason: 'Dec-Mar',
    groupSize: 'Private coach',
    description: 'Premium ski session with instructor, gear fitting, and beginner slope access.',
    highlights: ['Instructor led', 'Ski gear included', 'Snow photos'],
    requirements: ['Warm clothing', 'Moderate fitness'],
    whatToBring: ['Thermals', 'Gloves', 'Socks'],
    meetingPoint: 'Gulmarg gondola base',
    itinerary: [],
    safety: [],
    advanced: [],
    reviews: [],
  },
  {
    id: 'dubai-desert-safari',
    title: 'Dubai Desert Safari',
    activity: 'Desert Safari',
    location: 'Dubai, UAE',
    operator: { ...operator, name: 'Dune Luxe Safari', logo: 'DL' },
    image: desert,
    gallery: [desert, atv, camping, wildlife, mountainHero],
    difficulty: 'Beginner',
    duration: '5 hours',
    safetyRating: 4.7,
    reviewsCount: 180,
    rating: 4.7,
    originalPrice: 2200,
    directPrice: 1299,
    savings: 901,
    instantBook: true,
    totalBookings: '1.1K',
    bestSeason: 'Oct-Apr',
    groupSize: 'Shared 4x4',
    description: 'Dune bashing, sunset stop, camp dinner, and optional quad ride with verified desert operators.',
    highlights: ['Dune bashing', 'Sunset camp', 'BBQ dinner'],
    requirements: ['Not for serious back conditions'],
    whatToBring: ['Sunglasses', 'Light jacket'],
    meetingPoint: 'Hotel pickup zone',
    itinerary: [],
    safety: [],
    advanced: [],
    reviews: [],
  },
  {
    id: 'bungee-jumping-rishikesh',
    title: 'Bungee Jumping Rishikesh',
    activity: 'Bungee Jumping',
    location: 'Rishikesh, Uttarakhand',
    operator: { ...operator, name: 'Jump Himalaya', logo: 'JH' },
    image: bungee,
    gallery: [bungee, rafting, mountainHero, zipline, camping],
    difficulty: 'Advanced',
    duration: '1 hour',
    safetyRating: 4.8,
    reviewsCount: 210,
    rating: 4.8,
    originalPrice: 3500,
    directPrice: 2299,
    savings: 1201,
    instantBook: true,
    totalBookings: '880',
    bestSeason: 'All Year',
    groupSize: 'Solo jump',
    description: 'Leap from a certified fixed platform with international jumpmasters and recovery crew.',
    highlights: ['Certified jumpmaster', 'Video package', 'Jump certificate'],
    requirements: ['Weight 40-110 kg', 'No heart conditions'],
    whatToBring: ['ID proof', 'Sports shoes'],
    meetingPoint: 'Mohanchatti jump zone',
    itinerary: [],
    safety: [],
    advanced: [],
    reviews: [],
  },
  {
    id: 'camping-manali',
    title: 'Camping Experience',
    activity: 'Camping',
    location: 'Kasol, Himachal',
    operator: { ...operator, name: 'Valley Camp Collective', logo: 'VC' },
    image: camping,
    gallery: [camping, trekking, mountainHero, paraglide, zipline],
    difficulty: 'Beginner',
    duration: '2 days / 1 night',
    safetyRating: 4.6,
    reviewsCount: 200,
    rating: 4.6,
    originalPrice: 2800,
    directPrice: 1699,
    savings: 1101,
    instantBook: true,
    totalBookings: '960',
    bestSeason: 'Mar-Jun',
    groupSize: 'Twin sharing',
    description: 'Riverside premium camping with bonfire, guided walk, hygienic meals, and local host support.',
    highlights: ['Riverside tents', 'Bonfire', 'Guided nature walk'],
    requirements: ['Respect camp quiet hours'],
    whatToBring: ['Warm layers', 'Power bank'],
    meetingPoint: 'Kasol market pickup point',
    itinerary: [],
    safety: [],
    advanced: [],
    reviews: [],
  },
  {
    id: 'wildlife-safari-jim-corbett',
    title: 'Wildlife Safari Jim Corbett',
    activity: 'Wildlife Safari',
    location: 'Jim Corbett, Uttarakhand',
    operator: { ...operator, name: 'Corbett Wild Trails', logo: 'CW' },
    image: wildlife,
    gallery: [wildlife, camping, trekking, mountainHero, rafting],
    difficulty: 'Beginner',
    duration: 'Half Day',
    safetyRating: 4.7,
    reviewsCount: 260,
    rating: 4.7,
    originalPrice: 3200,
    directPrice: 2199,
    savings: 1001,
    instantBook: true,
    totalBookings: '1.5K',
    bestSeason: 'Nov-Jun',
    groupSize: '6 per jeep',
    description: 'Verified jeep safari with forest permit guidance, naturalist briefing, and pickup coordination.',
    highlights: ['Permit assistance', 'Naturalist guide', 'Jeep safari'],
    requirements: ['Carry original ID'],
    whatToBring: ['Neutral clothing', 'Binoculars'],
    meetingPoint: 'Ramnagar safari gate',
    itinerary: [],
    safety: [],
    advanced: [],
    reviews: [],
  },
  {
    id: 'zipline-wayanad',
    title: 'Zipline Wayanad',
    activity: 'Zipline',
    location: 'Wayanad, Kerala',
    operator: { ...operator, name: 'Wayanad Zip Co.', logo: 'WZ' },
    image: zipline,
    gallery: [zipline, wildlife, camping, trekking, mountainHero],
    difficulty: 'Beginner',
    duration: '1 Hour',
    safetyRating: 4.5,
    reviewsCount: 118,
    rating: 4.5,
    originalPrice: 1800,
    directPrice: 999,
    savings: 801,
    instantBook: true,
    totalBookings: '540',
    bestSeason: 'All Year',
    groupSize: 'Solo line',
    description: 'Fly over tea estates on a safety-certified zipline with harness crew and landing support.',
    highlights: ['Estate views', 'Harness crew', 'Photo point'],
    requirements: ['Weight 35-95 kg'],
    whatToBring: ['Closed shoes'],
    meetingPoint: 'Wayanad adventure park',
    itinerary: [],
    safety: [],
    advanced: [],
    reviews: [],
  },
  {
    id: 'surfing-kovalam',
    title: 'Surfing Kovalam',
    activity: 'Surfing',
    location: 'Kovalam, Kerala',
    operator: { ...operator, name: 'Kovalam Surf School', logo: 'KS' },
    image: surfing,
    gallery: [surfing, scuba, camping, wildlife, mountainHero],
    difficulty: 'Beginner',
    duration: '2 Hours',
    safetyRating: 4.8,
    reviewsCount: 170,
    rating: 4.8,
    originalPrice: 2400,
    directPrice: 1599,
    savings: 801,
    instantBook: true,
    totalBookings: '720',
    bestSeason: 'Sep-Apr',
    groupSize: 'Small batch',
    description: 'Beginner-friendly surf lesson with ISA-trained instructors, soft boards, and beach safety briefing.',
    highlights: ['Soft board included', 'Beach safety', 'Instructor photos'],
    requirements: ['Comfortable in water'],
    whatToBring: ['Swimwear', 'Towel'],
    meetingPoint: 'Kovalam lighthouse beach',
    itinerary: [],
    safety: [],
    advanced: [],
    reviews: [],
  },
  {
    id: 'kedarkantha-trekking',
    title: 'Kedarkantha Trekking',
    activity: 'Trekking',
    location: 'Uttarkashi, Uttarakhand',
    operator: { ...operator, name: 'Summit Trail Guides', logo: 'ST' },
    image: trekking,
    gallery: [trekking, mountainHero, camping, ski, paraglide],
    difficulty: 'Intermediate',
    duration: 'Multi-Day',
    safetyRating: 4.9,
    reviewsCount: 340,
    rating: 4.9,
    originalPrice: 9500,
    directPrice: 7499,
    savings: 2001,
    instantBook: true,
    totalBookings: '1.8K',
    bestSeason: 'Dec-Apr',
    groupSize: '12 per batch',
    description: 'Snow summit trek with trek leader, camping gear, meals, permits, and oxygen cylinder backup.',
    highlights: ['Summit climb', 'Meals included', 'Oxygen backup'],
    requirements: ['Good fitness', 'No major altitude illness history'],
    whatToBring: ['Trekking shoes', 'Thermals', 'Day pack'],
    meetingPoint: 'Sankri base camp',
    itinerary: [],
    safety: [],
    advanced: [],
    reviews: [],
  },
];

export const featuredAdventure = adventures[0];

export function findAdventure(id?: string) {
  return adventures.find((item) => item.id === id) ?? featuredAdventure;
}
