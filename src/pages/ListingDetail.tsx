import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { adventures, formatRupees } from '@/src/data/tripetripAdventures';
import { getCurrentSession } from '@/src/services/auth';
import { createBooking } from '@/src/services/bookings';
import { getListingById } from '@/src/services/listings';
import { getProfile } from '@/src/services/profiles';
import type { Listing } from '@/src/types/domain';
import {
  BadgeCheck,
  Calendar,
  Camera,
  Check,
  ChevronRight,
  Clock,
  Heart,
  MapPin,
  MessageCircle,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ListingDetail() {
  const { id } = useParams();
  const adventure = id ? adventures.find((item) => item.id === id) ?? null : null;
  const [dynamicListing, setDynamicListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(false);
  const similar = adventure ? adventures.filter((item) => item.id !== adventure.id).slice(0, 4) : [];
  const total = adventure ? adventure.directPrice * 2 : 0;

  useEffect(() => {
    let mounted = true;

    if (adventure || !id) {
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
  }, [adventure, id]);

  if (!adventure) {
    if (loading) {
      return (
        <main className="grid min-h-[60vh] place-items-center bg-white px-4">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-slate-400">Loading experience</p>
        </main>
      );
    }

    if (!dynamicListing) {
      return (
        <main className="grid min-h-[60vh] place-items-center bg-white px-4">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-slate-900">Listing not found</h1>
            <Link to="/" className="mt-6 inline-flex">
              <Button variant="outline" className="rounded-xl font-bold">Back home</Button>
            </Link>
          </div>
        </main>
      );
    }

    return <DynamicListingDetail listing={dynamicListing} />;
  }

  return (
    <main className="bg-white pb-28 text-slate-950 lg:pb-14">
      <div className="mx-auto max-w-[1500px] px-3 py-4 sm:px-4 md:px-8">
        <div className="mb-4 flex items-center justify-between gap-4 text-xs font-bold text-slate-500">
          <div className="flex min-w-0 items-center gap-2">
            <Link to="/" className="hover:text-[#059669]">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/activities" className="hover:text-[#059669]">Activities</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="truncate">{adventure.title}</span>
          </div>
          <div className="hidden gap-2 md:flex">
            <Button variant="outline" size="sm" className="rounded-xl font-bold">Share</Button>
            <Button variant="outline" size="sm" className="rounded-xl font-bold"><Heart className="mr-2 h-4 w-4" /> Save</Button>
          </div>
        </div>

        <section className="grid gap-5 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="relative aspect-[16/8] min-h-[360px] overflow-hidden rounded-[32px] bg-slate-100 shadow-[0_24px_90px_rgba(15,23,42,0.16)]">
              <img src={adventure.gallery[0]} alt={adventure.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />
              <button aria-label="Play video preview" className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/88 text-[#059669] shadow-2xl backdrop-blur-md">
                <Play className="ml-1 h-7 w-7 fill-[#059669]" />
              </button>
              <div className="absolute bottom-5 left-5 flex flex-wrap items-center gap-2">
                <Badge className="rounded-full bg-white/90 px-3 py-1 text-slate-900 backdrop-blur-md hover:bg-white/90">
                  <BadgeCheck className="mr-1 h-3.5 w-3.5 text-[#059669]" />
                  Verified Operator
                </Badge>
                <Badge className="rounded-full bg-emerald-500 px-3 py-1 text-white hover:bg-emerald-500">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                  Safety Certified
                </Badge>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-3">
              {adventure.gallery.slice(0, 5).map((image, index) => (
                <div key={image} className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100">
                  <img src={image} alt={`${adventure.title} gallery ${index + 1}`} className="h-full w-full object-cover" />
                  {index === 4 && <div className="absolute inset-0 grid place-items-center bg-slate-950/55 text-sm font-black text-white">+12</div>}
                </div>
              ))}
            </div>
          </div>

          <BookingPanel title={adventure.title} price={adventure.directPrice} savings={adventure.savings} total={total} />
        </section>

        <section className="mt-9 grid gap-9 lg:grid-cols-[1fr_380px]">
          <div className="space-y-9">
            <section>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="rounded-full bg-emerald-50 px-3 py-1 text-[#059669] hover:bg-emerald-50">{adventure.activity}</Badge>
                <span className="flex items-center gap-1 text-sm font-black"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {adventure.rating} ({adventure.reviewsCount} reviews)</span>
                <span className="text-sm font-bold text-slate-500">{adventure.totalBookings}+ bookings</span>
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{adventure.title}</h1>
              <p className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-500">
                <MapPin className="h-4 w-4 text-[#059669]" />
                {adventure.location}
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                By {adventure.operator.name}
              </p>
            </section>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric icon={Clock} label="Duration" value={adventure.duration} />
              <Metric icon={Users} label="Group" value={adventure.groupSize} />
              <Metric icon={ShieldCheck} label="Safety Score" value={`${Math.round(adventure.safetyRating * 20)} / 100`} />
              <Metric icon={Calendar} label="Best Season" value={adventure.bestSeason} />
            </div>

            <div className="rounded-[24px] border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-[#047857]">
              <Sparkles className="mr-2 inline h-4 w-4" />
              Book Direct & Save {formatRupees(adventure.savings)} compared to other platforms.
            </div>

            <Section title="About The Experience">
              <p className="max-w-4xl text-sm font-semibold leading-7 text-slate-600">{adventure.description}</p>
            </Section>

            <div className="grid gap-6 md:grid-cols-2">
              <Section title="Highlights">
                <PillList items={adventure.highlights} />
              </Section>
              <Section title="Requirements">
                <PillList items={adventure.requirements} />
              </Section>
              <Section title="What To Bring">
                <PillList items={adventure.whatToBring} />
              </Section>
              <Section title="Meeting Point">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700">
                  <MapPin className="mr-2 inline h-4 w-4 text-[#059669]" />
                  {adventure.meetingPoint}
                </div>
              </Section>
            </div>

            <Section title="Itinerary">
              <div className="space-y-0">
                {adventure.itinerary.map((item) => (
                  <div key={item.time} className="grid grid-cols-[72px_24px_1fr] gap-3">
                    <span className="pt-1 text-xs font-black text-slate-500">{item.time}</span>
                    <span className="relative flex justify-center">
                      <span className="h-4 w-4 rounded-full border-4 border-emerald-100 bg-[#059669]" />
                      <span className="absolute bottom-0 top-5 w-px bg-emerald-100 last:hidden" />
                    </span>
                    <div className="pb-6">
                      <h3 className="text-sm font-black">{item.title}</h3>
                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Safety">
              <div className="grid gap-3 md:grid-cols-2">
                {adventure.safety.map((item) => (
                  <Card key={item.label} className="rounded-[22px] border-slate-200 bg-white p-4 shadow-sm">
                    <item.icon className="mb-3 h-5 w-5 text-[#059669]" />
                    <h3 className="text-sm font-black">{item.label}</h3>
                    <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{item.text}</p>
                  </Card>
                ))}
              </div>
            </Section>

            <Section title="Reviews">
              <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-4xl font-black">{adventure.rating}</p>
                    <p className="mt-1 text-sm font-bold text-slate-500">Based on {adventure.reviewsCount} verified reviews</p>
                  </div>
                  <div className="flex text-amber-400">★★★★★</div>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {adventure.reviews.map((review) => (
                    <article key={review.name} className="rounded-[22px] bg-slate-50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-white text-sm font-black text-[#059669]">{review.name[0]}</div>
                        <div>
                          <h3 className="text-sm font-black">{review.name}</h3>
                          <p className="text-xs font-semibold text-slate-500">{review.location} • {review.date}</p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{review.story}</p>
                      <div className="mt-3 flex gap-2">
                        {review.photos.map((photo) => <img key={photo} src={photo} alt={`${review.name} adventure`} className="h-14 w-20 rounded-xl object-cover" />)}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </Section>

            <Section title="Similar Experiences">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {similar.map((item) => (
                  <Link key={item.id} to={`/listing/${item.id}`} className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                    <img src={item.image} alt={item.title} className="aspect-[4/3] w-full object-cover" />
                    <div className="p-4">
                      <h3 className="text-sm font-black">{item.title}</h3>
                      <p className="mt-1 text-xs font-bold text-slate-500">{item.location}</p>
                      <p className="mt-4 text-sm font-black">{formatRupees(item.directPrice)} <span className="text-[10px] font-semibold text-slate-500">/person</span></p>
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          </div>

          <aside className="space-y-5">
            <OperatorCard adventure={adventure} />
            <AdvancedFeatures items={adventure.advanced} />
          </aside>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-14px_50px_rgba(15,23,42,0.14)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="flex-1">
            <p className="text-lg font-black">{formatRupees(adventure.directPrice)} <span className="text-xs font-semibold text-slate-500">/person</span></p>
            <p className="text-xs font-black text-[#059669]">Save {formatRupees(adventure.savings)}</p>
          </div>
          <Link to="/booking-confirmed" className="flex-1">
            <Button className="h-12 w-full rounded-2xl bg-[#059669] font-black text-white hover:bg-emerald-700">Book Now</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

function DynamicListingDetail({ listing }: { listing: Listing }) {
  const navigate = useNavigate();
  const heroImage = listing.images[0] || 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&q=80&w=1600';
  const unitPrice = Number(listing.base_price || 0);
  const duration = String(listing.specifics?.duration || 'Flexible schedule');
  const amenities = listing.amenities.length ? listing.amenities : ['Tripetrip verified', 'Direct support', 'Hosted experience'];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => getTomorrowDateInput());
  const [participants, setParticipants] = useState(() => Math.min(Math.max(listing.max_capacity || 2, 1), 2));
  const participantOptions = useMemo(
    () => Array.from({ length: Math.max(listing.max_capacity || 2, 1) }, (_, index) => index + 1),
    [listing.max_capacity],
  );
  const total = unitPrice * participants;

  const handleBooking = async () => {
    if (!selectedDate) {
      toast.error('Select a date first');
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
        startDate: new Date(`${selectedDate}T12:00:00.000Z`).toISOString(),
        guests: participants,
        totalPrice: total,
      });

      toast.success('Booking request created');
      navigate(`/booking-confirmed?bookingId=${booking.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create booking';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="bg-white pb-28 text-slate-950 lg:pb-14">
      <div className="mx-auto max-w-[1500px] px-3 py-4 sm:px-4 md:px-8">
        <div className="mb-4 flex items-center justify-between gap-4 text-xs font-bold text-slate-500">
          <div className="flex min-w-0 items-center gap-2">
            <Link to="/" className="hover:text-[#059669]">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="truncate">{listing.title}</span>
          </div>
        </div>

        <section className="grid gap-5 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="relative aspect-[16/8] min-h-[360px] overflow-hidden rounded-[32px] bg-slate-100 shadow-[0_24px_90px_rgba(15,23,42,0.16)]">
              <img src={heroImage} alt={listing.title} className="h-full w-full object-cover" />
            </div>

            <section className="mt-8">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="rounded-full bg-emerald-50 px-3 py-1 text-[#059669] hover:bg-emerald-50">{listing.category}</Badge>
                <span className="text-sm font-bold text-slate-500">{listing.location}</span>
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{listing.title}</h1>
              <p className="mt-4 max-w-4xl text-sm font-semibold leading-7 text-slate-600">{listing.description}</p>
            </section>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric icon={Clock} label="Duration" value={duration} />
              <Metric icon={Users} label="Capacity" value={`${listing.max_capacity || 2} guests`} />
              <Metric icon={ShieldCheck} label="Booking" value="Direct request" />
              <Metric icon={MapPin} label="Location" value={listing.location} />
            </div>

            <Section title="Included">
              <PillList items={amenities} />
            </Section>
          </div>

          <Card className="hidden rounded-[28px] border-slate-200 bg-white/92 p-5 shadow-[0_22px_80px_rgba(15,23,42,0.14)] backdrop-blur-xl lg:sticky lg:top-24 lg:block">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-3xl font-black">{formatRupees(unitPrice)} <span className="text-xs font-semibold text-slate-500">/{listing.price_unit.replace('per_', '')}</span></p>
                <p className="mt-2 text-xs font-black text-[#059669]">Direct listing by verified vendor</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block text-xs font-black">
                Select Date
                <Input
                  type="date"
                  className="mt-2 h-12 rounded-xl"
                  aria-label={`Select date for ${listing.title}`}
                  value={selectedDate}
                  min={getTodayDateInput()}
                  onChange={(event) => setSelectedDate(event.target.value)}
                />
              </label>
              <label className="block text-xs font-black">
                Participants
                <div className="mt-2 flex h-12 items-center rounded-xl border border-slate-200 px-3 text-sm font-bold">
                  <Users className="mr-3 h-4 w-4 text-slate-400" />
                  <select
                    value={participants}
                    onChange={(event) => setParticipants(Number(event.target.value))}
                    className="w-full bg-transparent outline-none"
                    aria-label={`Participants for ${listing.title}`}
                  >
                    {participantOptions.map((count) => (
                      <option key={count} value={count}>
                        {count} participant{count > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
            </div>

            <div className="my-5 flex items-end justify-between border-t border-slate-100 pt-4">
              <div>
                <p className="text-sm font-black">Estimated Total</p>
                <p className="text-xs font-semibold text-slate-500">Based on 2 participants</p>
              </div>
              <p className="text-2xl font-black">{formatRupees(total)}</p>
            </div>

            <Button
              className="h-12 w-full rounded-xl bg-[#059669] font-black text-white hover:bg-emerald-700"
              onClick={handleBooking}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Booking...' : 'Send Booking Request'}
            </Button>
            <Button variant="outline" className="mt-3 h-12 w-full rounded-xl font-black"><MessageCircle className="mr-2 h-4 w-4" /> Contact Provider</Button>
          </Card>
        </section>
      </div>
    </main>
  );
}

function BookingPanel({ title, price, savings, total }: { title: string; price: number; savings: number; total: number }) {
  return (
    <Card className="hidden rounded-[28px] border-slate-200 bg-white/92 p-5 shadow-[0_22px_80px_rgba(15,23,42,0.14)] backdrop-blur-xl lg:sticky lg:top-24 lg:block">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-3xl font-black">{formatRupees(price)} <span className="text-xs font-semibold text-slate-500">/person</span></p>
          <p className="mt-2 text-xs font-black text-[#059669]">Best Price Guaranteed</p>
        </div>
        <Badge className="rounded-full bg-emerald-50 text-[#059669] hover:bg-emerald-50">Save {formatRupees(savings)}</Badge>
      </div>

      <div className="mt-5 space-y-4">
        <label className="block text-xs font-black">Select Date<Input type="date" className="mt-2 h-12 rounded-xl" aria-label={`Select date for ${title}`} /></label>
        <div>
          <p className="text-xs font-black">Select Slot</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {['8 AM', '10 AM', '12 PM', '2 PM', '4 PM'].map((slot) => (
              <button key={slot} className={`h-10 rounded-xl border text-xs font-black ${slot === '10 AM' ? 'border-[#059669] bg-emerald-50 text-[#059669]' : 'border-slate-200 text-slate-600'}`}>{slot}</button>
            ))}
          </div>
        </div>
        <label className="block text-xs font-black">Participants<div className="mt-2 flex h-12 items-center justify-between rounded-xl border border-slate-200 px-3 text-sm font-bold"><Users className="h-4 w-4 text-slate-400" /> 2 Adults <ChevronRight className="h-4 w-4 rotate-90 text-slate-400" /></div></label>
      </div>

      <div className="my-5 flex items-end justify-between border-t border-slate-100 pt-4">
        <div>
          <p className="text-sm font-black">Total Amount</p>
          <p className="text-xs font-semibold text-slate-500">({formatRupees(price)} x 2)</p>
        </div>
        <p className="text-2xl font-black">{formatRupees(total)}</p>
      </div>

      <Link to="/booking-confirmed"><Button className="h-12 w-full rounded-xl bg-[#059669] font-black text-white hover:bg-emerald-700">Book Now</Button></Link>
      <Button variant="outline" className="mt-3 h-12 w-full rounded-xl font-black"><MessageCircle className="mr-2 h-4 w-4" /> Contact Operator</Button>
      <div className="mt-4 space-y-3 text-xs font-bold text-slate-600">
        <p><Check className="mr-2 inline h-4 w-4 text-[#059669]" /> Instant Confirmation</p>
        <p><Check className="mr-2 inline h-4 w-4 text-[#059669]" /> Free Cancellation up to 24 hours before</p>
        <p><Check className="mr-2 inline h-4 w-4 text-[#059669]" /> Secure Booking</p>
      </div>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-black tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function PillList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 shadow-sm">{item}</span>
      ))}
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
      <Icon className="mb-3 h-5 w-5 text-[#059669]" />
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function OperatorCard({ adventure }: { adventure: ReturnType<typeof findAdventure> }) {
  return (
    <Card className="rounded-[26px] border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-black">Operator Profile</h2>
      <div className="flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 text-lg font-black text-[#059669]">{adventure.operator.logo}</div>
        <div>
          <p className="font-black">{adventure.operator.name}</p>
          <p className="mt-1 text-xs font-black text-[#059669]">Verified Operator</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{adventure.operator.rating} ({adventure.reviewsCount} reviews)</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <MiniStat label="Experience" value={adventure.operator.years} />
        <MiniStat label="Trips" value={adventure.operator.trips} />
        <MiniStat label="Response" value={adventure.operator.responseTime} />
      </div>
      <Button variant="outline" className="mt-5 h-11 w-full rounded-xl font-black">View Profile</Button>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-sm font-black">{value}</p>
      <p className="mt-1 text-[10px] font-bold text-slate-500">{label}</p>
    </div>
  );
}

function AdvancedFeatures({ items }: { items: ReturnType<typeof findAdventure>['advanced'] }) {
  return (
    <Card className="rounded-[26px] border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-black">Live Trip Intelligence</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
            <item.icon className="mt-0.5 h-4 w-4 text-[#059669]" />
            <div>
              <p className="text-xs font-black">{item.label}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
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
