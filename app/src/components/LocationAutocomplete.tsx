import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Search, X } from 'lucide-react';

export interface LocationOption {
  display_name: string;
  lat: string;
  lon: string;
  locality?: string;
  city?: string;
  state?: string;
}

interface LocationAutocompleteProps {
  value?: string;
  onChange: (value: string, coords?: { lat: number; lng: number; locality?: string; city?: string }) => void;
  placeholder?: string;
  className?: string;
  defaultCity?: string;
}

// Top Indian hub fallback options for instant zero-latency suggestions
const TOP_INDIAN_LOCALITIES = [
  { display_name: 'HSR Layout, Bengaluru, Karnataka', lat: '12.9121', lon: '77.6446', locality: 'HSR Layout', city: 'Bengaluru' },
  { display_name: 'Koramangala 4th Block, Bengaluru, Karnataka', lat: '12.9352', lon: '77.6245', locality: 'Koramangala', city: 'Bengaluru' },
  { display_name: 'Indiranagar 100ft Road, Bengaluru, Karnataka', lat: '12.9784', lon: '77.6408', locality: 'Indiranagar', city: 'Bengaluru' },
  { display_name: 'Whitefield ITPL, Bengaluru, Karnataka', lat: '12.9698', lon: '77.7499', locality: 'Whitefield', city: 'Bengaluru' },
  { display_name: 'Bandra West, Mumbai, Maharashtra', lat: '19.0596', lon: '72.8295', locality: 'Bandra', city: 'Mumbai' },
  { display_name: 'Andheri West, Mumbai, Maharashtra', lat: '19.1197', lon: '72.8464', locality: 'Andheri West', city: 'Mumbai' },
  { display_name: 'Powai Lake Road, Mumbai, Maharashtra', lat: '19.1176', lon: '72.9060', locality: 'Powai', city: 'Mumbai' },
  { display_name: 'Cyber City Phase 2, Gurugram, Delhi-NCR', lat: '28.4950', lon: '77.0895', locality: 'Cyber City', city: 'Gurugram' },
  { display_name: 'Connaught Place, New Delhi', lat: '28.6315', lon: '77.2167', locality: 'Connaught Place', city: 'Delhi' },
  { display_name: 'Gachibowli Financial District, Hyderabad, Telangana', lat: '17.4401', lon: '78.3489', locality: 'Gachibowli', city: 'Hyderabad' },
  { display_name: 'Hitech City, Hyderabad, Telangana', lat: '17.4435', lon: '78.3772', locality: 'Hitech City', city: 'Hyderabad' },
  { display_name: 'Viman Nagar, Pune, Maharashtra', lat: '18.5679', lon: '73.9143', locality: 'Viman Nagar', city: 'Pune' },
  { display_name: 'Kothrud, Pune, Maharashtra', lat: '18.5074', lon: '73.8077', locality: 'Kothrud', city: 'Pune' },
];

export default function LocationAutocomplete({
  value = '',
  onChange,
  placeholder = 'Search locality or city in India...',
  className = '',
  defaultCity = 'Bengaluru',
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync external value
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced API search via Nominatim
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // Query OpenStreetMap Nominatim with India bias
        const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query + ', India'
        )}&addressdetails=1&limit=6&countrycodes=in`;
        
        const res = await fetch(searchUrl, {
          headers: { 'Accept-Language': 'en-US,en' },
        });

        if (res.ok) {
          const data: any[] = await res.json();
          const parsedSuggestions: LocationOption[] = data.map((item) => {
            const addr = item.address || {};
            const locality = addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.city_district || addr.town || item.name;
            const city = addr.city || addr.town || addr.state_district || addr.county || defaultCity;
            return {
              display_name: item.display_name,
              lat: item.lat,
              lon: item.lon,
              locality: locality,
              city: city,
              state: addr.state,
            };
          });

          // Combine API results with local fallback matches if list is short
          if (parsedSuggestions.length > 0) {
            setSuggestions(parsedSuggestions);
          } else {
            const filteredLocal = TOP_INDIAN_LOCALITIES.filter((loc) =>
              loc.display_name.toLowerCase().includes(query.toLowerCase())
            );
            setSuggestions(filteredLocal);
          }
        } else {
          // Fallback to offline top Indian localities
          const filteredLocal = TOP_INDIAN_LOCALITIES.filter((loc) =>
            loc.display_name.toLowerCase().includes(query.toLowerCase())
          );
          setSuggestions(filteredLocal);
        }
      } catch (err) {
        // Fallback filter
        const filteredLocal = TOP_INDIAN_LOCALITIES.filter((loc) =>
          loc.display_name.toLowerCase().includes(query.toLowerCase())
        );
        setSuggestions(filteredLocal);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, defaultCity]);

  const handleSelect = (option: LocationOption) => {
    setQuery(option.display_name);
    setIsOpen(false);
    onChange(option.display_name, {
      lat: parseFloat(option.lat),
      lng: parseFloat(option.lon),
      locality: option.locality,
      city: option.city,
    });
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    onChange('', undefined);
  };

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <MapPin className="absolute left-3 w-4 h-4 text-fire shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            onChange(e.target.value);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2.5 bg-cream/50 border border-ink/10 rounded-xl text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-fire/30 focus:border-fire transition-all"
        />
        {loading ? (
          <Loader2 className="absolute right-3 w-4 h-4 text-fire animate-spin shrink-0" />
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-0.5 text-ink/40 hover:text-ink transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <Search className="absolute right-3 w-3.5 h-3.5 text-ink/30 shrink-0" />
        )}
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (suggestions.length > 0 || TOP_INDIAN_LOCALITIES.length > 0) && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-parchment border border-ink/10 rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1.5 bg-cream/70 border-b border-ink/5 flex items-center justify-between text-[10px] font-semibold text-ink/40 uppercase tracking-wider">
            <span>Location Suggestions</span>
            <span>India</span>
          </div>

          {(suggestions.length > 0
            ? suggestions
            : TOP_INDIAN_LOCALITIES.filter((loc) =>
                query ? loc.display_name.toLowerCase().includes(query.toLowerCase()) : true
              ).slice(0, 5)
          ).map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full text-left px-3.5 py-2.5 hover:bg-fire-light/60 transition-colors border-b border-ink/5 last:border-0 flex items-start gap-2.5 group"
            >
              <MapPin className="w-3.5 h-3.5 text-fire mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-ink truncate group-hover:text-fire transition-colors">
                  {item.locality || item.display_name.split(',')[0]}
                </p>
                <p className="text-[10px] text-ink/50 truncate">{item.display_name}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
