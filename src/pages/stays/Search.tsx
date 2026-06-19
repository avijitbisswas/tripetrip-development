import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { LocationAutosuggest } from '@/src/components/maps/LocationAutosuggest';
import { formatRupees, packages, trustBadges } from '@/src/data/tripetripStays';
import { useState } from 'react';
import { Calendar, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Filter, Heart, MapPin, Search as SearchIcon, SlidersHorizontal, Star } from 'lucide-react';

const heroImage = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=90&w=2400';

const filterGroups = [
  { title: 'Property Type', options: ['Villas', 'Resorts', 'Homestays', 'Hostels', 'Apartments', 'Heritage Stays', 'Camps'] },
  { title: 'Guest Rating', options: ['5 Stars', '4 Stars+', '3 Stars+'] },
  { title: 'Amenities', options: ['Free WiFi', 'Swimming Pool', 'Breakfast Included', 'Air Conditioning', 'Parking', 'Pet Friendly', 'Kitchen', 'Gym'] },
  { title: 'Cancellation Policy', options: ['Free Cancellation', 'Partial Refund', 'Non-refundable'] },
];

function SearchField({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Calendar }) {
  return (
    <div className="min-w-0 flex-1 border-b border-slate-100 px-4 py-3 md:border-b-0 md:border-r">
      <label className="text-[11px] font-bold text-slate-900">{label}</label>
      <div className="mt-1 flex items-center justify-between gap-3 text-xs font-semibold text-slate-500">
        <span className="truncate">{value}</span>
        {Icon ? <Icon className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </div>
    </div>
  );
}

export default function Search() {
  const [destination, setDestination] = useState('');

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative min-h-[300px] overflow-visible md:min-h-[390px]">
        <img src={heroImage} alt="Luxury villa beside a private pool" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/78 via-slate-900/45 to-emerald-950/20" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />

        <div className="relative mx-auto max-w-[1500px] px-4 pb-16 pt-12 md:px-8">
          <div className="mt-5 max-w-3xl text-white">
            <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">Stay Beyond Hotels</h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold text-white/90 md:text-lg">Discover villas, resorts, homestays and unique stays from verified hosts.</p>
          </div>

          <div className="absolute bottom-[-96px] left-4 right-4 md:left-8 md:right-8">
            <div className="mx-auto max-w-[1250px] rounded-[24px] border border-white/60 bg-white/92 p-2 shadow-[0_26px_80px_rgba(15,23,42,0.18)] backdrop-blur-2xl">
              <div className="flex flex-col md:flex-row md:items-center">
                <LocationAutosuggest label="Where are you going?" placeholder="Search destination" value={destination} onChange={setDestination} />
                <SearchField label="Check-in" value="24 May, Sat" icon={Calendar} />
                <SearchField label="Check-out" value="26 May, Mon" icon={Calendar} />
                <SearchField label="Guests" value="2 Adults, 0 Child" />
                <div className="p-2 md:w-[150px]">
                  <Button className="h-12 w-full rounded-2xl bg-[#16A34A] text-sm font-bold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-700">
                    <SearchIcon className="mr-2 h-4 w-4" />
                    Search
                  </Button>
                </div>
              </div>
            </div>

            <div className="mx-auto mt-4 grid max-w-[1050px] grid-cols-2 gap-2 rounded-2xl border border-white/70 bg-white/90 p-3 shadow-xl shadow-slate-900/10 backdrop-blur-xl md:grid-cols-4">
              {trustBadges.map((item) => (
                <div key={item.label} className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-700">
                  <item.icon className="h-4 w-4 text-[#16A34A]" />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1500px] gap-6 px-4 pb-10 pt-28 md:px-8 lg:grid-cols-[300px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-[22px] border border-slate-200 bg-white/95 p-5 shadow-[0_16px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-extrabold">Filters</h2>
              <Button variant="outline" size="sm" className="h-7 rounded-lg px-2 text-[10px] font-bold text-[#16A34A]">Reset</Button>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">Search by Property Name</h3>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input className="h-10 rounded-xl border-slate-200 pl-8 text-xs" placeholder="e.g. Luxurious Villa" />
              </div>
            </div>

            <div className="mt-5 space-y-5">
              {filterGroups.map((group) => (
                <div key={group.title} className="border-t border-slate-100 pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900">{group.title}</h3>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="space-y-2">
                    {group.options.map((option, index) => (
                      <label key={option} className="flex cursor-pointer items-center justify-between text-[12px] font-medium text-slate-600">
                        <span className="flex items-center gap-2">
                          <Checkbox className="h-4 w-4 rounded border-slate-300 data-[state=checked]:bg-[#16A34A]" />
                          {group.title === 'Guest Rating' ? (
                            <span className="flex items-center gap-0.5">
                              {[...Array(index === 0 ? 5 : index === 1 ? 4 : 3)].map((_, i) => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
                              <span className="ml-1">{option.replace(/\d Stars?\+?/, '& above')}</span>
                            </span>
                          ) : option}
                        </span>
                        <span className="text-[10px] text-slate-400">({index === 0 ? 720 : 120 + index * 110})</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div className="border-t border-slate-100 pt-4">
                <h3 className="mb-3 text-xs font-bold text-slate-900">Price Per Night</h3>
                <div className="h-1.5 rounded-full bg-slate-100">
                  <div className="h-1.5 w-4/5 rounded-full bg-[#16A34A]" />
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>₹0</span>
                  <span>₹10,000+</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="outline" className="rounded-xl lg:hidden">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
              <p className="text-sm font-extrabold"><span>1,410</span> Stays Found</p>
            </div>
            <Button variant="outline" className="rounded-xl text-xs font-semibold text-slate-600">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Sort by: Most Popular
            </Button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {packages.map((property) => (
              <Link
                key={property.id}
                to={`/stays/${property.id}`}
                className="group overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(15,23,42,0.16)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={property.heroImage} alt={property.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                  <div className="absolute left-3 top-3 rounded-lg bg-white/85 px-2 py-1 text-[9px] font-extrabold uppercase text-[#16A34A] backdrop-blur-md">{property.propertyType}</div>
                  <button aria-label={`Save ${property.title}`} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-slate-700 backdrop-blur-md transition group-hover:text-[#16A34A]">
                    <Heart className="h-4 w-4" />
                  </button>
                  <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <Button className="h-9 w-full rounded-xl bg-white text-xs font-bold text-slate-900 hover:bg-white">
                      Quick View
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 p-4">
                  <div>
                    <h3 className="line-clamp-1 text-sm font-extrabold text-slate-950">{property.title}</h3>
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-500"><MapPin className="h-3 w-3" /> {property.location}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[12px] font-bold">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {property.rating} <span className="font-medium text-slate-400">({property.reviews})</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-[#16A34A]">
                    <CheckCircle2 className="h-3 w-3" />
                    Save {formatRupees(property.savings)}
                  </div>
                  <div className="pt-1">
                    <div className="text-[11px] font-semibold text-slate-400 line-through">{formatRupees(property.originalPrice)}</div>
                    <div className="text-lg font-extrabold tracking-tight text-slate-950">{formatRupees(property.directPrice)} <span className="text-[10px] font-semibold text-slate-500">/night</span></div>
                  </div>
                  <span className="text-[10px] font-extrabold text-[#16A34A]">Book Direct & Save 23%</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 flex items-center justify-center gap-2">
            <button className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100"><ChevronLeft className="h-4 w-4" /></button>
            {[1, 2, 3, 4].map((page) => (
              <button key={page} className={`h-10 w-10 rounded-xl text-sm font-semibold ${page === 1 ? 'border border-[#16A34A] bg-emerald-50 text-[#16A34A]' : 'text-slate-500 hover:bg-slate-100'}`}>{page}</button>
            ))}
            <span className="px-2 text-slate-400">...</span>
            <button className="h-10 w-10 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100">36</button>
            <button className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </section>
    </main>
  );
}
