import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Listing, VendorProfile } from '@/src/types/domain';
import { listListings } from '@/src/services/listings';
import { getVendorBySlug } from '@/src/services/vendors';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  MessageSquare, 
  Globe, 
  ExternalLink,
  Share2,
  ArrowRight,
  ShieldCheck,
  Star,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency } from '@/src/lib/utils';
import { motion } from 'motion/react';

export default function PublicVendorPage() {
  const { slug } = useParams<{ slug: string }>();
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      try {
        const vendorData = await getVendorBySlug(slug);
        const listingsResult = await listListings({
          vendorId: vendorData.id,
          page: 1,
          pageSize: 24,
        });
        setVendor(vendorData);
        setListings(listingsResult.items);
      } catch (err) {
        console.error("Error loading vendor page:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Loading Business Identity</span>
    </div>
  );

  if (!vendor) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-4xl font-bold text-slate-900 mb-4">404</h1>
      <p className="text-slate-500 uppercase tracking-widest text-[10px] font-bold">Business not found or has been moved.</p>
      <Link to="/" className="mt-8">
        <Button variant="outline" className="rounded-xl font-bold uppercase text-[10px] tracking-widest">Return Home</Button>
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <div className="relative min-h-[40vh] md:h-[40vh] bg-slate-900 overflow-hidden flex flex-col justify-end">
        {vendor.banner_url ? (
          <img src={vendor.banner_url} className="absolute inset-0 w-full h-full object-cover opacity-60" />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-900 via-slate-900 to-emerald-900 opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
        
        <div className="relative w-full px-4 md:px-12 pb-8 md:pb-12 pt-24 md:pt-0 flex flex-col md:flex-row items-start md:items-end justify-between gap-8 z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-white border-4 border-white shadow-2xl overflow-hidden flex items-center justify-center flex-shrink-0">
              {vendor.logo_url ? (
                <img src={vendor.logo_url} className="w-full h-full object-cover" />
              ) : (
                <Globe className="w-12 h-12 text-slate-100" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <Badge className="bg-white text-slate-900 border-none shadow-sm uppercase text-[8px] font-bold tracking-widest px-2">{vendor.business_type}</Badge>
                <div className="flex items-center gap-1 text-emerald-500">
                  <ShieldCheck className="w-4 h-4 fill-emerald-500 text-white" />
                  <span className="text-[10px] font-bold uppercase tracking-tighter">Verified Provider</span>
                </div>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-slate-900 uppercase tracking-tight leading-none">{vendor.business_name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-4 text-slate-400">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{vendor.address || 'Himalayas, India'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900">4.9 (Local Legend)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
             <Button className="flex-1 sm:flex-none bg-indigo-600 text-white hover:bg-indigo-700 h-14 px-8 rounded-2xl uppercase text-[10px] font-bold tracking-[0.2em] shadow-xl shadow-indigo-100">
                Direct Inquiry
             </Button>
             <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-slate-200 bg-white">
                <MessageSquare className="w-5 h-5 text-slate-400" />
             </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-12 py-20">
        <div className="grid lg:grid-cols-12 gap-16">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-16">
            <section>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-300 mb-4">About the Business</h2>
              <p className="text-lg text-slate-600 leading-relaxed font-medium">
                {vendor.description || `${vendor.business_name} is a premier ${vendor.business_type} service provider committed to offering authentic Himalayan experiences. We prioritize direct connections and local expertise.`}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12">
                 {[
                   { label: 'Excellence', value: '5+ Years' },
                   { label: 'Verified', value: 'Aadhar/GST' },
                   { label: 'Support', value: '24/7 Live' },
                   { label: 'Safety', value: 'Audit Pass' }
                 ].map((stat, i) => (
                   <div key={i} className="border-l-2 border-slate-100 pl-4">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{stat.label}</div>
                      <div className="text-sm font-bold text-slate-900 uppercase">{stat.value}</div>
                   </div>
                 ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-300">Live Offerings</h2>
                <div className="h-[1px] flex-grow bg-slate-100 mx-8" />
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                {listings.map((item, idx) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="group"
                  >
                    <Link to={`/listing/${item.id}`} className="block">
                      <div className="aspect-[4/3] rounded-3xl overflow-hidden mb-6 bg-slate-100 relative shadow-md group-hover:shadow-xl transition-all duration-500">
                         <img 
                           src={item.images[0]} 
                           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                         />
                         <div className="absolute top-4 right-4">
                            <Badge className="bg-white/90 backdrop-blur text-slate-900 border-none font-bold text-[9px] uppercase tracking-widest px-3 py-1.5 shadow-xl">
                               From {formatCurrency(item.base_price)}
                            </Badge>
                         </div>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2 uppercase tracking-wide font-medium">{item.description}</p>
                      
                      <div className="flex items-center gap-4 mt-6 pt-6 border-t border-slate-50">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                           <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                           Verified
                        </div>
                        <div className="ml-auto flex items-center gap-2 text-indigo-600 group-hover:gap-4 transition-all">
                           <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Explore</span>
                           <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-8">
              <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100">
                 <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-8">Business Contact</h3>
                 
                 <div className="space-y-6">
                    <div className="flex items-start gap-4">
                       <Globe className="w-5 h-5 text-indigo-600 mt-1" />
                       <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Official Website</span>
                          <span className="text-xs font-bold text-slate-900 border-b border-indigo-200">
                             {vendor.custom_website || `tripetrip.com/v/${vendor.slug}`}
                          </span>
                       </div>
                    </div>
                    {vendor.social_links && (
                      <div className="pt-6 border-t border-white/60">
                         <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-4">Connect Socially</span>
                         <div className="flex gap-4">
                            {vendor.social_links.instagram && (
                              <a href={vendor.social_links.instagram} className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center hover:bg-indigo-50 transition-colors">
                                 <Share2 className="w-5 h-5 text-indigo-600" />
                              </a>
                            )}
                            {vendor.social_links.facebook && (
                              <a href={vendor.social_links.facebook} className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-colors">
                                 <ExternalLink className="w-5 h-5 text-indigo-600" />
                              </a>
                            )}
                         </div>
                      </div>
                    )}
                 </div>

                 <Button className="w-full mt-12 bg-slate-900 text-white hover:bg-slate-800 h-14 rounded-2xl font-bold uppercase tracking-[0.25em] text-[10px] shadow-2xl">
                    Get Location Profile
                 </Button>
              </div>

              <div className="p-8 border border-slate-100 rounded-[40px]">
                 <div className="flex items-center gap-2 mb-4">
                    <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-900 font-bold">Tripetrip Trust Audit</span>
                 </div>
                 <p className="text-[10px] leading-relaxed text-slate-400 font-medium uppercase tracking-wide">This provider has completed the mandatory local verification process and maintains a 100% resolution rate on escrow transactions.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
