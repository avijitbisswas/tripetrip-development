import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Listing } from '@/src/types/domain';
import { getListingById } from '@/src/services/listings';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Star, 
  MapPin, 
  Users, 
  ArrowLeft, 
  ShieldCheck, 
  Calendar, 
  CheckCircle2, 
  Info,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ListingDetail() {
  const { id } = useParams();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    if (!id) return;
    try {
      const listingData = await getListingById(id);
      setListing(listingData);
    } catch (error) {
      console.error("Error fetching listing:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = () => {
    toast.success('Wait, the demo is still being built! Checking escrow logic...', {
      description: 'The direct booking system is in preview mode.'
    });
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto p-12 animate-pulse">
      <div className="h-96 bg-white/5 rounded-[40px] mb-8" />
      <div className="h-12 w-64 bg-white/5 rounded-xl mb-4" />
      <div className="h-6 w-32 bg-white/5 rounded-xl" />
    </div>
  );

  if (!listing) return (
    <div className="py-32 text-center">
      <h2 className="text-4xl font-light tracking-tighter uppercase mb-4">Listing not found</h2>
      <Link to="/search">
        <Button variant="link" className="text-white underline">Back to Search</Button>
      </Link>
    </div>
  );

  const images = listing.images.length > 0 ? listing.images : [
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-slate-50 min-h-screen">
      {/* Navigation */}
      <div className="mb-6">
        <Link to="/search" className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to results
        </Link>
      </div>

      <div className="grid lg:grid-cols-12 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-10">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="aspect-[16/9] rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xl group">
              <img 
                src={images[selectedImage]} 
                alt={listing.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {images.map((img, i) => (
                <button 
                  key={i} 
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    "relative flex-shrink-0 w-20 aspect-square rounded-xl overflow-hidden border-2 transition-all shadow-sm",
                    selectedImage === i ? 'border-indigo-600 scale-95 shadow-inner' : 'border-transparent opacity-70 hover:opacity-100'
                  )}
                >
                  <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>

          {/* Header Info */}
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-none rounded-lg px-3 py-1 uppercase text-[10px] font-bold tracking-widest shadow-sm">
                {listing.category === 'Hotels' ? 'Stays' : listing.category}
              </Badge>
              <div className="flex items-center px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3 mr-1.5" />
                Verified direct vendor
              </div>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 uppercase leading-tight">{listing.title}</h1>
            <div className="flex items-center text-slate-500 font-bold uppercase tracking-widest text-xs space-x-6">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1.5 text-indigo-600" />
                {listing.location}
              </div>
              <div className="flex items-center">
                <Star className="w-4 h-4 mr-1.5 fill-orange-400 text-orange-400" />
                4.9 <span className="font-medium text-slate-300 ml-1">(124)</span>
              </div>
            </div>
          </div>

          <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400 mb-6">About this experience</h2>
            <div className="text-md font-medium leading-relaxed text-slate-600 max-w-3xl whitespace-pre-wrap">
              {listing.description || "No description provided for this unique local experience."}
            </div>
          </div>
          
          {/* Specialized Details */}
          {listing.specifics && Object.keys(listing.specifics).length > 0 && (
            <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400 mb-8">Specific Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {Object.entries(listing.specifics).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300 block">{key.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-bold text-slate-700 capitalize">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Amenities */}
          <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400 mb-8">What you get</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6">
              {(listing.amenities && listing.amenities.length > 0 ? listing.amenities : ['Local Expertise', 'Verified Vendor', 'Direct Connection']).map((item) => (
                <div key={item} className="flex items-center text-xs font-bold uppercase tracking-wider text-slate-600">
                  <CheckCircle2 className="w-4 h-4 mr-3 text-emerald-500" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar / Booking */}
        <aside className="lg:col-span-4 space-y-6">
          <Card className="bg-white border-slate-200 rounded-2xl p-6 shadow-xl sticky top-24">
            <div className="flex justify-between items-baseline mb-8">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Direct Rate</span>
                  <Popover>
                    <PopoverTrigger className="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer focus:outline-none flex items-center justify-center p-0 bg-transparent border-none" aria-label="OTA savings details">
                      <Info className="w-3.5 h-3.5" />
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-80 p-4 bg-white border border-slate-200 shadow-xl rounded-xl">
                      <PopoverHeader className="mb-2 border-b border-slate-100 pb-2">
                        <PopoverTitle className="text-xs font-bold uppercase tracking-wider text-slate-800">Direct Savings Breakdown</PopoverTitle>
                        <PopoverDescription className="text-[10px] text-slate-400 font-medium">Why booking direct on Tripetrip saves you money</PopoverDescription>
                      </PopoverHeader>
                      <div className="space-y-2.5 text-xs text-slate-600">
                        <div className="flex justify-between items-center text-slate-500">
                          <span>Standard OTA Price:</span>
                          <span className="line-through">${Math.round(listing.base_price / 0.8)}</span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-600 font-semibold bg-emerald-50 px-2 py-1.5 rounded-lg text-xs">
                          <span>Our Price (Direct):</span>
                          <span>${listing.base_price}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-100 pt-2 font-bold text-slate-800">
                          <span>Total Saved:</span>
                          <span className="text-emerald-600">${Math.round(listing.base_price / 0.8) - listing.base_price} (20%)</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed mt-2 border-t border-slate-50 pt-2">
                          Standard Online Travel Agencies (OTAs) charge heavy commission fees (15-25%). Tripetrip matches you with verified vendors directly with zero markup commissions.
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <span className="text-4xl font-bold tracking-tight text-slate-900">${listing.base_price}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">/ {listing.price_unit.replace('per_', '')}</span>
              </div>
              <Badge className="bg-emerald-100 text-emerald-600 border-none font-bold text-[10px] px-2 py-0.5 shadow-sm uppercase tracking-tighter">Save 20% vs OTA</Badge>
            </div>

            <div className="space-y-3 mb-8">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-inner">
                  <label className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">Check-in</label>
                  <div className="flex items-center text-xs font-bold text-slate-700">
                    <Calendar className="w-3 h-3 mr-2 text-indigo-400" />
                    Apr 25, 2024
                  </div>
                </div>
                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-inner">
                  <label className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">Check-out</label>
                  <div className="flex items-center text-xs font-bold text-slate-700">
                    <Calendar className="w-3 h-3 mr-2 text-indigo-400" />
                    Apr 30, 2024
                  </div>
                </div>
              </div>
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-inner">
                <label className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">Guests</label>
                <div className="flex items-center text-xs font-bold text-slate-700">
                  <Users className="w-3 h-3 mr-2 text-indigo-400" />
                  2 Adult Travelers
                </div>
              </div>
            </div>

            <Button onClick={handleBooking} className="w-full bg-indigo-600 text-white hover:bg-indigo-700 h-14 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-indigo-100 group transition-all">
              Direct Reservation
              <ArrowLeft className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform rotate-180" />
            </Button>

            <div className="mt-8 space-y-4">
              <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <ShieldCheck className="w-4 h-4 flex-shrink-0 text-indigo-500 mt-0.5" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-relaxed">Escrow protected booking. vendor paid only after your arrival.</p>
              </div>
            </div>
          </Card>

          {/* Vendor Card */}
          <Card className="bg-white border-slate-100 rounded-2xl p-6 shadow-sm">
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-300 mb-4 ml-1">Verified Host</h4>
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-lg font-bold text-indigo-600 shadow-inner border border-indigo-100">L</div>
              <div>
                <div className="text-md font-bold tracking-tight text-slate-800 uppercase">Local Host Collectve</div>
                <div className="text-[9px] text-slate-400 font-bold tracking-widest uppercase flex items-center">
                  <Badge className="bg-indigo-500 w-1.5 h-1.5 rounded-full p-0 mr-1.5" />
                  Verified Agency
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 py-4 border-y border-slate-50 mb-4 text-center">
              <div>
                 <div className="text-xs font-bold text-slate-800">4.9</div>
                 <div className="text-[8px] uppercase tracking-tighter font-bold text-slate-300">Ratings</div>
              </div>
              <div>
                 <div className="text-xs font-bold text-slate-800">128</div>
                 <div className="text-[8px] uppercase tracking-tighter font-bold text-slate-300">Jobs</div>
              </div>
              <div>
                 <div className="text-xs font-bold text-slate-800">100%</div>
                 <div className="text-[8px] uppercase tracking-tighter font-bold text-slate-300">Payout</div>
              </div>
            </div>
            <Button variant="outline" className="w-full rounded-xl border-slate-200 uppercase text-[10px] font-bold tracking-widest h-10 hover:bg-slate-50">Contact Directly</Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}
