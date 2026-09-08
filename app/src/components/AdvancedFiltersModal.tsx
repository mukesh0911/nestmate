import { useState, useMemo } from 'react';
import { X, RotateCcw, Check, Sparkles, Filter } from 'lucide-react';
import { amenitiesList } from '@/lib/staticData';

export interface AdvancedFilterState {
  dietary: string;
  smoking: string;
  alcohol: string;
  sleepSchedule: string;
  petPolicy: string;
  furnishing: string;
  amenities: string[];
  bachelorsFriendly: boolean;
  guestsAllowed: string;
  moveInWindow: string;
  highMatchOnly: boolean; // 70%+ compatibility cut
}

export const DEFAULT_ADVANCED_FILTERS: AdvancedFilterState = {
  dietary: 'any',
  smoking: 'any',
  alcohol: 'any',
  sleepSchedule: 'any',
  petPolicy: 'any',
  furnishing: 'any',
  amenities: [],
  bachelorsFriendly: false,
  guestsAllowed: 'any',
  moveInWindow: 'any',
  highMatchOnly: false,
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  filters: AdvancedFilterState;
  onApply: (updated: AdvancedFilterState) => void;
  totalResultsCount: number;
}

export default function AdvancedFiltersModal({
  isOpen,
  onClose,
  filters: initialFilters,
  onApply,
  totalResultsCount,
}: Props) {
  const [draft, setDraft] = useState<AdvancedFilterState>({ ...initialFilters });

  if (!isOpen) return null;

  const toggleAmenity = (amenity: string) => {
    setDraft(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleReset = () => {
    setDraft({ ...DEFAULT_ADVANCED_FILTERS });
  };

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-brand-orange flex items-center justify-center">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Advanced Filters</h2>
              <span className="text-[10px] text-slate-400">DISC-02 · Dealbreaker Configuration</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-slate-400 hover:text-brand-orange flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Filters Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Compatibility Cut */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-brand-orange" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">High Compatibility Only</span>
                <span className="text-[11px] text-slate-600">Only show flatmates & rooms with 70%+ score</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDraft(d => ({ ...d, highMatchOnly: !d.highMatchOnly }))}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                draft.highMatchOnly ? 'bg-brand-orange' : 'bg-slate-300'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  draft.highMatchOnly ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* 1. LIFESTYLE DEALS */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Lifestyle & Dietary Norms
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">Dietary Household</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'any', label: 'Any' },
                    { id: 'veg', label: 'Veg Only' },
                    { id: 'non_veg', label: 'Non-Veg Ok' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDraft(d => ({ ...d, dietary: opt.id }))}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        draft.dietary === opt.id
                          ? 'border-brand-orange bg-orange-50 text-brand-orange'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">Smoking Habits</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'any', label: 'Any' },
                    { id: 'never', label: 'Non-Smoker' },
                    { id: 'socially', label: 'Social Ok' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDraft(d => ({ ...d, smoking: opt.id }))}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        draft.smoking === opt.id
                          ? 'border-brand-orange bg-orange-50 text-brand-orange'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">Pet Policy</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'any', label: 'Any' },
                    { id: 'pets_ok', label: 'Pets Allowed' },
                    { id: 'no_pets', label: 'No Pets' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDraft(d => ({ ...d, petPolicy: opt.id }))}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        draft.petPolicy === opt.id
                          ? 'border-brand-orange bg-orange-50 text-brand-orange'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. ROOM & FURNISHING */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Furnishing & Amenities
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">Furnishing State</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'any', label: 'Any' },
                    { id: 'Fully Furnished', label: 'Full' },
                    { id: 'Semi-Furnished', label: 'Semi' },
                    { id: 'Unfurnished', label: 'None' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDraft(d => ({ ...d, furnishing: opt.id }))}
                      className={`py-2 px-1 rounded-xl border text-xs font-semibold transition-all text-center ${
                        draft.furnishing === opt.id
                          ? 'border-brand-orange bg-orange-50 text-brand-orange'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">Required Amenities</label>
                <div className="flex flex-wrap gap-1.5">
                  {amenitiesList.slice(0, 10).map(amenity => {
                    const isSelected = draft.amenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleAmenity(amenity)}
                        className={`py-1.5 px-2.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1 ${
                          isSelected
                            ? 'border-teal bg-teal/10 text-teal font-semibold'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{amenity}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 3. BUILDING NORMS */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Building Norms & Guests
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Bachelor Friendly</span>
                  <span className="text-[11px] text-slate-500">Explicitly allows students and working bachelors</span>
                </div>
                <input
                  type="checkbox"
                  checked={draft.bachelorsFriendly}
                  onChange={(e) => setDraft(d => ({ ...d, bachelorsFriendly: e.target.checked }))}
                  className="w-4 h-4 rounded text-brand-orange focus:ring-brand-orange cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">Guest Policy</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'any', label: 'Any' },
                    { id: 'allowed', label: 'Guests Ok' },
                    { id: 'no_overnight', label: 'No Overnight' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDraft(d => ({ ...d, guestsAllowed: opt.id }))}
                      className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all text-center ${
                        draft.guestsAllowed === opt.id
                          ? 'border-brand-orange bg-orange-50 text-brand-orange'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Apply Button Bar */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            Matching listings: <strong className="text-slate-900 text-sm font-bold">{totalResultsCount}</strong>
          </div>
          <button
            type="button"
            onClick={handleApply}
            className="btn-fire py-2.5 px-6 rounded-xl font-bold text-sm shadow-md"
          >
            Show Results
          </button>
        </div>
      </div>
    </div>
  );
}
