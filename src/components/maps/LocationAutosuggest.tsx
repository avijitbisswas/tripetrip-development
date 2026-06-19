import { useEffect, useState } from 'react';
import { ChevronDown, Loader2, MapPin } from 'lucide-react';
import { suggestLocations, type MapSuggestion } from '@/src/services/maps';

interface LocationAutosuggestProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: MapSuggestion) => void;
  compact?: boolean;
}

export function LocationAutosuggest({
  label,
  placeholder,
  value,
  onChange,
  onSelect,
  compact = false,
}: LocationAutosuggestProps) {
  const [suggestions, setSuggestions] = useState<MapSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (value.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const handle = window.setTimeout(async () => {
      try {
        const nextSuggestions = await suggestLocations(value.trim());
        if (!cancelled) {
          setSuggestions(nextSuggestions);
          setOpen(true);
        }
      } catch {
        if (!cancelled) {
          setSuggestions([]);
          setOpen(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [value]);

  return (
    <div className={`relative ${compact ? 'flex h-12 items-center gap-2 rounded-[13px] bg-white px-3' : 'min-w-0 flex-1 border-b border-slate-100 px-4 py-3 md:border-b-0 md:border-r'}`}>
      <MapPin className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} shrink-0 text-[#16A34A]`} />
      <div className="min-w-0 flex-1">
        <label className={`${compact ? 'text-[9px]' : 'text-[11px]'} font-black text-slate-900`} htmlFor={label}>
          {label}
        </label>
        <div className="mt-1 flex items-center gap-2">
          <input
            id={label}
            value={value}
            onChange={(event) => {
              onChange(event.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              if (suggestions.length) setOpen(true);
            }}
            onBlur={() => {
              window.setTimeout(() => setOpen(false), 120);
            }}
            placeholder={placeholder}
            className={`w-full bg-transparent outline-none ${compact ? 'text-[11px] font-black text-slate-900 placeholder:text-slate-400' : 'text-xs font-semibold text-slate-500 placeholder:text-slate-400'}`}
            autoComplete="off"
          />
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          ) : (
            <ChevronDown className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-slate-400`} />
          )}
        </div>
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              className="flex w-full items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(suggestion.label);
                onSelect?.(suggestion);
                setOpen(false);
              }}
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-black text-slate-900">{suggestion.label}</div>
                {suggestion.secondary && <div className="mt-1 text-[11px] font-semibold text-slate-500">{suggestion.secondary}</div>}
              </div>
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#16A34A]" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
