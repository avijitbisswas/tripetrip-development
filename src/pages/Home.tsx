import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Calendar, Users, ArrowRight, ShieldCheck, Globe, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function Home() {
  const categories = [
    { name: 'Stays', icon: '🏡', color: 'bg-orange-500' },
    { name: 'Adventure', icon: '🧗', color: 'bg-green-500' },
    { name: 'Transport', icon: '🚐', color: 'bg-blue-500' },
    { name: 'Tours', icon: '🗺️', color: 'bg-purple-500' },
    { name: 'Food', icon: '🍲', color: 'bg-yellow-500' },
  ];

  return (
    <div className="bg-slate-50 overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] md:h-[80vh] flex items-center justify-center pt-24 pb-12 md:pb-0 md:pt-16">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=2021" 
            alt="Hero"
            className="w-full h-full object-cover opacity-80"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-indigo-900/40 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 w-full">
          <div className="text-center mb-12">
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-7xl font-bold tracking-tight text-white mb-6 drop-shadow-lg"
            >
              Book direct from locals. <br /> No middleman.
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-white/90 text-lg md:text-xl font-medium mb-12 drop-shadow-md"
            >
              Eliminating commissions. Direct connections. Verified trust.
            </motion.p>
          </div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-2 flex flex-col md:flex-row items-center gap-2"
          >
            <div className="flex-1 w-full px-4 py-3 border-b md:border-b-0 md:border-r border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">Location</p>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-500" />
                <input type="text" placeholder="Where to?" className="w-full text-slate-800 text-sm focus:outline-none bg-transparent placeholder:text-slate-300" />
              </div>
            </div>
            <div className="flex-1 w-full px-4 py-3 border-b md:border-b-0 md:border-r border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">Dates</p>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <input type="text" placeholder="When?" className="w-full text-slate-800 text-sm focus:outline-none bg-transparent placeholder:text-slate-300" />
              </div>
            </div>
            <div className="flex-1 w-full px-4 py-3">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">Guests</p>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                <input type="text" placeholder="Add guests" className="w-full text-slate-800 text-sm focus:outline-none bg-transparent placeholder:text-slate-300" />
              </div>
            </div>
            <Button size="lg" className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 h-14 font-bold shadow-lg shadow-indigo-200 transition-all">
              Search
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Stats Mini Bar */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {[
            { label: 'Commission Saved', value: '₹4.2M+', color: 'text-emerald-600' },
            { label: 'Verified Vendors', value: '1,402', color: 'text-indigo-600' },
            { label: 'Travelers', value: '28k+', color: 'text-slate-900' },
            { label: 'Direct Deals', value: '100%', color: 'text-indigo-600' },
          ].map((stat, i) => (
            <div key={i} className="py-8 px-6 text-center md:text-left">
              <div className={cn("text-2xl font-bold tracking-tight mb-1", stat.color)}>{stat.value}</div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Explore Experiences</h2>
            <p className="text-slate-500 font-medium">Handpicked local offerings with zero booking fees.</p>
          </div>
          <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-indigo-600 rounded-lg font-bold text-xs uppercase tracking-widest">
            Browse All Categories
          </Button>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
          {categories.map((cat) => (
            <Link 
              key={cat.name} 
              to={`/search?category=${cat.name.toLowerCase()}`}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group"
            >
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">{cat.icon}</div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">{cat.name}</span>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Value Prop */}
      <section className="py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-12">
          <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-100">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Escrow Protection</h3>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">Securely hold funds with Razorpay. Payments released only after verified service delivery.</p>
          </div>
          <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-100">
              <Globe className="text-white w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Direct Connections</h3>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">Bypass expensive OTA platforms. Chat and book directly with local hosts and guides.</p>
          </div>
          <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-100">
              <Zap className="text-white w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">AI Travel Planner</h3>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">Local-first marketplace tools help you discover river-side cafes and off-beat treks others miss.</p>
          </div>
        </div>
      </section>

      {/* Vendor CTA */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto rounded-3xl bg-indigo-900 p-8 md:p-16 relative overflow-hidden group shadow-2xl">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex px-3 py-1 bg-indigo-500 rounded-full text-xs font-bold text-white uppercase tracking-wider mb-6">Vendor Opportunity</div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Run your business direct.</h2>
            <p className="text-indigo-100 text-lg mb-10 leading-relaxed font-medium">Keep 100% of your earnings. No listing fees, no commission. Just direct community-led travel.</p>
            <Link to="/register?role=vendor">
              <Button size="lg" className="bg-white text-indigo-900 hover:bg-slate-50 rounded-xl px-10 h-14 font-bold shadow-xl transition-all">
                Join the Network
                <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          {/* Decorative Blooms */}
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-indigo-800 rounded-full opacity-50 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-indigo-700 rounded-full opacity-30 blur-3xl" />
        </div>
      </section>
    </div>
  );
}
