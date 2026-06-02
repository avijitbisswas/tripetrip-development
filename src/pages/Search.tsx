import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Search as SearchIcon, 
  Map as MapIcon, 
  LayoutGrid, 
  SlidersHorizontal, 
  Star, 
  MapPin, 
  CreditCard 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Listing } from '@/src/types/domain';
import { listListings } from '@/src/services/listings';

export default function Search() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    fetchListings();
  }, [searchParams]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const result = await listListings({
        category: searchParams.get('category'),
        search: searchParams.get('q'),
        page: 1,
        pageSize: 24,
      });
      setListings(result.items);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Stays', 'Adventure', 'Transport', 'Tours', 'Food'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-slate-50 min-h-screen">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 mt-4">
        <div className="relative flex-1 group">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search experiences, stays, or hidden gems..."
            className="bg-white border-slate-200 h-14 pl-12 rounded-xl text-md shadow-sm focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        
        <div className="flex items-center space-x-1 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md" : "text-slate-500 hover:text-indigo-600"}
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Grid
          </Button>
          <Button 
            variant={viewMode === 'map' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setViewMode('map')}
            className={viewMode === 'map' ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md" : "text-slate-500 hover:text-indigo-600"}
          >
            <MapIcon className="w-4 h-4 mr-2" />
            Map
          </Button>
        </div>
      </div>

      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-6">
        <Button 
          variant="outline" 
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="w-full flex items-center justify-center gap-2 h-12 bg-white border-slate-200 rounded-xl"
        >
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
            {showMobileFilters ? "Hide Filters" : "Show / Modify Filters"}
          </span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Filters Sidebar */}
        <aside className={cn(
          "lg:col-span-3 space-y-6",
          showMobileFilters ? "block" : "hidden lg:block"
        )}>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Filters</h3>
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            </div>
            
            <div className="space-y-8">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-tight mb-4 text-slate-500">Categories</h4>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Badge 
                      key={cat} 
                      variant="outline" 
                      className={cn(
                        "cursor-pointer font-bold rounded-lg px-3 py-1 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all",
                        searchParams.get('category') === cat.toLowerCase() ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600"
                      )}
                      onClick={() => setSearchParams({ category: cat.toLowerCase() })}
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-tight text-slate-500">Budget</h4>
                  <span className="text-xs font-bold text-indigo-600">Up to ${priceRange[1]}</span>
                </div>
                <Slider 
                  value={priceRange} 
                  max={2000} 
                  step={10} 
                  onValueChange={(val: any) => setPriceRange(val)}
                  className="[&_[role=slider]]:bg-indigo-600 [&_[role=slider]]:shadow-lg"
                />
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-tight mb-4 text-slate-500">Min Rating</h4>
                <div className="space-y-2">
                  {[5, 4, 3].map((star) => (
                    <button key={star} className="flex items-center justify-between w-full text-slate-600 hover:text-indigo-600 transition-colors group">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={cn("w-3 h-3", i < star ? "fill-orange-400 text-orange-400" : "fill-slate-100 text-slate-100")} />
                        ))}
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">& Up</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-900 rounded-xl p-6 text-white relative overflow-hidden">
             <div className="relative z-10">
               <h4 className="text-sm font-bold mb-2">Direct Booking Benefit</h4>
               <p className="text-[10px] text-indigo-100 leading-relaxed font-medium">Bypassing OTAs saves an average of 18% on this category. Escrow protected.</p>
             </div>
             <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-indigo-500 rounded-full opacity-20 blur-2xl" />
          </div>
        </aside>

        {/* Results */}
        <div className="lg:col-span-9">
          <div className="flex items-center justify-between mb-6">
             <div className="text-sm font-medium text-slate-500">Showing <span className="text-slate-900 font-bold">{listings.length}</span> results</div>
             <Button variant="ghost" size="sm" className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Sort: Relevance</Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-white rounded-xl border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <Card key={listing.id} onClick={() => navigate(`/listing/${listing.id}`)} className="bg-white border-slate-200 rounded-xl overflow-hidden group hover:border-indigo-200 transition-all cursor-pointer shadow-sm hover:shadow-md">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img 
                      src={listing.images[0] || `https://picsum.photos/seed/${listing.title}/800/600`} 
                      alt={listing.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                       <Badge className="bg-white/95 backdrop-blur-md text-indigo-600 border-none rounded shadow-sm text-[9px] font-bold tracking-wider px-2 py-0.5">
                        VERIFIED VENDOR
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-sm font-bold text-slate-800 truncate flex-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{listing.title}</h3>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 text-[10px] mb-4 font-bold uppercase tracking-wider">
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1 text-slate-300" />
                        {listing.location}
                      </div>
                      <div className="flex items-center text-orange-500">
                        <Star className="w-2.5 h-2.5 fill-current mr-0.5" />
                        4.9
                      </div>
                    </div>
                    <div className="flex justify-between items-end pt-4 border-t border-slate-50">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest line-through mb-0.5">OTA: ${Math.round(listing.base_price * 1.2)}</div>
                        <div className="text-xl font-bold text-slate-900 tracking-tight">${listing.base_price} <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">/ {listing.price_unit.replace('per_', '')}</span></div>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-600 border-none font-bold text-[9px] px-2">SAVE 20%</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {listings.length === 0 && (
                <div className="col-span-full py-24 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
                  <div className="text-xl text-slate-300 mb-4 font-bold uppercase tracking-tight">No adventures found</div>
                  <Button variant="outline" className="text-indigo-600 border-indigo-100 hover:bg-indigo-50 font-bold px-8 rounded-xl" onClick={() => setSearchParams({})}>Reset All Filters</Button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-[70vh] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center relative shadow-inner">
              <div className="text-slate-400 text-center">
                <MapIcon className="w-12 h-12 mx-auto mb-4 opacity-40" />
                <div className="text-lg font-bold tracking-tight text-slate-500 uppercase">Interactive Map Active</div>
                <div className="text-[10px] tracking-widest font-bold opacity-50">MANALI & SURROUNDINGS</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
