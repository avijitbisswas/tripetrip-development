import { Link, useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { formatRupees, packages, trustBadges } from '@/src/data/tripetripPackages';
import { Calendar, ChevronDown, Filter, Heart, Search as SearchIcon, SlidersHorizontal, Star } from 'lucide-react';
import { useMemo } from 'react';

const heroImage = 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&q=90&w=2400';
const filterGroups = [
  { title: 'Destination', options: ['Goa', 'Kashmir', 'Kerala', 'Bali'] },
  { title: 'Budget (Per Person)', options: ['₹0 - ₹10,000', '₹10,000 - ₹25,000', '₹25,000 - ₹50,000', '₹50,000+'] },
  { title: 'Duration', options: ['Weekend (1-2 Days)', '3 - 5 Days', '5 - 7 Days', '7+ Days'] },
  { title: 'Trip Type', options: ['Honeymoon', 'Family', 'Group', 'Adventure', 'Luxury', 'Solo'] },
];

function SearchField({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Calendar }) {
  return (
    <div className="min-w-0 flex-1 border-b border-slate-100 px-4 py-3 md:border-b-0 md:border-r">
      <label className="text-[11px] font-bold text-slate-900">{label}</label>
      <div className="mt-1 flex items-center justify-between gap-3 text-xs font-medium text-slate-500">
        <span className="truncate">{value}</span>
        {Icon ? <Icon className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </div>
    </div>
  );
}

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q')?.trim() || '';
  const visiblePackages = useMemo(() => {
    const term = query.toLowerCase();
    if (!term) return packages;

    return packages.filter((pkg) =>
      [
        pkg.title,
        pkg.location,
        pkg.region,
        pkg.duration,
        pkg.provider,
        pkg.tripType,
        pkg.overview,
        ...pkg.highlights,
        ...pkg.included,
      ]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [query]);

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative min-h-[380px] overflow-visible md:min-h-[430px]">
        <img src={heroImage} alt="Curated mountain and lake escape" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-900/35 to-emerald-900/20" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
        <div className="relative mx-auto max-w-[1500px] px-4 pb-16 pt-8 md:px-8">
          <div className="text-xs font-medium text-white/70">Home / Packages</div>
          <div className="mt-9 max-w-3xl text-white">
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">Explore Curated Escapes</h1>
            <p className="mt-3 text-base font-medium text-white/90 md:text-lg">Discover handpicked experiences from verified travel partners.</p>
          </div>
          <div className="absolute bottom-[-120px] left-4 right-4 md:left-8 md:right-8">
            <div className="mx-auto max-w-[1180px] rounded-[22px] border border-white/50 bg-white/90 p-2 shadow-2xl shadow-slate-900/18 backdrop-blur-xl">
              <div className="flex flex-col md:flex-row md:items-center">
                <SearchField label="Destination" value={query || 'Where are you going?'} />
                <SearchField label="Date" value="Anytime" icon={Calendar} />
                <SearchField label="Budget" value="Any Budget" />
                <SearchField label="Duration" value="Any Duration" />
                <div className="p-2 md:w-[150px]">
                  <Button className="h-12 w-full rounded-2xl bg-[#16A34A] text-sm font-bold text-white hover:bg-emerald-700">
                    <SearchIcon className="mr-2 h-4 w-4" />
                    Search
                  </Button>
                </div>
              </div>
            </div>
            <div className="mx-auto mt-4 grid max-w-[950px] grid-cols-2 gap-2 rounded-2xl border border-white/70 bg-white/90 p-3 shadow-xl shadow-slate-900/10 backdrop-blur-xl md:grid-cols-4">
              {trustBadges.map((item) => (
                <div key={item.label} className="flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-700">
                  <item.icon className="h-4 w-4 text-[#16A34A]" />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1500px] gap-6 px-4 pb-8 pt-24 md:px-8 lg:grid-cols-[300px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-bold">Package Filters</h2>
              <Button variant="outline" size="sm" className="h-7 rounded-lg px-2 text-[10px] text-slate-400">Reset</Button>
            </div>
            <div className="space-y-5">
              {filterGroups.map((group) => (
                <div key={group.title} className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900">{group.title}</h3>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </div>
                  {group.title === 'Destination' && (
                    <div className="relative mb-2">
                      <SearchIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <Input className="h-9 rounded-xl border-slate-200 pl-8 text-xs" placeholder="Search destination" />
                    </div>
                  )}
                  <div className="space-y-2">
                    {group.options.map((option, index) => (
                      <label key={option} className="flex cursor-pointer items-center justify-between text-[12px] font-medium text-slate-600">
                        <span className="flex items-center gap-2">
                          <Checkbox className="h-4 w-4 rounded border-slate-300 data-[state=checked]:bg-[#16A34A]" />
                          {option}
                        </span>
                        <span className="text-[10px] text-slate-400">({120 - index * 14})</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
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
              <p className="text-sm font-bold">{visiblePackages.length} {visiblePackages.length === 1 ? 'Package' : 'Packages'} Found</p>
            </div>
            <Button variant="outline" className="rounded-xl text-xs font-semibold text-slate-600">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Sort by: Most Popular
            </Button>
          </div>

          {visiblePackages.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {visiblePackages.map((pkg) => (
              <Link key={pkg.id} to={`/listing/${pkg.id}`} className="group overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(15,23,42,0.16)]">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={pkg.heroImage} alt={pkg.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                  <button aria-label={`Save ${pkg.title}`} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-slate-700 backdrop-blur-md transition group-hover:text-[#16A34A]">
                    <Heart className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2 p-4">
                  <h3 className="line-clamp-1 text-sm font-bold text-slate-950">{pkg.title}</h3>
                  <p className="text-[11px] font-semibold text-slate-500">{pkg.duration} - {pkg.location}</p>
                  <p className="text-[11px] font-medium text-slate-500">By {pkg.provider}</p>
                  <div className="flex items-center gap-1 text-[12px] font-semibold"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{pkg.rating} <span className="font-medium text-slate-400">({pkg.reviews})</span></div>
                  <div className="text-[11px] font-semibold text-slate-400 line-through">{formatRupees(pkg.originalPrice)}</div>
                  <div className="text-lg font-bold tracking-tight text-slate-950">{formatRupees(pkg.directPrice)} <span className="text-[10px] font-semibold text-slate-500">/person</span></div>
                  <div className="flex items-center justify-between gap-2">
                    <Badge className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-[#16A34A] hover:bg-emerald-50">Save {formatRupees(pkg.savings)}</Badge>
                    <span className="text-[10px] font-bold text-[#16A34A]">Book Direct & Save</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          ) : (
            <div className="rounded-[20px] border border-slate-200 bg-white p-8 text-center shadow-[0_16px_45px_rgba(15,23,42,0.08)]">
              <h3 className="text-lg font-bold text-slate-950">No packages found</h3>
              <p className="mt-2 text-sm font-semibold text-slate-500">Try another destination or package type.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
