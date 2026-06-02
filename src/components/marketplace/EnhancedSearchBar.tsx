import { Button } from '@/components/ui/button';
import { CalendarDays, History, MapPin, Mic, Search, Sparkles, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const tabs = ['Stay', 'Packages', 'Activities', 'Transport'] as const;

export default function EnhancedSearchBar() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Stay');
  const [destination, setDestination] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (destination.trim()) params.set('q', destination.trim());
    params.set('category', activeTab === 'Stay' ? 'stays' : activeTab.toLowerCase());
    navigate(`/search?${params.toString()}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5 }}
      className="mx-auto w-full max-w-6xl rounded-[28px] border border-white/70 bg-white/95 p-3 shadow-2xl shadow-slate-950/20 backdrop-blur-xl"
      role="search"
      aria-label="Search direct travel services"
    >
      <div className="grid grid-cols-4 gap-1 border-b border-slate-100 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-2xl px-2 py-3 text-xs font-bold transition md:text-sm ${
              activeTab === tab
                ? 'bg-emerald-50 text-emerald-700 shadow-inner'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid gap-2 pt-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
        <label className="flex min-h-16 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 transition focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-100">
          <MapPin className="h-5 w-5 shrink-0 text-slate-400" />
          <span className="flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Destination</span>
            <input
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-300"
              placeholder="Search destinations..."
            />
          </span>
          <button type="button" aria-label="Voice search" className="rounded-full p-2 text-emerald-600 hover:bg-emerald-50">
            <Mic className="h-4 w-4" />
          </button>
        </label>

        {[
          { label: 'Check-In', value: '24 May, Sat' },
          { label: 'Check-Out', value: '26 May, Mon' },
        ].map((field) => (
          <button key={field.label} type="button" className="flex min-h-16 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-left transition hover:border-indigo-200 hover:bg-slate-50">
            <CalendarDays className="h-5 w-5 text-slate-400" />
            <span>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">{field.label}</span>
              <span className="text-sm font-bold text-slate-900">{field.value}</span>
            </span>
          </button>
        ))}

        <button type="button" className="flex min-h-16 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-left transition hover:border-indigo-200 hover:bg-slate-50">
          <Users className="h-5 w-5 text-slate-400" />
          <span>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Travellers</span>
            <span className="text-sm font-bold text-slate-900">2 Adults, 0 Child</span>
          </span>
        </button>

        <Button onClick={handleSearch} className="min-h-16 rounded-2xl bg-emerald-600 px-8 text-sm font-bold text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700">
          <Search className="mr-2 h-5 w-5" />
          Search
        </Button>
      </div>

      <div className="grid gap-2 pt-3 md:grid-cols-3">
        <button type="button" className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-left">
          <Sparkles className="h-5 w-5 text-emerald-600" />
          <span>
            <span className="block text-xs font-bold text-slate-900">AI Suggestions</span>
            <span className="text-[11px] font-medium text-slate-500">Manali snow stays, Goa beaches, Bir adventure</span>
          </span>
        </button>
        <button type="button" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left">
          <History className="h-5 w-5 text-indigo-500" />
          <span>
            <span className="block text-xs font-bold text-slate-900">Recent Searches</span>
            <span className="text-[11px] font-medium text-slate-500">Manali, Goa, Bali</span>
          </span>
        </button>
        <button type="button" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left">
          <Mic className="h-5 w-5 text-emerald-600" />
          <span>
            <span className="block text-xs font-bold text-slate-900">Voice Search</span>
            <span className="text-[11px] font-medium text-slate-500">Search with your voice</span>
          </span>
        </button>
      </div>
    </motion.div>
  );
}
