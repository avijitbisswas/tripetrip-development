import { Button } from '@/components/ui/button';
import { CalendarDays, Car, Compass, History, MapPin, Mic, Search, Sparkles, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { suggestLocations, type MapSuggestion } from '@/src/services/maps';

const tabs = ['Stay', 'Packages', 'Activities', 'Transport'] as const;
type SearchTab = (typeof tabs)[number];

const tabConfig: Record<SearchTab, {
  destinationLabel: string;
  destinationPlaceholder: string;
  fields: Array<{ label: string; value: string; icon: typeof CalendarDays }>;
  suggestion: string;
  recent: string;
}> = {
  Stay: {
    destinationLabel: 'Destination',
    destinationPlaceholder: 'Search destinations...',
    fields: [
      { label: 'Check-In', value: '24 May, Sat', icon: CalendarDays },
      { label: 'Check-Out', value: '26 May, Mon', icon: CalendarDays },
      { label: 'Travellers', value: '2 Adults, 0 Child', icon: Users },
    ],
    suggestion: 'Manali snow stays, Goa beaches, Bir adventure',
    recent: 'Manali, Goa, Bali',
  },
  Packages: {
    destinationLabel: 'Destination',
    destinationPlaceholder: 'Search packages...',
    fields: [
      { label: 'Travel Date', value: 'Anytime', icon: CalendarDays },
      { label: 'Duration', value: '3 - 5 Days', icon: CalendarDays },
      { label: 'Travellers', value: '2 Adults, 0 Child', icon: Users },
    ],
    suggestion: 'Goa package, Kashmir escape, Bali villa',
    recent: 'Goa, Kerala, Dubai',
  },
  Activities: {
    destinationLabel: 'Activity Location',
    destinationPlaceholder: 'Search activities...',
    fields: [
      { label: 'Activity Date', value: 'Today or Tomorrow', icon: CalendarDays },
      { label: 'Activity Type', value: 'Adventure', icon: Compass },
      { label: 'Participants', value: '2 Adults', icon: Users },
    ],
    suggestion: 'Scuba diving, ATV rides, rafting',
    recent: 'Andaman, Rishikesh, Jaipur',
  },
  Transport: {
    destinationLabel: 'Pickup City',
    destinationPlaceholder: 'Search pickup city...',
    fields: [
      { label: 'Pickup', value: 'Goa Airport', icon: MapPin },
      { label: 'Drop', value: 'Calangute Beach', icon: MapPin },
      { label: 'Vehicle', value: 'SUV with Driver', icon: Car },
    ],
    suggestion: 'Airport transfer, SUV rental, bike rental',
    recent: 'Goa Airport, Delhi, Manali',
  },
};

export default function EnhancedSearchBar() {
  const [activeTab, setActiveTab] = useState<SearchTab>('Stay');
  const [destination, setDestination] = useState('');
  const [suggestions, setSuggestions] = useState<MapSuggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const navigate = useNavigate();
  const config = tabConfig[activeTab];

  useEffect(() => {
    if (destination.trim().length < 2) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }

    let cancelled = false;
    const handle = window.setTimeout(async () => {
      try {
        const nextSuggestions = await suggestLocations(destination.trim());
        if (!cancelled) {
          setSuggestions(nextSuggestions);
          setSuggestionsOpen(nextSuggestions.length > 0);
        }
      } catch {
        if (!cancelled) {
          setSuggestions([]);
          setSuggestionsOpen(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [destination]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (destination.trim()) params.set('q', destination.trim());
    if (activeTab === 'Stay') {
      navigate(`/stays${params.toString() ? `?${params.toString()}` : ''}`);
      return;
    }

    if (activeTab === 'Packages') {
      navigate(`/packages${params.toString() ? `?${params.toString()}` : ''}`);
      return;
    }

    navigate(`/${activeTab.toLowerCase()}${params.toString() ? `?${params.toString()}` : ''}`);
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
        <div className="relative">
          <label className="flex min-h-16 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 transition focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-100">
            <MapPin className="h-5 w-5 shrink-0 text-slate-400" />
            <span className="flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">{config.destinationLabel}</span>
              <input
                value={destination}
                onChange={(event) => {
                  setDestination(event.target.value);
                  setSuggestionsOpen(true);
                }}
                onFocus={() => {
                  if (suggestions.length) setSuggestionsOpen(true);
                }}
                onBlur={() => {
                  window.setTimeout(() => setSuggestionsOpen(false), 120);
                }}
                className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-300"
                placeholder={config.destinationPlaceholder}
                autoComplete="off"
              />
            </span>
            <button type="button" aria-label="Voice search" className="rounded-full p-2 text-emerald-600 hover:bg-emerald-50">
              <Mic className="h-4 w-4" />
            </button>
          </label>

          {suggestionsOpen && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.14)]">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  aria-label={`${suggestion.label}${suggestion.secondary ? ` ${suggestion.secondary}` : ''}`}
                  className="flex w-full items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setDestination(suggestion.label);
                    setSuggestionsOpen(false);
                  }}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black text-slate-900">{suggestion.label}</span>
                    {suggestion.secondary && <span className="mt-1 block text-[11px] font-semibold text-slate-500">{suggestion.secondary}</span>}
                  </span>
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                </button>
              ))}
            </div>
          )}
        </div>

        {config.fields.map((field) => (
          <button key={field.label} type="button" className="flex min-h-16 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-left transition hover:border-indigo-200 hover:bg-slate-50">
            <field.icon className="h-5 w-5 text-slate-400" />
            <span>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">{field.label}</span>
              <span className="text-sm font-bold text-slate-900">{field.value}</span>
            </span>
          </button>
        ))}

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
            <span className="text-[11px] font-medium text-slate-500">{config.suggestion}</span>
          </span>
        </button>
        <button type="button" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left">
          <History className="h-5 w-5 text-indigo-500" />
          <span>
            <span className="block text-xs font-bold text-slate-900">Recent Searches</span>
            <span className="text-[11px] font-medium text-slate-500">{config.recent}</span>
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
