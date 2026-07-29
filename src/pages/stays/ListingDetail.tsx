import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatRupees, inclusions, packages as stays } from '@/src/data/tripetripStays';
import { getCurrentSession } from '@/src/services/auth';
import { createBooking } from '@/src/services/bookings';
import { ArrowLeft, BadgeCheck, Calendar, Check, Heart, MapPin, MessageCircle, Share2, Star, Users, X } from 'lucide-react';
import { getListingById } from '@/src/services/listings';
import { getProfile } from '@/src/services/profiles';
import type { Listing } from '@/src/types/domain';
import { toast } from 'sonner';

export default function StayListingDetail() {
  const { id } = useParams();
  const stay = id ? stays.find((item) => item.id === id) ?? null : null;
  const [dynamicListing, setDynamicListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(false);
  const similar = stay ? stays.filter((item) => item.id !== stay.id).slice(0, 4) : [];

  useEffect(() => {
    let mounted = true;

    if (stay || !id) {
      setDynamicListing(null);
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    setLoading(true);
    getListingById(id)
      .then((listing) => {
        if (mounted) setDynamicListing(listing);
      })
      .catch(() => {
        if (mounted) setDynamicListing(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id, stay]);

  if (!stay) {
    if (loading) {
      return (
        <main className="grid min-h-[60vh] place-items-center bg-white px-4">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-slate-400">Loading stay</p>
        </main>
      );
    }

    if (!dynamicListing) {
      return (
        <main className="grid min-h-[60vh] place-items-center bg-white px-4">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-slate-900">Stay not found</h1>
            <Link to="/stays" className="mt-6 inline-flex">
              <Button variant="outline" className="rounded-xl font-bold">Back to stays</Button>
            </Link>
          </div>
        </main>
      );
    }

    return <DynamicStayListingDetail listing={dynamicListing} />;
  }

  return (
    <main className="bg-white pb-24 text-slate-950 lg:pb-12">
      <div className="mx-auto max-w-[1500px] px-4 py-5 md:px-8">
        <div className="mb-4 flex items-center justify-between gap-4 text-xs font-bold text-slate-600">
          <Link to="/stays" className="flex items-center gap-2 hover:text-[#16A34A]"><ArrowLeft className="h-4 w-4" /> Back to results</Link>
          <div className="hidden gap-2 md:flex">
            <Button variant="ghost" size="sm" className="rounded-xl"><Heart className="mr-2 h-4 w-4" /> Save</Button>
            <Button variant="ghost" size="sm" className="rounded-xl"><Share2 className="mr-2 h-4 w-4" /> Share</Button>
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="grid gap-3 lg:grid-cols-[1.35fr_1fr]">
              <div className="relative min-h-[340px] overflow-hidden rounded-[20px] bg-slate-100 lg:min-h-[430px]">
                <img src={stay.heroImage} alt={stay.title} className="h-full w-full object-cover" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {stay.images.slice(1, 5).map((image, index) => (
                  <div key={image} className="relative min-h-[160px] overflow-hidden rounded-[16px] bg-slate-100">
                    <img src={image} alt={`${stay.title} view ${index + 1}`} className="h-full w-full object-cover" />
                    {index === 3 && <div className="absolute inset-0 grid place-items-center bg-slate-950/45 text-lg font-extrabold text-white">+28</div>}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{stay.title}</h1>
                <Badge className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-extrabold uppercase text-[#16A34A] hover:bg-emerald-50">{stay.propertyType}</Badge>
                <Badge className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-extrabold text-[#16A34A] hover:bg-emerald-50"><BadgeCheck className="mr-1 h-3.5 w-3.5" /> Verified Property</Badge>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-600">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-[#16A34A]" /> {stay.location}</span>
                <Link to="/stays" className="text-[#16A34A]">View on map</Link>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-bold">
                <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {stay.rating} ({stay.reviews} reviews)</span>
                <span className="text-slate-500">{stay.bookings}+ bookings</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                {inclusions.map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <item.icon className="h-4 w-4 text-slate-500" />
                    {item.label}
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-extrabold text-[#16A34A]">
                Book Direct & Save {formatRupees(stay.savings)} compared to other platforms
              </div>
            </div>
          </div>

          <BookingPanel price={stay.directPrice} original={stay.originalPrice} savings={stay.savings} />
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <nav className="flex gap-8 border-b border-slate-200 text-xs font-extrabold text-slate-500">
              {['Overview', 'Amenities', 'House Rules', 'Reviews', 'Host', 'Location'].map((tab, index) => (
                <span key={tab} className={`pb-3 ${index === 0 ? 'border-b-2 border-[#16A34A] text-[#16A34A]' : ''}`}>{tab}</span>
              ))}
            </nav>

            <Section title="Overview">
              <p className="max-w-4xl text-sm font-medium leading-7 text-slate-600">{stay.overview}</p>
              <button className="mt-3 text-sm font-extrabold text-[#16A34A]">Read more</button>
            </Section>

            <Section title="Amenities">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {stay.amenities.map((item) => <div key={item} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">{item}</div>)}
              </div>
            </Section>

            <div className="grid gap-6 md:grid-cols-2">
              <Section title="What's Included">
                <CheckList items={stay.included} />
              </Section>
              <Section title="What's Not Included">
                <XList items={stay.excluded} />
              </Section>
            </div>

            <Reviews />

            <Section title="Similar Properties">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {similar.map((item) => (
                  <Link key={item.id} to={`/stays/${item.id}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                    <img src={item.heroImage} alt={item.title} className="aspect-[4/3] w-full object-cover" />
                    <div className="p-3">
                      <h3 className="text-sm font-extrabold">{item.title}</h3>
                      <p className="text-xs font-semibold text-slate-500">{item.location}</p>
                      <p className="mt-2 text-sm font-extrabold">{formatRupees(item.directPrice)} <span className="text-[10px] font-medium text-slate-500">/night</span></p>
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          </div>

          <aside className="hidden space-y-5 lg:block">
            <HostCard stay={stay} />
          </aside>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-12px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="flex-1">
            <p className="text-lg font-extrabold">{formatRupees(stay.directPrice)} <span className="text-xs font-medium text-slate-500">/night</span></p>
            <p className="text-xs font-bold text-[#16A34A]">Save {formatRupees(stay.savings)}</p>
          </div>
          <Link to="/stays/booking-confirmed" className="flex-1">
            <Button className="h-12 w-full rounded-2xl bg-[#16A34A] font-extrabold text-white hover:bg-emerald-700">Book Now</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

function DynamicStayListingDetail({ listing }: { listing: Listing }) {
  const navigate = useNavigate();
  const propertyType = String(listing.specifics?.property_type || listing.category || 'Stay');
  const heroImage = listing.images[0] || 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=1600';
  const amenities = listing.amenities.length ? listing.amenities : ['Verified host', 'Direct booking support', 'Tripetrip assistance'];
  const nightlyPrice = Number(listing.base_price || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkInDate, setCheckInDate] = useState(() => getTomorrowDateInput());
  const [guestCount, setGuestCount] = useState(() => Math.min(Math.max(listing.max_capacity || 2, 1), 2));
  const guestOptions = useMemo(
    () => Array.from({ length: Math.max(listing.max_capacity || 2, 1) }, (_, index) => index + 1),
    [listing.max_capacity],
  );

  const handleBooking = async () => {
    if (!checkInDate) {
      toast.error('Select a check-in date');
      return;
    }

    try {
      setIsSubmitting(true);
      const { user } = await getCurrentSession();
      if (!user) {
        toast.error('Please log in as a traveler to continue');
        navigate('/login');
        return;
      }

      const profile = await getProfile(user.id).catch(() => null);
      const booking = await createBooking({
        listingId: listing.id,
        vendorId: listing.vendor_id,
        travelerId: user.id,
        travelerName: profile?.full_name || user.user_metadata?.full_name || user.email || 'Tripetrip Traveler',
        startDate: new Date(`${checkInDate}T12:00:00.000Z`).toISOString(),
        endDate: null,
        guests: guestCount,
        totalPrice: nightlyPrice * guestCount,
      });

      toast.success('Booking request created');
      navigate(`/stays/booking-confirmed?bookingId=${booking.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create booking';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="bg-white pb-24 text-slate-950 lg:pb-12">
      <div className="mx-auto max-w-[1500px] px-4 py-5 md:px-8">
        <div className="mb-4 flex items-center justify-between gap-4 text-xs font-bold text-slate-600">
          <Link to="/stays" className="flex items-center gap-2 hover:text-[#16A34A]"><ArrowLeft className="h-4 w-4" /> Back to results</Link>
        </div>

        <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="relative min-h-[340px] overflow-hidden rounded-[20px] bg-slate-100 lg:min-h-[430px]">
              <img src={heroImage} alt={listing.title} className="h-full w-full object-cover" />
            </div>

            <div className="mt-6">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{listing.title}</h1>
                <Badge className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-extrabold uppercase text-[#16A34A] hover:bg-emerald-50">{propertyType}</Badge>
                <Badge className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-extrabold text-[#16A34A] hover:bg-emerald-50"><BadgeCheck className="mr-1 h-3.5 w-3.5" /> Verified Property</Badge>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-600">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-[#16A34A]" /> {listing.location}</span>
              </div>
              <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-extrabold text-[#16A34A]">
                Direct booking live for this vendor listing
              </div>
            </div>
          </div>

          <Card className="hidden rounded-[20px] border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.12)] lg:sticky lg:top-24 lg:block">
            <div className="text-2xl font-extrabold">{formatRupees(nightlyPrice)} <span className="text-xs font-medium text-slate-500">/ night</span></div>
            <div className="mt-5 space-y-3">
              <label className="block text-xs font-bold">
                Check-in
                <div className="mt-2 flex h-12 items-center rounded-xl border border-slate-200 px-3 text-sm font-bold">
                  <Calendar className="mr-3 h-4 w-4 text-slate-400" />
                  <input
                    type="date"
                    value={checkInDate}
                    min={getTodayDateInput()}
                    onChange={(event) => setCheckInDate(event.target.value)}
                    className="w-full bg-transparent outline-none"
                    aria-label={`Check-in date for ${listing.title}`}
                  />
                </div>
              </label>
              <label className="block text-xs font-bold">
                Guests
                <div className="mt-2 flex h-12 items-center rounded-xl border border-slate-200 px-3 text-sm font-bold">
                  <Users className="mr-3 h-4 w-4 text-slate-400" />
                  <select
                    value={guestCount}
                    onChange={(event) => setGuestCount(Number(event.target.value))}
                    className="w-full bg-transparent outline-none"
                    aria-label={`Guests for ${listing.title}`}
                  >
                    {guestOptions.map((count) => (
                      <option key={count} value={count}>
                        {count} guest{count > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
            </div>
            <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">
              <div>
                <p className="text-sm font-extrabold">Estimated Total</p>
                <p className="text-xs font-semibold text-slate-500">{formatRupees(nightlyPrice)} x {guestCount}</p>
              </div>
              <p className="text-2xl font-extrabold">{formatRupees(nightlyPrice * guestCount)}</p>
            </div>
            <Button
              className="mt-5 h-12 w-full rounded-xl bg-[#16A34A] font-extrabold text-white hover:bg-emerald-700"
              onClick={handleBooking}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Booking...' : 'Send Booking Request'}
            </Button>
            <Button variant="outline" className="mt-3 h-12 w-full rounded-xl font-bold"><MessageCircle className="mr-2 h-4 w-4" /> Contact Host</Button>
          </Card>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <Section title="Overview">
              <p className="max-w-4xl text-sm font-medium leading-7 text-slate-600">{listing.description}</p>
            </Section>

            <Section title="Amenities">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {amenities.map((item) => <div key={item} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">{item}</div>)}
              </div>
            </Section>
          </div>
        </section>
      </div>
    </main>
  );
}

function BookingPanel({ price, original, savings }: { price: number; original: number; savings: number }) {
  return (
    <Card className="hidden rounded-[20px] border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.12)] lg:sticky lg:top-24 lg:block">
      <div className="flex items-start justify-between">
        <div className="text-2xl font-extrabold">{formatRupees(price)} <span className="text-xs font-medium text-slate-500">/ night</span></div>
        <Badge className="rounded-full bg-emerald-50 text-[#16A34A] hover:bg-emerald-50">Save {formatRupees(savings)}</Badge>
      </div>
      <div className="text-xs font-semibold text-slate-400 line-through">{formatRupees(original)}</div>
      <div className="mt-5 space-y-3">
        <label className="block text-xs font-bold">Check-in - Check-out<div className="mt-2 flex h-12 items-center justify-between rounded-xl border border-slate-200 px-3 text-sm font-bold"><span>24 May, Sat - 26 May, Mon</span><Calendar className="h-4 w-4 text-slate-400" /></div></label>
        <label className="block text-xs font-bold">Guests<div className="mt-2 flex h-12 items-center justify-between rounded-xl border border-slate-200 px-3 text-sm font-bold"><Users className="h-4 w-4 text-slate-400" /> 2 Adults, 0 Child</div></label>
      </div>
      <Link to="/stays/booking-confirmed"><Button className="mt-5 h-12 w-full rounded-xl bg-[#16A34A] font-extrabold text-white hover:bg-emerald-700">Book Now</Button></Link>
      <Button variant="outline" className="mt-3 h-12 w-full rounded-xl font-bold"><MessageCircle className="mr-2 h-4 w-4" /> Contact Host</Button>
      <div className="mt-5 space-y-3 text-xs font-semibold text-slate-600">
        {['Verified Property', 'Secure Booking', 'Free Cancellation', 'Best Price Guaranteed'].map((item) => <div key={item} className="flex gap-2"><Check className="h-4 w-4 text-[#16A34A]" /> {item}</div>)}
      </div>
    </Card>
  );
}

type StayListing = (typeof stays)[number];

function HostCard({ stay }: { stay: StayListing }) {
  return (
    <Card className="rounded-[20px] border-slate-200 p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-extrabold">Hosted by</h3>
      <div className="flex items-center gap-4">
        <img src={stay.hostPhoto} alt={stay.provider} className="h-14 w-14 rounded-2xl object-cover" />
        <div>
          <p className="font-extrabold">{stay.provider}</p>
          <p className="text-xs font-bold text-[#16A34A]">Superhost</p>
        </div>
      </div>
      <div className="mt-5 space-y-2 text-sm font-semibold text-slate-600">
        <p>Response time: within 10 mins</p>
        <p>500+ stays hosted</p>
        <p><Star className="mr-1 inline h-4 w-4 fill-amber-400 text-amber-400" /> {stay.rating} Host rating</p>
      </div>
      <Button variant="outline" className="mt-5 h-11 w-full rounded-xl font-extrabold">View Host Profile</Button>
    </Card>
  );
}

function Reviews() {
  return (
    <Card className="rounded-[20px] border-slate-200 p-5 shadow-sm">
      <h2 className="text-lg font-extrabold">Reviews</h2>
      <div className="mt-4 grid gap-5 md:grid-cols-[220px_1fr]">
        <div>
          <div className="text-4xl font-extrabold">4.8</div>
          <div className="mt-2 flex gap-1">{[1, 2, 3, 4, 5].map((item) => <Star key={item} className="h-4 w-4 fill-amber-400 text-amber-400" />)}</div>
          <p className="mt-2 text-xs font-semibold text-slate-500">210 reviews</p>
        </div>
        <div className="space-y-4">
          {['Rohit Sharma', 'Priya Mehta'].map((name) => (
            <div key={name} className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between"><p className="text-sm font-extrabold">{name}</p><Badge className="bg-emerald-50 text-[#16A34A] hover:bg-emerald-50">Verified Stay</Badge></div>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-600">Great location, excellent hospitality and a beautifully maintained stay. Will definitely visit again.</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function CheckList({ items }: { items: string[] }) {
  return <ul className="space-y-3">{items.map((item) => <li key={item} className="flex gap-3 text-sm font-medium text-slate-700"><Check className="h-4 w-4 text-[#16A34A]" /> {item}</li>)}</ul>;
}

function XList({ items }: { items: string[] }) {
  return <ul className="space-y-3">{items.map((item) => <li key={item} className="flex gap-3 text-sm font-medium text-slate-700"><X className="h-4 w-4 text-red-500" /> {item}</li>)}</ul>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-extrabold">{title}</h2>
      {children}
    </section>
  );
}

function getTodayDateInput() {
  return new Date().toISOString().slice(0, 10);
}

function getTomorrowDateInput() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}
