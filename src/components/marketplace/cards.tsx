import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, Heart, MapPin, ShieldCheck, Star, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const rupee = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function PriceBlock({ original, direct, suffix }: { original?: number; direct: number; suffix?: string }) {
  return (
    <div className="text-right">
      {original && <div className="text-[11px] font-bold text-slate-400 line-through">{rupee.format(original)}</div>}
      <div className="text-xl font-black tracking-tight text-emerald-600">
        {rupee.format(direct)}
        {suffix && <span className="ml-1 text-[10px] font-bold text-slate-400">{suffix}</span>}
      </div>
    </div>
  );
}

function Rating({ value }: { value: string }) {
  return (
    <div className="flex items-center gap-1 text-xs font-bold text-slate-600">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      {value}
    </div>
  );
}

interface PackageCardProps {
  image: string;
  destination: string;
  duration: string;
  rating: string;
  provider: string;
  originalPrice: number;
  directPrice: number;
  savings: string;
}

export function PackageCard(props: PackageCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white/85 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img loading="lazy" src={props.image} alt={`${props.destination} package`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
        <Badge className="absolute right-3 top-3 border-none bg-emerald-100 text-[10px] font-black text-emerald-700">{props.savings}</Badge>
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-950">{props.destination}</h3>
            <p className="text-[11px] font-semibold text-slate-400">{props.provider}</p>
          </div>
          <span className="text-xs font-bold text-slate-500">{props.duration}</span>
        </div>
        <div className="mb-4 flex items-center justify-between">
          <Rating value={props.rating} />
          <span className="text-[11px] font-bold text-emerald-600">Book Direct & Save</span>
        </div>
        <div className="flex items-end justify-between gap-4">
          <Link to="/packages">
            <Button size="sm" className="rounded-xl bg-slate-950 text-xs font-bold text-white hover:bg-slate-800">Book Now</Button>
          </Link>
          <PriceBlock original={props.originalPrice} direct={props.directPrice} />
        </div>
      </div>
    </article>
  );
}

interface PropertyCardProps {
  image: string;
  type: string;
  location: string;
  amenities: string[];
  rating: string;
  originalPrice: number;
  directPrice: number;
  availability: string;
}

export function PropertyCard(props: PropertyCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white/85 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img loading="lazy" src={props.image} alt={`${props.type} in ${props.location}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
        <Badge className="absolute left-3 top-3 bg-white/90 text-[10px] font-black text-emerald-700">{props.type}</Badge>
        <button type="button" aria-label="Save property" className="absolute right-3 top-3 rounded-full bg-white/80 p-2 text-slate-600 backdrop-blur hover:text-red-500">
          <Heart className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h3 className="font-bold text-slate-950">{props.location}</h3>
            <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
              <MapPin className="h-3 w-3" />
              Verified host
            </p>
          </div>
          <Rating value={props.rating} />
        </div>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {props.amenities.map((amenity) => (
            <span key={amenity} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">{amenity}</span>
          ))}
        </div>
        <div className="flex items-end justify-between gap-4">
          <Badge className="bg-emerald-50 text-[10px] font-black text-emerald-700">{props.availability}</Badge>
          <Link to="/stays">
            <PriceBlock original={props.originalPrice} direct={props.directPrice} suffix="/ night" />
          </Link>
        </div>
      </div>
    </article>
  );
}

interface ActivityCardProps {
  image: string;
  name: string;
  location: string;
  difficulty: string;
  duration: string;
  safetyBadge: string;
  directPrice: number;
  rating: string;
}

export function ActivityCard(props: ActivityCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white/85 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img loading="lazy" src={props.image} alt={props.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
        <Badge className="absolute left-3 top-3 bg-emerald-600 text-[10px] font-black text-white">{props.safetyBadge}</Badge>
      </div>
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-950">{props.name}</h3>
            <p className="text-[11px] font-semibold text-slate-500">{props.location}</p>
          </div>
          <Rating value={props.rating} />
        </div>
        <div className="mb-4 flex gap-3 text-[11px] font-bold text-slate-500">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{props.duration}</span>
          <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" />{props.difficulty}</span>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-[11px] font-black text-emerald-600">Book Direct & Save</span>
          <PriceBlock direct={props.directPrice} />
        </div>
      </div>
    </article>
  );
}

interface TransportCardProps {
  image: string;
  serviceType: string;
  pickup: string;
  rating: string;
  capacity: string;
  directPrice: number;
}

export function TransportCard(props: TransportCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white/85 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img loading="lazy" src={props.image} alt={props.serviceType} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
        <button type="button" aria-label="Save transport" className="absolute right-3 top-3 rounded-full bg-white/80 p-2 text-slate-600 backdrop-blur hover:text-red-500">
          <Heart className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="font-bold text-slate-950">{props.serviceType}</h3>
            <p className="text-[11px] font-semibold text-slate-500">{props.pickup}</p>
          </div>
          <Rating value={props.rating} />
        </div>
        <div className="mb-4 flex items-center gap-2 text-[11px] font-bold text-slate-500">
          <Users className="h-3.5 w-3.5 text-emerald-600" />
          {props.capacity}
        </div>
        <div className="flex items-end justify-between">
          <span className="text-[11px] font-black text-emerald-600">Direct fare</span>
          <PriceBlock direct={props.directPrice} suffix="/ day" />
        </div>
      </div>
    </article>
  );
}

interface DealCardProps {
  image: string;
  title: string;
  discount: string;
  category: string;
  hours: string;
}

export function DealCard(props: DealCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/20 bg-slate-900 p-5 text-white shadow-lg transition hover:-translate-y-1 hover:shadow-2xl">
      <img loading="lazy" src={props.image} alt={props.title} className="absolute inset-0 h-full w-full object-cover opacity-55 transition duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
      <div className="relative flex min-h-56 flex-col justify-between">
        <div>
          <h3 className="text-lg font-black">{props.title}</h3>
          <p className="mt-2 text-xl font-black text-emerald-200">{props.discount}</p>
          <p className="text-xs font-bold text-white/80">{props.category}</p>
        </div>
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-xl bg-black/35 px-3 py-2 font-mono text-sm font-bold backdrop-blur">
            <CalendarDays className="h-4 w-4 text-emerald-300" />
            {props.hours}
          </div>
          <Link to="/search">
            <Button size="sm" className="rounded-xl bg-emerald-300 font-bold text-emerald-950 hover:bg-emerald-200">Book Now</Button>
          </Link>
        </div>
      </div>
    </article>
  );
}
