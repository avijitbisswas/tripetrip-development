import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Download, Home, MessageCircle, TicketCheck } from 'lucide-react';

export default function StayBookingConfirmation() {
  return (
    <main className="min-h-screen bg-white px-4 py-10 text-slate-950">
      <section className="mx-auto max-w-md">
        <div className="rounded-[32px] bg-gradient-to-b from-emerald-950 to-[#053f28] p-6 text-center text-white shadow-[0_28px_90px_rgba(2,44,34,0.35)]">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#16A34A] text-white shadow-xl shadow-emerald-500/25">
            <Check className="h-10 w-10" />
          </div>
          <h1 className="mt-6 text-2xl font-extrabold tracking-tight">Booking Confirmed!</h1>
          <p className="mt-2 text-sm font-medium text-emerald-50/80">Your stay is booked successfully.</p>

          <div className="mt-6 rounded-2xl bg-emerald-950/35 p-5 shadow-sm">
            <p className="text-xs font-semibold text-emerald-50/70">Booking ID</p>
            <p className="mt-2 text-2xl font-extrabold tracking-tight">TRP78451236</p>
            <p className="mt-4 text-xs font-medium leading-5 text-emerald-50/70">We have sent the confirmation details to rohit.sharma@email.com</p>
          </div>

          <div className="mt-6 space-y-3">
            <Button className="h-12 w-full rounded-xl bg-[#16A34A] font-extrabold text-white hover:bg-emerald-700"><Download className="mr-2 h-4 w-4" /> Download Voucher</Button>
            <Button className="h-12 w-full rounded-xl bg-emerald-700/70 font-extrabold text-white hover:bg-emerald-700"><TicketCheck className="mr-2 h-4 w-4" /> View My Bookings</Button>
            <Button className="h-12 w-full rounded-xl bg-emerald-700/70 font-extrabold text-white hover:bg-emerald-700"><MessageCircle className="mr-2 h-4 w-4" /> Chat With Host</Button>
          </div>

          <Link to="/stays" className="mt-6 block">
            <Button variant="outline" className="h-12 w-full rounded-xl border-white/25 bg-transparent font-extrabold text-white hover:bg-white/10"><Home className="mr-2 h-4 w-4" /> Explore More Stays</Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
