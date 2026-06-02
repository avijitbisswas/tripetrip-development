import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Settings, 
  BarChart3, 
  Users, 
  Calendar as CalendarIcon, 
  Star, 
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Store,
  MapPin,
  ShieldCheck,
  Loader2,
  X,
  CheckCircle2,
  Globe,
  ExternalLink,
  Copy,
  ChevronRight,
  Clock,
  Briefcase
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatCurrency } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import type { Booking, Listing, VendorProfile } from '@/src/types/domain';
import { getCurrentSession } from '@/src/services/auth';
import { listVendorBookings } from '@/src/services/bookings';
import { listListings } from '@/src/services/listings';
import { getVendorByUserId, upsertVendorProfile } from '@/src/services/vendors';

export default function VendorDashboard() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'bookings' | 'website'>('overview');
  const [slugInput, setSlugInput] = useState('');
  const [isUpdatingWebsite, setIsUpdatingWebsite] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<any>(null);

  useEffect(() => {
    fetchVendorData();
  }, []);

  const fetchVendorData = async () => {
    try {
      const { user } = await getCurrentSession();
      if (!user) return;
      const profile = await getVendorByUserId(user.id);

      if (profile) {
        setVendorProfile(profile);
        setSlugInput(profile.slug || '');
        const [listingResult, bookingData] = await Promise.all([
          listListings({ vendorId: profile.id, page: 1, pageSize: 50 }),
          listVendorBookings(profile.id),
        ]);
        setListings(listingResult.items);
        setBookings(bookingData);
      }
    } catch (error) {
      console.error("Error fetching vendor data:", error);
      toast.error("Failed to sync business data.");
    } finally {
      setLoading(false);
    }
  };

  const updateWebsiteSettings = async () => {
    if (!vendorProfile) return;
    setIsUpdatingWebsite(true);
    try {
      const updated = await upsertVendorProfile({
        user_id: vendorProfile.user_id,
        business_name: vendorProfile.business_name,
        business_type: vendorProfile.business_type,
        slug: slugInput,
        business_email: vendorProfile.business_email,
        business_phone: vendorProfile.business_phone,
        description: vendorProfile.description,
      });
      setVendorProfile(updated);
      toast.success("Public identity updated!");
    } catch (err) {
      toast.error("Failed to update.");
    } finally {
      setIsUpdatingWebsite(false);
    }
  };

  const generateAIInsights = async () => {
    setIsAiLoading(true);
    const revenue = bookings.reduce((sum, booking) => sum + Number(booking.total_price || 0), 0);
    const insight = getLocalVendorInsights({
      listingsCount: listings.length,
      bookingsCount: bookings.length,
      revenue,
    });
    setAiInsight(insight);
    setIsAiLoading(false);
  };

  const getLocalVendorInsights = (input: { listingsCount: number; bookingsCount: number; revenue: number }) => {
    if (input.listingsCount === 0) {
      return 'Add your first active listing with clear photos, location, and direct-booking pricing.';
    }

    if (input.bookingsCount === 0) {
      return 'Your listings are live. Improve conversion by adding more photos, availability, and stronger service details.';
    }

    return `You have ${input.bookingsCount} bookings and estimated revenue of ${formatCurrency(input.revenue)}. Keep availability updated and review high-performing categories weekly.`;
  };

  const getSpecificTools = (type?: string) => {
    const t = type?.toLowerCase() || 'other';
    switch (t) {
      case 'stays':
      case 'hotels':
      case 'accommodations':
        return [
          { name: 'Room Occupancy', desc: 'Manage room status & cleaning', icon: Store, action: 'Open Tool' },
          { name: 'Check-in List', desc: 'Daily arrivals & document verification', icon: Users, action: 'Open Tool' },
          { name: 'Direct Rates', desc: 'Adjust pricing for direct bookings', icon: TrendingUp, action: 'Open Tool' }
        ];
      case 'adventure':
        return [
          { name: 'Gear Inventory', desc: 'Track maintenance & availability', icon: Settings, action: 'Open Tool' },
          { name: 'Safety Logs', desc: 'Pre-flight/pre-climb check completion', icon: ShieldCheck, action: 'Open Tool' },
          { name: 'Guide Schedule', desc: 'Assign experts to groups', icon: CalendarIcon, action: 'Open Tool' }
        ];
      case 'transport':
        return [
          { name: 'Fleet Tracker', desc: 'Real-time vehicle status', icon: MapPin, action: 'Open Tool' },
          { name: 'Driver Logs', desc: 'Duty hours & fuel tracking', icon: Users, action: 'Open Tool' },
          { name: 'Maintenance', desc: 'Service reminders for vehicles', icon: Settings, action: 'Open Tool' }
        ];
      case 'tours':
        return [
          { name: 'Language Guides', desc: 'Manage translator assignments', icon: Globe, action: 'Open Tool' },
          { name: 'Roster Management', desc: 'Export group member manifests', icon: Users, action: 'Open Tool' },
          { name: 'Meeting Manager', desc: 'Send meeting point coordinates', icon: MapPin, action: 'Open Tool' }
        ];
      case 'food':
        return [
          { name: 'Menu Editor', desc: 'Update today\'s speciality dishes', icon: Store, action: 'Open Tool' },
          { name: 'Dietary Audit', desc: 'Ensure allergy info is current', icon: ShieldCheck, action: 'Open Tool' },
          { name: 'Table Reserves', desc: 'Manage evening capacity & bookings', icon: Users, action: 'Open Tool' }
        ];
      default:
        return [
          { name: 'Operations Log', desc: 'Daily business task management', icon: Settings, action: 'Open Tool' },
          { name: 'Customer Chat', desc: 'Direct priority support line', icon: Users, action: 'Open Tool' },
          { name: 'Analytics', desc: 'Deep dive into service data', icon: BarChart3, action: 'Open Tool' }
        ];
    }
  };

  const specificTools = getSpecificTools(vendorProfile?.business_type);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 bg-slate-50 min-h-screen">
      {/* Tool Modal Overlay */}
      <AnimatePresence>
        {activeTool && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setActiveTool(null)}
               className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative bg-white border border-slate-200 w-full max-w-2xl rounded-[32px] shadow-2xl p-8 overflow-hidden"
             >
                <div className="flex justify-between items-center mb-8">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                         <activeTool.icon className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                         <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">{activeTool.name}</h3>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{activeTool.desc}</p>
                      </div>
                   </div>
                   <button onClick={() => setActiveTool(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                      <X className="w-5 h-5 text-slate-400" />
                   </button>
                </div>

                <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                   <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-6">
                      <Settings className="w-8 h-8 text-slate-200 animate-[spin_10s_linear_infinite]" />
                   </div>
                   <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Tool Interface Loading</h4>
                   <p className="text-[10px] text-slate-300 uppercase tracking-widest mt-2">{activeTool.name} syncing with local operations hub...</p>
                   <Button variant="outline" className="mt-8 border-slate-200 rounded-xl uppercase text-[10px] font-bold tracking-widest h-10 px-8" onClick={() => setActiveTool(null)}>Close Terminal</Button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <Badge className="bg-indigo-600 text-white border-none rounded shadow-md text-[10px] font-bold tracking-widest px-3 py-1">
               VENDOR CONSOLE
             </Badge>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Operational Pulse: {loading ? 'Syncing...' : 'Stable'}</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 uppercase leading-none mb-3">Business Management</h1>
          <p className="text-slate-500 font-medium uppercase tracking-widest text-xs">Managing <span className="text-indigo-600 font-bold">{vendorProfile?.business_name || 'Himalayan Business'}</span> • Local Hospitality Collective</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-slate-200 bg-white rounded-xl h-12 px-5 hover:bg-slate-50 shadow-sm" onClick={() => setActiveTab('website')}>
            <Globe className="w-4 h-4 text-slate-400 mr-2" />
            <span className="text-xs font-bold uppercase tracking-widest">Direct Website</span>
          </Button>
          <Link to="/vendor/listing/new">
            <Button className="bg-indigo-600 text-white hover:bg-indigo-700 h-12 px-6 rounded-xl uppercase tracking-widest text-xs font-bold shadow-lg shadow-indigo-100">
              <Plus className="w-4 h-4 mr-2" />
              New Listing
            </Button>
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'bookings', label: 'Bookings & Arrival', icon: CalendarIcon },
          { id: 'listings', label: 'Offerings', icon: Store },
          { id: 'website', label: 'Website Control', icon: Globe }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-slate-900 text-white shadow-lg" 
                : "bg-white text-slate-400 hover:text-slate-600 border border-slate-200 shadow-sm"
            )}
          >
            <tab.icon className={cn("w-3.5 h-3.5", activeTab === tab.id ? "text-indigo-400" : "text-slate-300")} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Escrowed Revenue', value: formatCurrency(2800), icon: TrendingUp, trend: '95% Guarantee', color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Upcoming Arrivals', value: bookings.length, icon: CalendarIcon, trend: '+2 today', color: 'text-indigo-500', bg: 'bg-indigo-50' },
                    { label: 'Review Velocity', value: '4.8', icon: Star, trend: 'Local Legend', color: 'text-orange-500', bg: 'bg-orange-50' },
                  ].map((stat, i) => (
                    <Card key={i} className="bg-white border-slate-200 rounded-2xl p-6 shadow-sm">
                      <div className="flex justify-between items-start mb-6">
                        <div className={cn("p-2.5 rounded-xl border border-slate-100 shadow-inner", stat.bg)}>
                          <stat.icon className={cn("w-4 h-4", stat.color)} />
                        </div>
                        <Badge variant="outline" className="border-slate-100 bg-slate-50 text-[10px] tracking-tighter uppercase font-bold text-slate-500">
                          {stat.trend}
                        </Badge>
                      </div>
                      <div className="text-2xl font-bold tracking-tight text-slate-900 mb-1">{stat.value}</div>
                      <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{stat.label}</div>
                    </Card>
                  ))}
                </div>

                {/* Specific Tools */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight uppercase">Operations Center</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Specialized logic for {vendorProfile?.business_type}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {specificTools.map((tool, i) => (
                      <div 
                        key={i} 
                        onClick={() => setActiveTool(tool)}
                        className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer group"
                      >
                          <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <tool.icon className="w-5 h-5 text-indigo-600" />
                          </div>
                          <h4 className="text-sm font-bold text-slate-800 mb-1">{tool.name}</h4>
                          <p className="text-[10px] text-slate-400 font-medium leading-relaxed mb-4">{tool.desc}</p>
                          <Button 
                            variant="ghost" 
                            className="w-full text-indigo-600 font-bold text-[10px] uppercase tracking-widest border border-indigo-50 p-0 h-8 rounded-lg bg-white"
                          >
                            {tool.action}
                          </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'bookings' && (
              <motion.div 
                key="bookings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                 <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm p-8">
                    <div className="flex justify-between items-center mb-10">
                       <h2 className="text-xl font-bold text-slate-900 tracking-tight uppercase">Arrival Manifest</h2>
                       <Button variant="outline" className="rounded-xl h-10 text-[10px] font-bold uppercase tracking-widest border-slate-200">Export Today's List</Button>
                    </div>

                    <div className="space-y-4">
                       {bookings.map((booking) => (
                         <div key={booking.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-md transition-all group">
                            <div className="flex items-center gap-4 mb-4 md:mb-0">
                               <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-600 font-bold text-lg">{booking.traveler_name.charAt(0)}</div>
                               <div>
                                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">{booking.traveler_name}</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                     <Badge className={cn(
                                       "border-none uppercase text-[8px] font-bold tracking-tight px-2",
                                       booking.status === 'confirmed' ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                                     )}>
                                        {booking.status}
                                     </Badge>
                                     <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">• {booking.guests} Guests</span>
                                  </div>
                               </div>
                            </div>
                            
                            <div className="flex items-center gap-12">
                               <div className="text-left">
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300 block mb-1">Check In</span>
                                  <span className="text-xs font-bold text-slate-600 uppercase">{new Date(booking.start_date).toLocaleDateString()}</span>
                               </div>
                               <div className="flex items-center gap-3">
                                  <Button variant="ghost" className="h-10 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-indigo-600">Details</Button>
                                  <Button className="h-10 px-6 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white">Check In</Button>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </motion.div>
            )}

            {activeTab === 'listings' && (
              <motion.div 
                key="listings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {listings.map((listing) => (
                  <div key={listing.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-100 rounded-3xl hover:border-indigo-200 transition-all group shadow-sm gap-4">
                    <div className="flex items-center space-x-6">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                        <img src={listing.images[0] || 'https://picsum.photos/200'} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{listing.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                           <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Inventory: <span className="text-slate-900">{String(listing.specifics?.units || 1)} Total</span></div>
                           <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[8px]">Active Market</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pr-0 sm:pr-4">
                      <div className="text-left sm:text-right mr-0 sm:mr-6">
                         <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300 block">Unit Rate</span>
                         <span className="text-xs font-bold text-slate-900">{formatCurrency(listing.base_price)}</span>
                      </div>
                      <Link to={`/vendor/listing/edit/${listing.id}`}>
                        <Button variant="outline" size="sm" className="rounded-xl border-slate-100 h-10 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-indigo-600 hover:border-indigo-200">Manage</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'website' && (
               <motion.div 
                 key="website"
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 className="space-y-8"
               >
                  <Card className="bg-white border-slate-200 rounded-[40px] p-10 shadow-sm relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-8">
                        <div className="w-20 h-20 bg-indigo-50 rounded-[40px] flex items-center justify-center -rotate-12 border border-indigo-100">
                           <Globe className="w-10 h-10 text-indigo-200" />
                        </div>
                     </div>
                     
                     <div className="relative z-10">
                        <Badge className="bg-emerald-50 text-emerald-600 border-none rounded uppercase text-[9px] font-bold tracking-widest px-3 py-1 mb-6">Direct Website Portal</Badge>
                        <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tighter mb-4">Your Digital Storefront</h2>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-widest leading-relaxed mb-10 max-w-sm">Every vendor on Tripetrip gets a dedicated, high-conversion landing page. No setup required.</p>
                        
                        <div className="space-y-6">
                           <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-3">Live Public Address</span>
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                                 <div className="flex items-center gap-2 text-indigo-600 font-bold bg-white px-4 py-3 rounded-xl border border-indigo-50 shadow-sm flex-grow overflow-hidden">
                                     <span className="text-slate-300 text-xs font-normal">tripetrip.com/v/</span>
                                     <input 
                                       value={slugInput}
                                       onChange={(e) => setSlugInput(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                       className="bg-transparent border-none outline-none truncate w-full"
                                     />
                                 </div>
                                 <div className="flex gap-2 justify-end">
                                    <Button 
                                      variant="default" 
                                      disabled={isUpdatingWebsite || slugInput === vendorProfile?.slug}
                                      onClick={updateWebsiteSettings}
                                      className="h-12 bg-indigo-600 rounded-xl px-6 font-bold uppercase tracking-widest text-[9px] flex-grow sm:flex-grow-0"
                                    >
                                       {isUpdatingWebsite ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save URL'}
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      className="h-12 w-12 rounded-xl p-0 border-slate-200"
                                      onClick={() => {
                                        navigator.clipboard.writeText(`https://tripetrip.com/v/${vendorProfile?.slug}`);
                                        toast.success("Domain copied to clipboard!");
                                      }}
                                    >
                                       <Copy className="w-4 h-4 text-slate-400" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      className="h-12 w-12 rounded-xl p-0 border-slate-200"
                                      onClick={() => window.open(`/v/${vendorProfile?.slug}`, '_blank')}
                                    >
                                       <ExternalLink className="w-4 h-4 text-slate-400" />
                                    </Button>
                                 </div>
                              </div>
                           </div>

                           <div className="p-8 border border-slate-100 rounded-3xl">
                              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight mb-4">Custom External Domain</h4>
                              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest leading-relaxed mb-6">Already have a private website? Connect it here to use Tripetrip as your backend manager while using your own URL.</p>
                              <div className="flex flex-col sm:flex-row gap-4">
                                 <input 
                                   type="text" 
                                   placeholder="e.g. www.himalayanstays.com" 
                                   defaultValue={vendorProfile?.custom_website}
                                   className="flex-grow h-12 bg-white border border-slate-200 rounded-xl px-5 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                                 />
                                 <Button className="bg-slate-900 text-white h-12 px-8 rounded-xl font-bold uppercase tracking-widest text-[10px] w-full sm:w-auto">Verify & Sync</Button>
                              </div>
                           </div>
                        </div>
                     </div>
                  </Card>
               </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dashboard Sidebar */}
        <aside className="lg:col-span-4 space-y-8">
          <Card className="bg-indigo-900 rounded-[40px] p-10 relative overflow-hidden group shadow-2xl">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-400 opacity-[0.2] blur-[80px] group-hover:scale-150 transition-transform duration-700" />
            
            <div className="flex items-center space-x-3 mb-8 relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md text-white flex items-center justify-center shadow-lg border border-white/20">
                <Sparkles className="w-5 h-5 text-indigo-300" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-white uppercase italic">AI Strategy</h3>
            </div>

            <div className="min-h-[140px] relative z-10">
              {aiInsight ? (
                <div className="text-xs font-medium leading-relaxed text-indigo-100 animate-in fade-in slide-in-from-bottom-4 duration-700 uppercase tracking-wide">
                  {aiInsight}
                </div>
              ) : (
                <div className="text-indigo-200 text-xs font-medium uppercase tracking-widest leading-relaxed">
                  "Peak travel season usually starts next month. I suggest updating your 'Stay' descriptions with 'Monsoon Trekking' keywords to attract early birds."
                </div>
              )}
            </div>

            <Button 
              onClick={generateAIInsights}
              disabled={isAiLoading}
              className="w-full mt-10 bg-white text-indigo-900 hover:bg-white/90 border-none h-14 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl relative z-10"
            >
              {isAiLoading ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : <Sparkles className="mr-2 w-4 h-4" />}
              Generate Insight
            </Button>
          </Card>

          <Card className="bg-emerald-600 rounded-[40px] p-10 text-white shadow-xl relative overflow-hidden group">
             <div className="absolute top-10 right-10">
                <ShieldCheck className="w-20 h-20 text-emerald-500 opacity-20 -rotate-12 group-hover:rotate-0 transition-transform duration-500" />
             </div>
             <h3 className="text-xl font-bold uppercase tracking-tight mb-4 flex items-center gap-2">
                Escrow Safe
             </h3>
             <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100 mb-6 leading-relaxed">Total Protected Value:</p>
             <div className="text-4xl font-bold tracking-tighter mb-8 leading-none">
                {formatCurrency(840.50)}
             </div>
             <Button variant="ghost" className="w-full bg-white/10 hover:bg-white/20 text-white rounded-2xl h-12 uppercase text-[10px] font-bold tracking-widest border border-white/20">
                Withdrawal Policy
             </Button>
          </Card>

          <div className="p-8 border border-slate-100 bg-white rounded-[40px] shadow-sm">
             <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
                   <Clock className="w-4 h-4 text-orange-400" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Recent Activity</h4>
             </div>
             
             <div className="space-y-6">
                {[
                  { desc: 'New booking from Sarah J.', time: '2m ago' },
                  { desc: 'AI insight updated', time: '1h ago' },
                  { desc: 'Escrow payment processed', time: '3h ago' }
                ].map((act, i) => (
                  <div key={i} className="flex justify-between items-start">
                     <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide max-w-[70%] leading-tight">{act.desc}</span>
                     <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">{act.time}</span>
                  </div>
                ))}
             </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
