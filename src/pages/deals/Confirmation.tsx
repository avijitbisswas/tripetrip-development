import { Button } from '@/components/ui/button';
import { CalendarDays, Check, Download, ScanBarcode, Share2, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const barcodeBlocks = Array.from({ length: 84 }, (_, index) => index);

export default function DealsConfirmation() {
  return (
    <main className="min-h-screen bg-white px-4 py-10 text-slate-950">
      <section className="mx-auto max-w-3xl overflow-hidden rounded-[28px] bg-[#16A34A] p-6 text-white shadow-2xl shadow-emerald-500/25">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white text-[#16A34A]">
          <Check className="h-12 w-12" />
        </div>
        <div className="mt-5 text-center">
          <h1 className="text-4xl font-black">Deal Locked!</h1>
          <p className="mt-2 text-sm font-bold text-white/85">Complete manual barcode payment. Admin will approve your booking after verification.</p>
        </div>

        <div className="mx-auto mt-6 max-w-xl rounded-2xl bg-white p-5 text-slate-950">
          <div className="text-center text-xs font-black uppercase tracking-wider text-slate-500">Booking ID</div>
          <div className="mt-1 text-center text-2xl font-black text-[#16A34A]">TRIP67845291</div>
          <div className="mt-5 flex gap-4 rounded-2xl bg-slate-50 p-3">
            <img src="https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&q=90&w=300" alt="Goa Beach Escape" className="h-20 w-24 rounded-xl object-cover" />
            <div className="text-sm font-bold">
              <div className="font-black">Goa Beach Escape</div>
              <div className="mt-1 text-slate-500">24 May - 27 May</div>
              <div className="text-slate-500">2 Adults</div>
              <div className="mt-1 text-lg font-black">₹9,999</div>
            </div>
          </div>
          <div className="mt-4 grid gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 md:grid-cols-[180px_1fr]">
            <div className="rounded-2xl bg-white p-3">
              <div className="grid grid-cols-12 gap-1" aria-label="Manual payment barcode">
                {barcodeBlocks.map((block) => (
                  <span
                    key={block}
                    className={`h-5 rounded-sm ${block % 2 === 0 || block % 7 === 0 || [3, 9, 11, 28, 35, 51, 69, 75].includes(block) ? 'bg-slate-950' : 'bg-emerald-100'}`}
                  />
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-black text-emerald-700">
                <ScanBarcode className="h-4 w-4" />
                Manual Barcode Payment
              </div>
              <div className="mt-2 text-xl font-black text-slate-950">Awaiting Admin Approval</div>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Scan this barcode, pay ₹9,999, and use reference TRIP67845291-9999. Your voucher unlocks after Tripetrip admin verifies the payment.
              </p>
              <p className="mt-3 text-xs font-black uppercase tracking-widest text-emerald-700">
                <ShieldCheck className="mr-1 inline h-4 w-4" />
                Manual verification enabled
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <Button variant="outline" className="rounded-xl font-black"><Download className="mr-2 h-4 w-4" />Download Voucher</Button>
            <Button variant="outline" className="rounded-xl font-black"><CalendarDays className="mr-2 h-4 w-4" />Add To Calendar</Button>
            <Button variant="outline" className="rounded-xl font-black"><Share2 className="mr-2 h-4 w-4" />Share Trip</Button>
          </div>
          <Link to="/dashboard" className="mt-4 flex h-12 items-center justify-center rounded-xl bg-[#16A34A] text-sm font-black text-white">
            View My Bookings
          </Link>
        </div>
      </section>
    </main>
  );
}
