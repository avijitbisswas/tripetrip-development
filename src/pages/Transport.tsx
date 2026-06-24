import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LocationAutosuggest } from '@/src/components/maps/LocationAutosuggest';
import {
  BadgeCheck,
  Calendar,
  Car,
  CheckCircle2,
  ChevronDown,
  Clock,
  Fuel,
  Gauge,
  Heart,
  Luggage,
  MapPin,
  Navigation,
  Phone,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wallet,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const heroImage = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=90&w=1800';

const trustBadges = [
  ['Verified Drivers', BadgeCheck],
  ['Best Direct Prices', Wallet],
  ['Instant Confirmation', Calendar],
  ['Secure Booking', ShieldCheck],
];

const vehicleTypes = [
  ['Hatchback', 120],
  ['Sedan', 230],
  ['SUV', 310],
  ['Luxury', 120],
  ['Tempo Traveller', 80],
  ['Bike', 65],
  ['Camper Van', 40],
  ['Boat', 30],
];

const vehicles = [
  {
    name: 'Toyota Innova Crysta',
    tag: 'SUV',
    image: 'https://images.unsplash.com/photo-1661956600655-e772b2b97db4?auto=format&fit=crop&q=90&w=900',
    meta: '7 Seater - Automatic - Diesel',
    provider: 'Goa Wheels',
    rating: '4.8',
    trips: '320',
    original: 'Rs. 4,600',
    price: 'Rs. 3,499',
    save: 'Save Rs. 1,001',
  },
  {
    name: 'Hyundai Creta',
    tag: 'SEDAN',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=90&w=900',
    meta: '5 Seater - Automatic - Petrol',
    provider: 'GoTravel',
    rating: '4.7',
    trips: '210',
    original: 'Rs. 2,800',
    price: 'Rs. 2,199',
    save: 'Save Rs. 601',
  },
  {
    name: 'Royal Enfield Himalayan',
    tag: 'BIKE',
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=90&w=900',
    meta: '2 Seater - Manual - Petrol',
    provider: 'BikerGoa',
    rating: '4.9',
    trips: '160',
    original: 'Rs. 1,200',
    price: 'Rs. 899',
    save: 'Save Rs. 301',
  },
  {
    name: 'Mercedes E-Class',
    tag: 'LUXURY',
    image: 'https://images.unsplash.com/photo-1606220838315-056192d5e927?auto=format&fit=crop&q=90&w=900',
    meta: '4 Seater - Automatic - Petrol',
    provider: 'Luxury Rides',
    rating: '4.9',
    trips: '150',
    original: 'Rs. 8,000',
    price: 'Rs. 6,499',
    save: 'Save Rs. 1,501',
  },
  {
    name: 'Tempo Traveller 12 Seater',
    tag: 'TEMPO',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=90&w=900',
    meta: '12 Seater - Manual - Diesel',
    provider: 'Safe Travels',
    rating: '4.8',
    trips: '200',
    original: 'Rs. 5,600',
    price: 'Rs. 4,299',
    save: 'Save Rs. 1,201',
  },
  {
    name: 'Tata Nexon EV',
    tag: 'SELF DRIVE',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=90&w=900',
    meta: '5 Seater - Automatic - Electric',
    provider: 'EV Rides',
    rating: '4.7',
    trips: '160',
    original: 'Rs. 3,600',
    price: 'Rs. 2,799',
    save: 'Save Rs. 801',
  },
  {
    name: 'Force Urbania Camper',
    tag: 'CAMPER VAN',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=90&w=900',
    meta: '7 Seater - Automatic - Diesel',
    provider: 'Camper Life',
    rating: '4.9',
    trips: '120',
    original: 'Rs. 7,500',
    price: 'Rs. 5,999',
    save: 'Save Rs. 1,501',
  },
  {
    name: 'Speed Boat Ride',
    tag: 'BOAT',
    image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&q=90&w=900',
    meta: '6 Seater - With Captain',
    provider: 'Ocean Rides',
    rating: '4.8',
    trips: '90',
    original: 'Rs. 6,000',
    price: 'Rs. 4,599',
    save: 'Save Rs. 1,401',
  },
];

const selectedVehicle = vehicles[0];

export default function Transport() {
  const { id } = useParams();

  if (id) {
    return (
      <main className="min-h-screen bg-white text-slate-950">
        <section className="mx-auto max-w-[1500px] px-3 pb-12 pt-3 sm:px-4 md:px-8">
          <DetailScreen />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="mx-auto max-w-[1500px] px-3 pb-12 pt-3 sm:px-4 md:px-8">
        <ListingScreen />
      </section>
    </main>
  );
}

function ListingScreen() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q')?.trim() || '';
  const [pickupLocation, setPickupLocation] = useState(query);
  const [dropLocation, setDropLocation] = useState('');

  useEffect(() => {
    setPickupLocation(query);
  }, [query]);

  return (
    <section data-testid="transport-listing-screen" className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_18px_70px_rgba(15,23,42,0.08)]">
      <div className="relative min-h-[292px] overflow-hidden bg-slate-950">
        <img src={heroImage} alt="Luxury SUV driving through mountains and coastal roads" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/78 via-slate-950/18 to-transparent" />
        <div className="relative flex min-h-[292px] flex-col justify-end px-6 pb-7">
          <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">Ride & Roam</h1>
          <p className="mt-2 text-sm font-extrabold text-white">Travel smarter with trusted transport providers.</p>
          <div className="mt-7 grid gap-2 rounded-[18px] border border-white/25 bg-white/95 p-2 shadow-[0_20px_60px_rgba(15,23,42,0.22)] backdrop-blur-2xl md:grid-cols-[1fr_1fr_.86fr_.74fr_.9fr_auto]">
            <LocationAutosuggest
              label="Pick-up Location"
              placeholder="Goa Airport (GOI)"
              value={pickupLocation}
              onChange={setPickupLocation}
              compact
            />
            <LocationAutosuggest
              label="Drop Location"
              placeholder="Calangute Beach"
              value={dropLocation}
              onChange={setDropLocation}
              compact
            />
            <SearchField icon={Calendar} label="Date" value="24 May, Sat" />
            <SearchField icon={Clock} label="Time" value="10:00 AM" />
            <SearchField icon={Users} label="Passengers" value="2 Adults, 2 Bags" />
            <Button className="h-12 rounded-[14px] bg-[#16A34A] px-5 text-xs font-black text-white hover:bg-emerald-700">
              <Search className="mr-1.5 h-3.5 w-3.5" />
              Search
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto -mt-5 grid max-w-[86%] gap-2 rounded-[18px] border border-slate-200 bg-white/90 p-2 shadow-[0_14px_45px_rgba(15,23,42,0.1)] backdrop-blur-xl md:grid-cols-4">
        {trustBadges.map(([label, Icon]) => (
          <div key={label as string} className="flex items-center justify-center gap-2 rounded-[14px] bg-white px-2 py-3 text-[11px] font-black text-slate-700">
            <Icon className="h-4 w-4 text-[#16A34A]" />
            {label as string}
          </div>
        ))}
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[170px_1fr] xl:grid-cols-[190px_1fr]">
        <FilterPanel />
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-black">1,250 Vehicles Available</h2>
            <Button variant="outline" className="h-10 rounded-[14px] border-slate-200 text-xs font-black">
              Sort by: Most Popular
              <ChevronDown className="ml-2 h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.name} vehicle={vehicle} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FilterPanel() {
  return (
    <aside className="text-xs">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-black">Filters</h2>
        <button className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-[#16A34A]">Reset</button>
      </div>
      <FilterGroup title="Vehicle Type" items={vehicleTypes} />
      <div className="border-t border-slate-100 py-4">
        <h3 className="mb-3 text-[11px] font-black">Price Range (Per Trip)</h3>
        <div className="mb-3 flex justify-between text-[10px] font-bold text-slate-500">
          <span>Rs. 0</span>
          <span>Rs. 20,000+</span>
        </div>
        <div className="relative h-2 rounded-full bg-emerald-100">
          <div className="absolute inset-y-0 left-0 w-[82%] rounded-full bg-[#16A34A]" />
          <span className="absolute -top-1 left-0 h-4 w-4 rounded-full border-2 border-white bg-[#16A34A] shadow" />
          <span className="absolute -top-1 left-[80%] h-4 w-4 rounded-full border-2 border-white bg-[#16A34A] shadow" />
        </div>
      </div>
      <FilterGroup title="Transmission" items={[['Automatic', 420], ['Manual', 180]]} />
      <FilterGroup title="Features" items={[['Air Conditioning', ''], ['GPS Navigation', ''], ['Driver Included', ''], ['Self Drive', ''], ['Child Seat', '']]} />
      <Button variant="outline" className="mt-2 h-9 w-full rounded-[12px] border-[#16A34A] text-xs font-black text-[#16A34A]">More Filters</Button>
    </aside>
  );
}

function VehicleCard({ vehicle }: { vehicle: (typeof vehicles)[number] }) {
  const href = `/transport/${vehicle.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;

  return (
    <Link to={href} className="group block overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.09)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_18px_55px_rgba(15,23,42,0.16)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img src={vehicle.image} alt={vehicle.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
        <Badge className="absolute left-2 top-2 h-5 rounded-md bg-[#16A34A] px-2 text-[9px] font-black text-white hover:bg-[#16A34A]">{vehicle.tag}</Badge>
        <button aria-label={`Save ${vehicle.name}`} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/85 text-slate-800 shadow backdrop-blur">
          <Heart className="h-4 w-4" />
        </button>
        <span className="absolute bottom-2 left-2 translate-y-2 rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-black opacity-0 shadow backdrop-blur transition group-hover:translate-y-0 group-hover:opacity-100">Quick View</span>
      </div>
      <div className="space-y-2.5 p-3">
        <h3 className="text-[13px] font-black leading-tight">{vehicle.name}</h3>
        <p className="text-[10px] font-bold text-slate-500">{vehicle.meta}</p>
        <p className="text-[10px] font-bold text-slate-500">By {vehicle.provider}</p>
        <p className="flex items-center gap-1 text-[10px] font-black"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{vehicle.rating} ({vehicle.trips})</p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 line-through">{vehicle.original}</p>
            <p className="text-base font-black">{vehicle.price}</p>
          </div>
          <Badge className="rounded-md bg-emerald-50 px-2 text-[9px] font-black text-[#16A34A] hover:bg-emerald-50">{vehicle.save}</Badge>
        </div>
        <div className="rounded-lg bg-emerald-50 py-1.5 text-center text-[10px] font-black text-[#047857]">Book Direct & Save 22%</div>
      </div>
    </Link>
  );
}

function DetailScreen() {
  return (
    <section data-testid="transport-detail-screen" className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_24px_90px_rgba(15,23,42,0.1)]">
      <div className="grid gap-5 p-4 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[11px] font-bold text-slate-500">
            <span>Transport</span><span>/</span><span>Goa Airport</span><span>/</span><span>Calangute Beach</span><span>/</span><span className="text-slate-900">Toyota Innova Crysta</span>
          </div>
          <div className="relative aspect-[16/9] overflow-hidden rounded-[16px] bg-slate-100">
            <img src={selectedVehicle.image} alt="Toyota Innova Crysta large gallery" className="h-full w-full object-cover" />
            <Badge className="absolute right-4 top-4 rounded-full bg-slate-950/70 text-white backdrop-blur-md hover:bg-slate-950/70">360-degree preview</Badge>
          </div>
          <div className="mt-2 grid grid-cols-6 gap-2">
            {vehicles.slice(0, 6).map((vehicle) => (
              <img key={vehicle.name} src={vehicle.image} alt={`${vehicle.name} thumbnail`} className="aspect-[4/3] rounded-[10px] object-cover" />
            ))}
          </div>
          <VehicleOverview />
        </div>
        <BookingCard />
      </div>
    </section>
  );
}

function VehicleOverview() {
  const info = [
    ['7 Seats', Users],
    ['2 Bags', Luggage],
    ['Automatic', Gauge],
    ['Diesel', Fuel],
    ['AC', Sparkles],
    ['GPS', Navigation],
    ['Driver', Car],
  ];

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-2xl font-black">Vehicle Overview</h2>
        <h3 className="text-2xl font-black">Toyota Innova Crysta</h3>
        <Badge className="rounded-full bg-emerald-50 text-[#16A34A] hover:bg-emerald-50">Verified Vehicle</Badge>
      </div>
      <p className="mt-2 text-xs font-bold text-slate-500">7 Seater - Automatic - Diesel</p>
      <p className="mt-2 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600">
        <span><Star className="mr-1 inline h-3.5 w-3.5 fill-amber-400 text-amber-400" />4.8 (320 reviews)</span>
        <span>1,240 Trips</span>
        <span>By Goa Wheels</span>
      </p>
      <div className="mt-4 grid grid-cols-4 gap-2 lg:grid-cols-7">
        {info.map(([label, Icon]) => (
          <div key={label as string} className="rounded-[12px] border border-slate-200 bg-slate-50 p-3 text-center text-[10px] font-black">
            <Icon className="mx-auto mb-1 h-4 w-4 text-[#16A34A]" />
            {label as string}
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 md:grid-cols-2">
        <div>
          <h4 className="text-sm font-black">About The Vehicle</h4>
          <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-500">Travel in comfort with Toyota Innova Crysta. Spacious 7 seater, premium AC, perfect for families and groups.</p>
        </div>
        <div>
          <h4 className="text-sm font-black">Why Choose This Vehicle</h4>
          {['Spacious & Comfortable', 'Well Maintained', 'Experienced Drivers', 'Clean & Sanitized', 'On-time Pickup'].map((item) => (
            <p key={item} className="mt-1 flex items-center gap-2 text-xs font-bold text-slate-600"><CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />{item}</p>
          ))}
        </div>
      </div>
      <ReviewsAndSimilar />
    </div>
  );
}

function BookingCard() {
  return (
    <aside className="space-y-3">
      <div className="rounded-[16px] border border-slate-200 bg-white p-4 shadow-[0_12px_45px_rgba(15,23,42,0.08)]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-500">Price (One Way)</p>
            <p className="mt-1 text-2xl font-black">{selectedVehicle.price}</p>
            <p className="text-xs font-bold text-slate-400 line-through">{selectedVehicle.original}</p>
          </div>
          <Badge className="rounded-md bg-emerald-50 text-[10px] font-black text-[#16A34A] hover:bg-emerald-50">{selectedVehicle.save}</Badge>
        </div>
        {['Select Date', 'Pick-up Time', 'Passengers'].map((label) => (
          <div key={label} className="mt-3 rounded-[12px] border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-black text-slate-500">{label}</p>
            <p className="mt-1 text-xs font-black">{label === 'Select Date' ? '24 May, 2024' : label === 'Pick-up Time' ? '10:00 AM' : '2 Adults, 2 Bags'}</p>
          </div>
        ))}
        <Button className="mt-4 h-11 w-full rounded-[12px] bg-[#16A34A] text-xs font-black text-white hover:bg-emerald-700">Book Now</Button>
        <Button variant="outline" className="mt-2 h-10 w-full rounded-[12px] text-xs font-black"><Phone className="mr-2 h-3.5 w-3.5" />Contact Provider</Button>
        <div className="mt-4 space-y-2 text-[11px] font-bold text-slate-600">
          {['Instant Confirmation', 'Free Cancellation (Up to 24h)', 'Secure Booking', 'Best Price Guaranteed'].map((item) => (
            <p key={item} className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />{item}</p>
          ))}
        </div>
      </div>
      <div className="rounded-[16px] border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-black">Provider</h3>
        <div className="mt-3 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-[#16A34A] text-white"><Car className="h-5 w-5" /></div>
          <div>
            <p className="text-sm font-black">Goa Wheels</p>
            <p className="text-[11px] font-bold text-[#16A34A]">Verified Provider</p>
          </div>
        </div>
        <p className="mt-3 text-[11px] font-bold text-slate-600">5+ Years in Business</p>
        <p className="mt-1 text-[11px] font-bold text-slate-600">2,500+ Trips Completed</p>
        <p className="mt-1 text-[11px] font-bold text-slate-600">Response Time: 10 mins</p>
        <Button variant="outline" className="mt-3 h-10 w-full rounded-[12px] text-xs font-black">View Provider Profile</Button>
      </div>
    </aside>
  );
}

function ReviewsAndSimilar() {
  return (
    <>
      <div className="mt-5 rounded-[16px] border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-black">Customer Reviews</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-[160px_1fr_1fr]">
          <div>
            <p className="text-3xl font-black">4.8</p>
            <p className="text-xs font-bold text-amber-400">★★★★★</p>
            <p className="mt-1 text-[11px] font-bold text-slate-500">Based on 320 reviews</p>
          </div>
          {['Rohit Sharma', 'Priya Mehta'].map((name) => (
            <div key={name} className="rounded-[14px] border border-slate-200 p-3">
              <p className="text-xs font-black">{name}</p>
              <p className="mt-2 text-[11px] font-semibold text-slate-500">Great experience. Driver was on time and very polite. Car was clean.</p>
              <p className="mt-2 text-xs text-amber-400">★★★★★</p>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-black">Similar Vehicles</h3>
          <button className="text-[11px] font-black text-[#16A34A]">View all</button>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {vehicles.slice(1, 6).map((vehicle) => (
            <div key={vehicle.name} className="overflow-hidden rounded-[12px] border border-slate-200 bg-white">
              <img src={vehicle.image} alt={vehicle.name} className="aspect-[16/9] w-full object-cover" />
              <p className="p-2 text-[10px] font-black">{vehicle.name}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function SearchField({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex h-12 items-center gap-2 rounded-[13px] bg-white px-3">
      <Icon className="h-3.5 w-3.5 text-[#16A34A]" />
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-black text-slate-500">{label}</p>
        <p className="truncate text-[11px] font-black text-slate-900">{value}</p>
      </div>
      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
    </div>
  );
}

function FilterGroup({ title, items }: { title: string; items: (string | number)[][] }) {
  return (
    <div className="border-t border-slate-100 py-4 first:border-t-0 first:pt-0">
      <h3 className="mb-3 text-[11px] font-black">{title}</h3>
      <div className="space-y-2.5">
        {items.map(([item, count]) => (
          <label key={item} className="flex items-center justify-between gap-2 text-[11px] font-bold text-slate-600">
            <span className="flex items-center gap-2">
              <input type="checkbox" className="h-3 w-3 accent-[#16A34A]" />
              {item}
            </span>
            {count !== '' && <span className="text-slate-400">({count})</span>}
          </label>
        ))}
      </div>
    </div>
  );
}
