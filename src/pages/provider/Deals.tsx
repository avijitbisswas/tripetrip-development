import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dealModels } from '@/src/features/deals/data';
import { CalendarClock, ImagePlus, PackagePlus, Plus, TrendingUp } from 'lucide-react';

export default function ProviderDeals() {
  return (
    <main className="min-h-screen bg-white px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-[1300px]">
        <div className="rounded-[28px] bg-slate-950 p-6 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight">Provider Flash Sales</h1>
              <p className="mt-2 text-sm font-bold text-white/65">Create offers, set inventory, schedule expiries, and track conversions.</p>
            </div>
            <Button className="rounded-xl bg-[#16A34A] font-black text-white hover:bg-emerald-700"><Plus className="mr-2 h-4 w-4" />Create Offer</Button>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {[
              { label: 'Upload Images', icon: ImagePlus },
              { label: 'Set Inventory', icon: PackagePlus },
              { label: 'Set Expiry', icon: CalendarClock },
              { label: 'Track Conversions', icon: TrendingUp },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-white/10 p-4 font-black">
                <item.icon className="mb-3 h-5 w-5 text-emerald-300" />
                {item.label}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {dealModels.map((deal) => (
            <article key={deal.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black">{deal.title}</h2>
                  <p className="mt-1 text-sm font-bold text-slate-500">{deal.destination}</p>
                </div>
                <Badge className="rounded-lg bg-emerald-50 text-[#16A34A] hover:bg-emerald-50">{deal.active ? 'Active' : 'Paused'}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs font-black">
                <div className="rounded-xl bg-slate-50 p-3">{deal.remainingInventory}<br /><span className="text-slate-500">Left</span></div>
                <div className="rounded-xl bg-slate-50 p-3">{deal.bookingCount}<br /><span className="text-slate-500">Bookings</span></div>
                <div className="rounded-xl bg-slate-50 p-3">{deal.discountPercentage}%<br /><span className="text-slate-500">Savings</span></div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
