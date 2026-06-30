import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePublicSiteConfig } from '@/src/hooks/usePublicSiteConfig';
import { cn } from '@/lib/utils';
import { ArrowLeft, BadgeCheck, CalendarDays, Check, Clock, Flame, Heart, MapPin, Share2, ShieldCheck, SlidersHorizontal, Sparkles, Star, Tags, Users, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

type Deal = {
  id: string;
  title: string;
  provider: string;
  location: string;
  image: string;
  gallery: string[];
  badge: string;
  badgeTone: string;
  timer: string;
  originalPrice: string;
  price: string;
  savings: string;
  savingsPercent: string;
  rating: string;
  reviews: string;
  meta: string[];
  availability: string;
};

const heroImage = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=90&w=2400';

const stats = [
  { label: '50+ Deals Live', helper: 'Deals Live', value: '50+', icon: CalendarDays, tone: 'text-cyan-600 bg-cyan-50' },
  { label: 'Average Savings 28%', helper: 'Avg. Savings', value: '28%', icon: Flame, tone: 'text-orange-600 bg-orange-50' },
  { label: '10,000+ Bookings', helper: 'Bookings', value: '10K+', icon: Sparkles, tone: 'text-rose-600 bg-rose-50' },
  { label: 'Verified Partners', helper: 'Partners', value: 'Verified', icon: BadgeCheck, tone: 'text-emerald-600 bg-emerald-50' },
];

const categories = ['All Deals', 'Stays', 'Packages', 'Activities', 'Transport', 'International', 'Domestic'];
const filters = ['Savings %', 'Price', 'Destination', 'Travel Dates', 'Last Minute', 'Family Deals', 'Luxury Deals', 'Festival Offers'];

const deals: Deal[] = [
  {
    id: 'goa-beach-escape',
    title: 'Goa Beach Escape',
    provider: 'TripGo Holidays',
    location: 'Goa, India',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&q=90&w=1200',
    gallery: [
      'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&q=90&w=1200',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=90&w=1200',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=90&w=1200',
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&q=90&w=1200',
    ],
    badge: '30% OFF',
    badgeTone: 'from-orange-500 to-rose-500',
    timer: '02 : 14 : 35',
    originalPrice: '₹14,999',
    price: '₹9,999',
    savings: 'Save ₹5,000',
    savingsPercent: '30%',
    rating: '4.8',
    reviews: '320 reviews',
    meta: ['4 Days / 3 Nights', 'Hotel', 'Breakfast', 'Sightseeing', 'Transfers'],
    availability: 'Only 3 Left',
  },
  {
    id: 'manali-snow-retreat',
    title: 'Manali Snow Retreat',
    provider: 'HimTrips',
    location: 'Manali, Himachal',
    image: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&q=90&w=1200',
    gallery: [],
    badge: 'Flat ₹5,000 OFF',
    badgeTone: 'from-fuchsia-500 to-rose-500',
    timer: '06 : 45 : 20',
    originalPrice: '₹18,999',
    price: '₹13,999',
    savings: 'Save ₹5,000',
    savingsPercent: '26%',
    rating: '4.7',
    reviews: '184 reviews',
    meta: ['3 Nights', 'Resort', 'Breakfast', 'Snow View'],
    availability: '9 Rooms Left',
  },
  {
    id: 'scuba-diving-adventure',
    title: 'Scuba Diving Adventure',
    provider: 'Oceanic Adventures',
    location: 'Andaman Islands',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=90&w=1200',
    gallery: [],
    badge: '20% OFF',
    badgeTone: 'from-orange-500 to-amber-500',
    timer: '01 : 25 : 10',
    originalPrice: '₹4,999',
    price: '₹3,999',
    savings: 'Save ₹1,000',
    savingsPercent: '20%',
    rating: '4.9',
    reviews: '159 reviews',
    meta: ['2 Hours', 'PADI Partner', 'Gear Included'],
    availability: '12 Slots Left',
  },
  {
    id: 'dubai-weekend',
    title: 'Dubai Weekend Escape',
    provider: 'Dubai Tours',
    location: 'Dubai, UAE',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=90&w=1200',
    gallery: [],
    badge: 'FLASH SALE',
    badgeTone: 'from-violet-500 to-fuchsia-500',
    timer: '05 : 12 : 49',
    originalPrice: '₹34,999',
    price: '₹24,999',
    savings: 'Save ₹10,000',
    savingsPercent: '29%',
    rating: '4.8',
    reviews: '256 reviews',
    meta: ['Weekend', 'Hotel', 'City Tour', 'Transfers'],
    availability: 'Last 5 Left',
  },
  {
    id: 'kerala-houseboat',
    title: 'Kerala Houseboat Stay',
    provider: 'Kerala Holidays',
    location: 'Kerala',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&q=90&w=1200',
    gallery: [],
    badge: 'LAST 3 LEFT',
    badgeTone: 'from-emerald-600 to-green-500',
    timer: '02 : 05 : 30',
    originalPrice: '₹12,999',
    price: '₹8,999',
    savings: 'Save ₹4,000',
    savingsPercent: '31%',
    rating: '4.7',
    reviews: '148 reviews',
    meta: ['1 Night', 'Meals', 'Backwaters'],
    availability: 'Only 3 Left',
  },
  {
    id: 'atv-adventure-ride',
    title: 'ATV Adventure Ride',
    provider: 'Thrill Seekers',
    location: 'Rajasthan',
    image: 'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?auto=format&fit=crop&q=90&w=1200',
    gallery: [],
    badge: 'WEEKEND SPECIAL',
    badgeTone: 'from-orange-500 to-amber-500',
    timer: '03 : 40 : 15',
    originalPrice: '₹2,999',
    price: '₹1,999',
    savings: 'Save ₹1,000',
    savingsPercent: '33%',
    rating: '4.6',
    reviews: '96 reviews',
    meta: ['90 Min', 'Safety Gear', 'Guide'],
    availability: '18 Slots Left',
  },
  {
    id: 'bali-luxury-villa',
    title: 'Bali Luxury Villa',
    provider: 'Bali Escapes',
    location: 'Bali, Indonesia',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=90&w=1200',
    gallery: [],
    badge: 'SAVINGS 25%',
    badgeTone: 'from-rose-500 to-pink-500',
    timer: '02 : 30 : 10',
    originalPrice: '₹21,999',
    price: '₹16,499',
    savings: 'Save ₹5,500',
    savingsPercent: '25%',
    rating: '4.9',
    reviews: '211 reviews',
    meta: ['Villa', 'Private Pool', 'Breakfast'],
    availability: '6 Villas Left',
  },
  {
    id: 'luxury-suv-with-driver',
    title: 'Luxury SUV with Driver',
    provider: 'GoRide Travels',
    location: 'Goa',
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=90&w=1200',
    gallery: [],
    badge: 'MEGA DEAL',
    badgeTone: 'from-sky-500 to-blue-600',
    timer: '04 : 25 : 18',
    originalPrice: '₹3,499',
    price: '₹2,299',
    savings: 'Save ₹1,200',
    savingsPercent: '34%',
    rating: '4.7',
    reviews: '142 reviews',
    meta: ['Day Rental', 'Driver', 'Fuel Optional'],
    availability: '4 Cars Left',
  },
];

function getDeal(dealId?: string) {
  return deals.find((deal) => deal.id === dealId) ?? deals[0];
}

function parseDealAmount(value: string) {
  return Number(value.replace(/[^\d]/g, '')) || 0;
}

function DealTimer({ value, compact = false }: { value: string; compact?: boolean }) {
  return (
    <div className={cn('flex items-center justify-between gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-rose-500/20', compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm')}>
      <span className="font-black">Ends in</span>
      <span className="font-black tabular-nums tracking-wide">{value}</span>
    </div>
  );
}

function DealCard({ deal }: { deal: Deal }) {
  return (
    <article className="group overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(22,163,74,0.18)]">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={deal.image} alt={deal.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
        <Badge className={cn('absolute left-3 top-3 rounded-xl bg-gradient-to-r px-3 py-1 text-[11px] font-black text-white shadow-lg hover:opacity-95', deal.badgeTone)}>{deal.badge}</Badge>
        <button aria-label={`Save ${deal.title}`} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 backdrop-blur-md transition hover:text-[#16A34A]">
          <Heart className="h-4 w-4" />
        </button>
        <div className="absolute bottom-3 left-3 right-3">
          <DealTimer value={deal.timer} compact />
        </div>
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
          <MapPin className="h-3.5 w-3.5 text-[#16A34A]" />
          {deal.location}
        </div>
        <h2 className="line-clamp-1 text-base font-black text-slate-950">{deal.title}</h2>
        <p className="text-[11px] font-bold text-slate-500">By {deal.provider} <span className="text-[#16A34A]">Verified</span></p>
        <div className="flex items-center gap-1 text-xs font-bold">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          {deal.rating} <span className="font-semibold text-slate-400">({deal.reviews})</span>
        </div>
        <div className="pt-1">
          <div className="text-[11px] font-bold text-slate-400 line-through">{deal.originalPrice}</div>
          <div className="text-xl font-black tracking-tight text-slate-950">{deal.price} <span className="text-[10px] font-bold text-slate-500">/person</span></div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <Badge className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-black text-[#16A34A] hover:bg-emerald-50">{deal.savings}</Badge>
          <span className="text-[10px] font-black text-[#16A34A]">Direct Booking Savings</span>
        </div>
        <Link aria-label={`Book Now ${deal.title}`} to={`/deals/${deal.id}`} className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-[#16A34A] text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-700">
          Book Now
        </Link>
      </div>
    </article>
  );
}

function DealsUnavailable() {
  return (
    <main className="min-h-[70vh] bg-white px-4 py-20 text-slate-950">
      <div className="mx-auto max-w-xl rounded-[28px] border border-slate-200 bg-slate-50 p-10 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-tight">Deals are temporarily unavailable</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
          The admin team has paused deal campaigns for now.
        </p>
        <Link to="/" className="mt-6 inline-flex">
          <Button className="rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700">Back to home</Button>
        </Link>
      </div>
    </main>
  );
}

function DealsListing() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative min-h-[380px] overflow-hidden">
        <img src={heroImage} alt="Luxury beach direct deals collage" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/65 to-white/10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent" />
        <div className="relative mx-auto max-w-[1500px] px-4 pb-14 pt-8 sm:px-6 lg:px-8">
          <div className="max-w-3xl pt-4">
            <Badge className="rounded-full bg-rose-500 px-4 py-2 text-xs font-black uppercase tracking-wide text-white shadow-lg shadow-rose-500/25 hover:bg-rose-500">
              <Flame className="mr-1.5 h-3.5 w-3.5" />
              Limited-Time Direct Deals
            </Badge>
            <h1 className="mt-4 max-w-2xl text-5xl font-black leading-[0.98] tracking-tight text-slate-950 md:text-6xl">
              Book Exclusive Offers <span className="text-[#16A34A]">Before</span> They Disappear!
            </h1>
            <p className="mt-4 text-lg font-semibold text-slate-700">Book exclusive offers before they disappear.</p>
          </div>

          <div className="mt-6 grid max-w-3xl grid-cols-2 gap-2 rounded-[18px] border border-white/80 bg-white/88 p-3 shadow-2xl shadow-slate-900/15 backdrop-blur-xl md:grid-cols-4">
            {stats.map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-2xl px-2 py-2">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', item.tone)}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="leading-tight">
                  <span className="sr-only">{item.label}</span>
                  <div className="text-sm font-black text-slate-950">{item.value}</div>
                  <div className="text-[10px] font-bold text-slate-500">{item.helper}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 pb-8 sm:px-6 lg:px-8">
        <div className="relative z-10 mt-5 flex gap-2 overflow-x-auto rounded-[18px] border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/8">
          {categories.map((category, index) => (
            <button key={category} className={cn('shrink-0 rounded-xl px-5 py-3 text-xs font-black transition', index === 0 ? 'bg-[#16A34A] text-white shadow-lg shadow-emerald-500/20' : 'text-slate-600 hover:bg-slate-50 hover:text-[#16A34A]')}>
              {category}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button key={filter} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-[#16A34A]">
                {filter}
              </button>
            ))}
          </div>
          <Button variant="outline" className="rounded-xl text-xs font-black text-slate-600">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Sort by: Ending Soon
          </Button>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>

        <div className="mt-7 overflow-hidden rounded-[22px] bg-[#16A34A] text-white shadow-2xl shadow-emerald-500/20">
          <div className="grid gap-4 p-5 md:grid-cols-[1fr_280px] md:items-center">
            <div>
              <h2 className="text-xl font-black">Direct Booking Advantages</h2>
              <div className="mt-3 flex flex-wrap gap-5 text-xs font-bold text-white/90">
                <span>Best Prices</span>
                <span>No Hidden Fees</span>
                <span>Instant Booking</span>
                <span>24/7 Support</span>
              </div>
            </div>
            <div className="rounded-2xl bg-gradient-to-r from-amber-100 to-orange-100 px-6 py-4 text-center text-slate-950">
              <div className="text-2xl font-black">Save Up to 50%</div>
              <div className="text-xs font-bold text-slate-600">When You Book Direct!</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function DealDetail({ deal, dealsEnabled }: { deal: Deal; dealsEnabled: boolean }) {
  const navigate = useNavigate();
  const [bookingMessage, setBookingMessage] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const gallery = deal.gallery.length > 0 ? deal.gallery : [deal.image, ...deals.slice(1, 4).map((item) => item.image)];
  const similar = deals.filter((item) => item.id !== deal.id).slice(0, 4);

  async function createDealBooking() {
    if (!dealsEnabled) {
      setBookingMessage('Deals are temporarily disabled by the admin team.');
      return;
    }

    setIsBooking(true);
    setBookingMessage('');

    try {
      const response = await fetch('/api/deals/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: deal.id,
          dealTitle: deal.title,
          amount: parseDealAmount(deal.price),
          travelerName: 'Guest Traveler',
          travelDate: '2026-06-24',
          participants: 2,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || 'Unable to lock this deal. Please try again.');
      }
      const payload = (await response.json()) as { booking?: { id?: string } };
      const bookingId = payload.booking?.id;
      if (!bookingId) throw new Error('Booking ID missing');
      navigate(`/deals/confirmation?bookingId=${encodeURIComponent(bookingId)}`);
    } catch (error) {
      setBookingMessage(error instanceof Error ? error.message : 'Unable to lock this deal. Please try again.');
    } finally {
      setIsBooking(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
            <Link to="/deals" aria-label="Back to deals" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white hover:text-[#16A34A]">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span>Deals &gt; {deal.title}</span>
          </div>
          <div className="flex gap-2">
            <button aria-label="Save deal" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white hover:text-[#16A34A]"><Heart className="h-4 w-4" /></button>
            <button aria-label="Share deal" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white hover:text-[#16A34A]"><Share2 className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="relative overflow-hidden rounded-[24px]">
              <img src={gallery[0]} alt={deal.title} className="h-[380px] w-full object-cover" />
              <Badge className="absolute left-5 top-5 rounded-xl bg-rose-500 px-5 py-2 text-lg font-black text-white hover:bg-rose-500">
                <Flame className="mr-2 h-5 w-5" />
                {deal.badge}
              </Badge>
              <div className="absolute right-5 top-5 w-[270px]">
                <DealTimer value={deal.timer} />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-3">
              {gallery.slice(0, 4).map((image) => (
                <img key={image} src={image} alt={`${deal.title} preview`} className="aspect-[4/3] rounded-xl object-cover" />
              ))}
              <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-slate-950 text-lg font-black text-white">+18</div>
            </div>

            <div className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-600">
              Hurry! High demand deal. Prices go up as availability drops.
            </div>

            <div className="mt-5">
              <h1 className="text-4xl font-black tracking-tight">{deal.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-bold text-slate-600">
                <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4 text-[#16A34A]" />{deal.location}</span>
                <span>By {deal.provider}</span>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[#16A34A]">Verified Partner</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm font-bold">
                <span className="inline-flex items-center gap-1 text-orange-500"><Star className="h-4 w-4 fill-orange-400" />{deal.rating}</span>
                <span className="text-slate-500">({deal.reviews})</span>
                <span className="text-slate-500">500+ Bookings</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 border-b border-slate-200 pb-5 text-xs font-bold text-slate-600">
                {deal.meta.map((item) => <span key={item}>{item}</span>)}
              </div>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div>
                <h2 className="text-lg font-black">About this Deal</h2>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600">Relax on premium beaches, enjoy curated local experiences, and book directly with verified suppliers for exclusive direct-booking savings.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <h2 className="text-lg font-black">Deal Price</h2>
                <div className="mt-2 text-sm font-bold text-slate-400 line-through">{deal.originalPrice}</div>
                <div className="text-3xl font-black">{deal.price} <span className="text-xs font-bold text-slate-500">/person</span></div>
                <Badge className="mt-2 rounded-lg bg-emerald-50 text-[#16A34A] hover:bg-emerald-50">{deal.savings} ({deal.savingsPercent})</Badge>
              </div>
            </div>

            <div className="mt-6 grid gap-5 rounded-2xl border border-slate-200 p-5 md:grid-cols-2">
              <div>
                <h2 className="font-black">What's Included</h2>
                {['3 Nights Hotel Stay', 'Daily Breakfast', 'Airport Transfers', 'Sightseeing Tours', 'Water Sports', 'All Taxes & Fees'].map((item) => (
                  <div key={item} className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><Check className="h-4 w-4 text-[#16A34A]" />{item}</div>
                ))}
              </div>
              <div>
                <h2 className="font-black">What's Not Included</h2>
                {['Airfare / Train', 'Lunch & Dinner', 'Personal Expenses', 'Travel Insurance'].map((item) => (
                  <div key={item} className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><X className="h-4 w-4 text-rose-500" />{item}</div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-5">
                <h2 className="font-black">Travel Dates</h2>
                <p className="mt-2 text-sm font-semibold text-slate-600">24 May - 30 Jun, 2026</p>
                <p className="text-xs font-medium text-slate-500">Best time to visit {deal.location.split(',')[0]}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-5">
                <h2 className="font-black">Cancellation Policy</h2>
                <p className="mt-2 text-sm font-semibold text-slate-600">Free cancellation up to 24 hrs before check-in.</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 rounded-2xl bg-orange-50 p-4 text-sm font-black text-orange-700 md:grid-cols-4">
              <span>🔥 {deal.availability}</span>
              <span>Booked 42 Times Today</span>
              <span>Price Expires Tonight</span>
              <span>20 Users Viewing</span>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-black">Similar Deals</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {similar.map((item) => (
                  <Link key={item.id} to={`/deals/${item.id}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                    <img src={item.image} alt={item.title} className="aspect-[4/3] w-full object-cover" />
                    <div className="p-3">
                      <Badge className="mb-2 rounded-lg bg-rose-500 text-white hover:bg-rose-500">{item.badge}</Badge>
                      <h3 className="text-sm font-black">{item.title}</h3>
                      <p className="text-xs font-bold text-slate-500">{item.price} /person</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[24px] border border-slate-200 bg-white/95 p-5 shadow-2xl shadow-slate-900/12 backdrop-blur-xl">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-black text-slate-500">Deal Price</div>
                  <div className="mt-1 text-sm font-bold text-slate-400 line-through">{deal.originalPrice}</div>
                  <div className="text-3xl font-black">{deal.price} <span className="text-xs font-bold text-slate-500">/person</span></div>
                </div>
                <Badge className="rounded-lg bg-emerald-50 text-[#16A34A] hover:bg-emerald-50">{deal.savings}</Badge>
              </div>
              <label className="mt-5 block text-xs font-black text-slate-700">Select Date</label>
              <button className="mt-2 flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700">
                24 May - 27 May, 2026 <CalendarDays className="h-4 w-4 text-slate-400" />
              </button>
              <label className="mt-4 block text-xs font-black text-slate-700">Guests</label>
              <button className="mt-2 flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700">
                2 Adults, 0 Child <Users className="h-4 w-4 text-slate-400" />
              </button>
              <Button
                className="mt-5 h-14 w-full rounded-xl bg-[#16A34A] text-base font-black text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700"
                onClick={() => void createDealBooking()}
                disabled={isBooking}
              >
                {isBooking ? 'Locking Deal...' : 'Book Now'}
              </Button>
              <Button variant="outline" className="mt-3 h-12 w-full rounded-xl font-black">
                Reserve This Deal
              </Button>
              {bookingMessage && <p className="mt-3 text-xs font-black text-rose-600">{bookingMessage}</p>}
              <div className="mt-5 space-y-3 border-t border-slate-100 pt-5 text-xs font-bold text-slate-600">
                {['Best Price Guaranteed', 'Free Cancellation', 'Secure Payment', 'No Hidden Charges'].map((item) => (
                  <div key={item} className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#16A34A]" />{item}</div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default function Deals() {
  const { dealId } = useParams();
  const { system } = usePublicSiteConfig();

  if (!system.dealsEnabled) {
    return <DealsUnavailable />;
  }

  if (dealId) {
    return <DealDetail deal={getDeal(dealId)} dealsEnabled={system.dealsEnabled} />;
  }

  return <DealsListing />;
}
