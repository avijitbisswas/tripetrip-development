import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LocationAutosuggest } from '@/src/components/maps/LocationAutosuggest';
import {
  activityFilters,
  adventures,
  difficultyFilters,
  durationFilters,
  formatRupees,
  heroImage,
  safetyFilters,
  trustBadges,
} from '@/src/data/tripetripAdventures';
import {
  Calendar,
  ChevronDown,
  Clock,
  Compass,
  Heart,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

export default function Activities() {
  const [location, setLocation] = useState('');

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="mx-auto max-w-[1500px] px-3 pb-10 pt-3 sm:px-4 md:px-8">
        <div className="relative min-h-[360px] overflow-hidden rounded-[34px] bg-slate-900 shadow-[0_30px_100px_rgba(15,23,42,0.18)]">
          <img src={heroImage} alt="Mountain trekking and paragliding adventure" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/72 via-slate-950/24 to-emerald-950/10" />
          <div className="relative flex min-h-[360px] flex-col justify-end p-5 sm:p-8 lg:p-12">
            <Badge className="mb-4 w-fit rounded-full border border-white/25 bg-white/18 px-3 py-1 text-white backdrop-blur-xl hover:bg-white/18">
              <Zap className="mr-1.5 h-3.5 w-3.5 fill-emerald-300 text-emerald-300" />
              Direct adventure marketplace
            </Badge>
            <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">Thrill Zone</h1>
            <p className="mt-3 max-w-2xl text-base font-semibold text-white/90 sm:text-lg">Adventure experiences from verified local operators.</p>

            <div className="mt-8 grid gap-2 rounded-[26px] border border-white/30 bg-white/92 p-2 shadow-[0_24px_70px_rgba(15,23,42,0.22)] backdrop-blur-2xl md:grid-cols-[1.1fr_1fr_.8fr_.9fr_auto]">
              <LocationAutosuggest label="Location" placeholder="Where are you going?" value={location} onChange={setLocation} />
              <SearchField icon={Compass} label="Activity Type" value="All Activities" />
              <SearchField icon={Calendar} label="Date" value="24 May, Sat" />
              <SearchField icon={Users} label="Participants" value="2 Adults" />
              <Button className="h-14 rounded-[18px] bg-[#059669] px-7 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
        </div>

        <div className="mx-auto -mt-6 grid max-w-5xl gap-3 rounded-[24px] border border-slate-200/80 bg-white/86 p-3 shadow-[0_18px_70px_rgba(15,23,42,0.1)] backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4">
          {trustBadges.map((badge) => (
            <div key={badge.label} className="flex items-center justify-center gap-2 rounded-2xl bg-white px-3 py-3 text-xs font-extrabold text-slate-700">
              <badge.icon className="h-4 w-4 text-[#059669]" />
              {badge.label}
            </div>
          ))}
        </div>

        <section className="mt-9 grid gap-7 lg:grid-cols-[270px_1fr]">
          <aside className="h-fit rounded-[26px] border border-slate-200 bg-white/88 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:sticky lg:top-24">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-black">Filters</h2>
              <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs font-black text-[#059669]">Reset</Button>
            </div>
            <FilterGroup title="Activity Type" items={activityFilters} />
            <FilterGroup title="Difficulty" items={difficultyFilters} />
            <FilterGroup title="Duration" items={durationFilters} />
            <div className="border-t border-slate-100 py-5">
              <h3 className="mb-4 text-xs font-black">Price Range</h3>
              <div className="px-1">
                <div className="mb-3 flex justify-between text-[11px] font-bold text-slate-500">
                  <span>Rs. 500</span>
                  <span>Rs. 25,000+</span>
                </div>
                <div className="relative h-2 rounded-full bg-emerald-100">
                  <div className="absolute inset-y-0 left-0 w-[78%] rounded-full bg-[#059669]" />
                  <span className="absolute -top-1 left-0 h-4 w-4 rounded-full border-2 border-white bg-[#059669] shadow" />
                  <span className="absolute -top-1 left-[76%] h-4 w-4 rounded-full border-2 border-white bg-[#059669] shadow" />
                </div>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-5">
              <h3 className="mb-4 text-xs font-black">Safety Rating</h3>
              <div className="space-y-3">
                {safetyFilters.map((item) => (
                  <label key={item} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <input type="checkbox" className="h-3.5 w-3.5 accent-[#059669]" />
                    <span className="text-amber-400">★★★★★</span>
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#059669]">1,248 adventures found</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">Book direct with verified operators</h2>
              </div>
              <Button variant="outline" className="rounded-2xl border-slate-200 font-bold">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Sort by: Most Popular
              </Button>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {adventures.map((adventure) => (
                <AdventureCard key={adventure.id} adventure={adventure} />
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 overflow-hidden rounded-[30px] border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-slate-50 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-[#059669] shadow-sm">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-xl font-black">Book Direct & Save More</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">No middlemen. Best prices. Exclusive operator offers.</p>
              </div>
            </div>
            <div className="text-left md:text-right">
              <p className="text-2xl font-black text-[#059669]">Save up to 45%</p>
              <p className="text-sm font-semibold text-slate-500">compared to other platforms</p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function SearchField({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex h-14 items-center gap-3 rounded-[18px] bg-white px-4">
      <Icon className="h-4 w-4 text-[#059669]" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-black text-slate-500">{label}</p>
        <p className="truncate text-sm font-extrabold text-slate-900">{value}</p>
      </div>
      <ChevronDown className="h-4 w-4 text-slate-400" />
    </div>
  );
}

function FilterGroup({ title, items }: { title: string; items: (string | number)[][] }) {
  return (
    <div className="border-t border-slate-100 py-5 first:border-t-0 first:pt-0">
      <h3 className="mb-4 text-xs font-black">{title}</h3>
      <div className="space-y-3">
        {items.map(([item, count]) => (
          <label key={item} className="flex items-center justify-between gap-2 text-xs font-bold text-slate-600">
            <span className="flex items-center gap-2">
              <input type="checkbox" className="h-3.5 w-3.5 rounded accent-[#059669]" />
              {item}
            </span>
            <span className="text-slate-400">({count})</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function AdventureCard({ adventure }: { adventure: (typeof adventures)[number] }) {
  return (
    <Link
      to={`/listing/${adventure.id}`}
      className="group overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-2 hover:shadow-[0_28px_80px_rgba(15,23,42,0.16)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img src={adventure.image} alt={adventure.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/55 to-transparent" />
        <Badge className="absolute left-3 top-3 rounded-full bg-slate-950/55 text-white backdrop-blur-md hover:bg-slate-950/55">
          <Zap className="mr-1 h-3 w-3 fill-amber-300 text-amber-300" />
          Instant Book
        </Badge>
        <button aria-label={`Save ${adventure.title}`} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/82 text-slate-800 shadow backdrop-blur-md">
          <Heart className="h-4 w-4" />
        </button>
        <span className="absolute bottom-3 left-3 translate-y-3 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-slate-900 opacity-0 shadow-sm backdrop-blur-md transition group-hover:translate-y-0 group-hover:opacity-100">
          Quick Preview
        </span>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-black leading-tight">{adventure.title}</h3>
            <p className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-500">
              <MapPin className="h-3.5 w-3.5 text-[#059669]" />
              {adventure.location}
            </p>
          </div>
          <Badge className="rounded-full bg-emerald-50 text-[10px] font-black text-[#059669] hover:bg-emerald-50">{adventure.difficulty}</Badge>
        </div>
        <p className="text-xs font-bold text-slate-500">By {adventure.operator.name}</p>
        <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-600">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-slate-400" />{adventure.duration}</span>
          <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{adventure.rating} ({adventure.reviewsCount})</span>
        </div>
        <div className="flex items-end justify-between border-t border-slate-100 pt-3">
          <div>
            <p className="text-xs font-bold text-slate-400 line-through">{formatRupees(adventure.originalPrice)}</p>
            <p className="text-lg font-black">{formatRupees(adventure.directPrice)}</p>
          </div>
          <Badge className="rounded-full bg-emerald-50 text-[10px] font-black text-[#059669] hover:bg-emerald-50">Save {formatRupees(adventure.savings)}</Badge>
        </div>
        <div className="rounded-xl bg-emerald-50 px-3 py-2 text-center text-[11px] font-black text-[#047857]">
          Book Direct & Save {Math.round((adventure.savings / adventure.originalPrice) * 100)}%
        </div>
      </div>
    </Link>
  );
}
