import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dealModels } from '@/src/features/deals/data';
import { BarChart3, Pause, Plus, Star, Trash2 } from 'lucide-react';

export default function AdminDeals() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Deal Command Center</h1>
            <p className="mt-2 text-sm font-bold text-slate-500">Create, pause, feature, and analyze Tripetrip flash-sale campaigns.</p>
          </div>
          <Button className="rounded-xl bg-[#16A34A] font-black text-white hover:bg-emerald-700"><Plus className="mr-2 h-4 w-4" />Create Deal</Button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {['CTR 18.4%', 'Conversion Rate 7.9%', 'Revenue ₹18.6L', 'Inventory Sold 72%'].map((metric) => (
            <div key={metric} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <BarChart3 className="h-5 w-5 text-[#16A34A]" />
              <div className="mt-3 text-lg font-black">{metric}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {dealModels.map((deal) => (
            <div key={deal.id} className="grid gap-4 border-b border-slate-100 p-4 last:border-b-0 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-black">{deal.title}</h2>
                  <Badge className="rounded-lg bg-emerald-50 text-[#16A34A] hover:bg-emerald-50">{deal.dealType}</Badge>
                  {deal.featured && <Badge className="rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-50">Featured</Badge>}
                </div>
                <p className="mt-1 text-sm font-bold text-slate-500">{deal.destination} - {deal.remainingInventory} inventory left - {deal.bookingCount} bookings</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="rounded-xl font-black"><Star className="mr-2 h-4 w-4" />Feature Deal</Button>
                <Button variant="outline" className="rounded-xl font-black"><Pause className="mr-2 h-4 w-4" />Pause Deal</Button>
                <Button variant="outline" className="rounded-xl font-black text-rose-600"><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
