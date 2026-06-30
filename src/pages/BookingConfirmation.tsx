import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { featuredAdventure, formatRupees } from '@/src/data/tripetripAdventures';
import { getBookingById } from '@/src/services/bookings';
import { getListingById } from '@/src/services/listings';
import type { Booking, Listing } from '@/src/types/domain';
import { CalendarPlus, Check, Clock, Download, MapPin, MessageCircle, ShieldCheck, Sparkles, TicketCheck } from 'lucide-react';

const qrBlocks = Array.from({ length: 81 }, (_, index) => index);

export default function BookingConfirmation() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!bookingId) {
      setBooking(null);
      setListing(null);
      return () => {
        mounted = false;
      };
    }

    getBookingById(bookingId)
      .then(async (savedBooking) => {
        if (!mounted) return;
        setBooking(savedBooking);
        const savedListing = await getListingById(savedBooking.listing_id).catch(() => null);
        if (mounted) setListing(savedListing);
      })
      .catch(() => {
        if (mounted) {
          setBooking(null);
          setListing(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, [bookingId]);

  const experience = listing
    ? {
        title: listing.title,
        location: listing.location,
        image: listing.images[0] || featuredAdventure.image,
        operatorName: 'Tripetrip Verified Vendor',
        duration: String(listing.specifics?.duration || 'Flexible schedule'),
        totalPaid: formatRupees(Number(booking?.total_price || listing.base_price || 0)),
      }
    : {
        title: featuredAdventure.title,
        location: featuredAdventure.location,
        image: featuredAdventure.image,
        operatorName: featuredAdventure.operator.name,
        duration: featuredAdventure.duration,
        totalPaid: formatRupees(featuredAdventure.directPrice * 2),
      };
  const bookingReference = booking ? booking.id.slice(0, 8).toUpperCase() : 'THR12345678';
  const guestCount = booking?.guests || 2;
  const bookingDate = booking ? new Date(booking.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '24 May';

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#ecfdf5_0,#ffffff_42%,#f8fafc_100%)] px-4 py-8 text-slate-950">
      <section className="mx-auto max-w-5xl">
        <div className="text-center">
          <div className="relative mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#059669] text-white shadow-2xl shadow-emerald-500/30">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/25" />
            <Check className="relative h-10 w-10" />
          </div>
          <Badge className="mt-5 rounded-full bg-emerald-50 px-4 py-1.5 text-[#059669] hover:bg-emerald-50">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Adventure Pass
          </Badge>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Booking Confirmed!</h1>
          <p className="mt-2 text-sm font-bold text-slate-500">Your adventure is booked successfully.</p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <article className="overflow-hidden rounded-[34px] border border-emerald-100 bg-white shadow-[0_28px_100px_rgba(15,23,42,0.12)]">
            <div className="relative min-h-[260px] p-6 sm:p-8">
              <img src={experience.image} alt={experience.title} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/76 via-slate-950/38 to-transparent" />
              <div className="relative max-w-xl text-white">
                <Badge className="rounded-full bg-white/18 text-white backdrop-blur-md hover:bg-white/18">
                  <TicketCheck className="mr-1.5 h-3.5 w-3.5" />
                  Direct Booking Pass
                </Badge>
                <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">{experience.title}</h2>
                <p className="mt-3 flex items-center gap-2 text-sm font-bold text-white/85"><MapPin className="h-4 w-4" /> {experience.location}</p>
                <div className="mt-6 grid max-w-md grid-cols-3 gap-3 text-center">
                  <PassStat label="Date" value={bookingDate} />
                  <PassStat label="Slot" value="10 AM" />
                  <PassStat label="Guests" value={String(guestCount)} />
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-6 sm:p-8 md:grid-cols-[1fr_220px]">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Booking ID</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-[#059669]">{bookingReference}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <InfoLine icon={ShieldCheck} label="Operator" value={experience.operatorName} />
                  <InfoLine icon={Clock} label="Duration" value={experience.duration} />
                  <InfoLine icon={MapPin} label="Meeting Point" value="Bir Landing Site" />
                  <InfoLine icon={TicketCheck} label="Total Paid" value={experience.totalPaid} />
                </div>
              </div>

              <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-4">
                <div className="grid grid-cols-9 gap-1">
                  {qrBlocks.map((block) => (
                    <span
                      key={block}
                      className={`aspect-square rounded-[3px] ${block % 3 === 0 || block % 7 === 0 || [0, 1, 2, 9, 18, 6, 15, 24, 56, 63, 72, 78, 79, 80].includes(block) ? 'bg-slate-950' : 'bg-white'}`}
                    />
                  ))}
                </div>
                <p className="mt-3 text-center text-xs font-black text-slate-500">Scan at operator desk</p>
              </div>
            </div>
          </article>

          <aside className="rounded-[34px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.1)]">
            <h2 className="text-lg font-black">Ready for takeoff</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {booking ? 'Your live booking request has been saved and is now visible in the traveler dashboard.' : 'We have sent the ticket and operator chat link to your email.'}
            </p>
            <div className="mt-5 space-y-3">
              <Button className="h-12 w-full rounded-2xl bg-[#059669] font-black text-white hover:bg-emerald-700">
                <Download className="mr-2 h-4 w-4" />
                Download Ticket
              </Button>
              <Button variant="outline" className="h-12 w-full rounded-2xl font-black">
                <MessageCircle className="mr-2 h-4 w-4" />
                Chat With Operator
              </Button>
              {booking ? (
                <Link to="/dashboard" className="block">
                  <Button variant="outline" className="h-12 w-full rounded-2xl font-black">
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    View My Bookings
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" className="h-12 w-full rounded-2xl font-black">
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Add To Calendar
                </Button>
              )}
            </div>

            <div className="mt-6 rounded-[24px] bg-emerald-50 p-4">
              <h3 className="text-sm font-black">Next Steps</h3>
              <div className="mt-3 space-y-3 text-xs font-bold leading-5 text-slate-600">
                <p><ShieldCheck className="mr-2 inline h-4 w-4 text-[#059669]" /> {booking ? `Booking request created for ${booking.traveler_name || 'traveler'}.` : 'Confirmation sent to rohit.s@email.com.'}</p>
                <p><ShieldCheck className="mr-2 inline h-4 w-4 text-[#059669]" /> Arrive 25 minutes early for the safety briefing.</p>
                <p><ShieldCheck className="mr-2 inline h-4 w-4 text-[#059669]" /> Weather updates will appear in operator chat.</p>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-6 text-center">
          <Link to="/activities" className="text-sm font-black text-[#059669]">Explore More Adventures</Link>
        </div>
      </section>
    </main>
  );
}

function PassStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/16 p-3 backdrop-blur-md">
      <p className="text-lg font-black">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/70">{label}</p>
    </div>
  );
}

function InfoLine({ icon: Icon, label, value }: { icon: typeof ShieldCheck; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <Icon className="mb-2 h-4 w-4 text-[#059669]" />
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-800">{value}</p>
    </div>
  );
}
