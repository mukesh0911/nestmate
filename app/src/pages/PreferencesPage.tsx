import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';
import {
  Sliders, ArrowLeft, Check, Sparkles, AlertCircle, Save,
  Shield, Moon, Sun, Utensils, Wind, Wine, Heart, Users, Calendar, Wallet
} from 'lucide-react';

export default function PreferencesPage() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { updateProfile } = useUserProfile();

  const [saving, setSaving] = useState(false);

  // Must-Haves (Hard Filters)
  const [mustHaves, setMustHaves] = useState({
    genderRestricted: false,
    preferredGender: 'any',
    vegOnly: false,
    nonSmoking: false,
    noPets: false,
    nonDrinking: false,
  });

  // Nice-To-Haves (Soft Scoring Weights)
  const [softPrefs, setSoftPrefs] = useState({
    cleanliness: 'high',
    sleepSchedule: 'early',
    socialVibe: 'balanced',
    workMode: 'hybrid',
  });

  // Budget & Move-in
  const [budget, setBudget] = useState(15000);
  const [moveInDate, setMoveInDate] = useState('');
  const [matchAlerts, setMatchAlerts] = useState(false);

  // Hydrate from existing profile
  useEffect(() => {
    if (profile) {
      if (profile.budget) setBudget(profile.budget);
      if (profile.moveInDate) setMoveInDate(profile.moveInDate);
      
      const p = (profile as any).preferences;
      if (p) {
        if (p.mustHaves) setMustHaves(prev => ({ ...prev, ...p.mustHaves }));
        if (p.softPrefs) setSoftPrefs(prev => ({ ...prev, ...p.softPrefs }));
        if (typeof p.matchAlerts === 'boolean') setMatchAlerts(p.matchAlerts);
      }
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.uid, {
        budget,
        moveInDate,
        preferences: {
          mustHaves,
          softPrefs,
          matchAlerts,
          updatedAt: new Date().toISOString(),
        },
      });
      await refreshProfile(user.uid);
      toast.success('Preferences saved. Your matches are updating!');
      setTimeout(() => navigate(-1), 800);
    } catch (err: any) {
      console.error('Failed to update preferences:', err);
      toast.error(err.message || 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setMustHaves({
      genderRestricted: false,
      preferredGender: 'any',
      vegOnly: false,
      nonSmoking: false,
      noPets: false,
      nonDrinking: false,
    });
    toast.info('Preferences reset to defaults');
  };

  return (
    <div className="min-h-screen bg-parchment pb-24">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-100 py-4 px-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-brand-orange" />
            <h1 className="text-sm font-bold text-slate-900">Matching Preferences (PREF-01)</h1>
          </div>
          <button
            onClick={resetToDefaults}
            className="text-xs font-semibold text-slate-400 hover:text-brand-orange transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Intro Card */}
        <div className="bg-orange-50/70 border border-orange-200/60 rounded-2xl p-4">
          <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-orange" />
            Hard Dealbreakers vs. Soft Preferences
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Must-haves strictly eliminate incompatible listings from your discovery feed. Nice-to-haves guide the 0–100% weighted compatibility scoring.
          </p>
        </div>

        {/* SECTION 1: MUST-HAVES (HARD CONSTRAINTS) */}
        <div className="card-nestmate p-6">
          <div className="mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
              Hard Exclusion Filters
            </span>
            <h2 className="text-base font-bold text-slate-900 mt-2">Must-Have Dealbreakers</h2>
            <p className="text-xs text-slate-500">We will never show you listings or roommates violating these rules.</p>
          </div>

          <div className="space-y-4 divide-y divide-slate-100">
            {/* Veg Kitchen Only */}
            <div className="pt-3 first:pt-0 flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Strict Vegetarian Kitchen</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  {mustHaves.vegOnly ? '✓ We will only show vegetarian-only households' : 'Off: Non-veg friendly households will also appear'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={mustHaves.vegOnly}
                onChange={(e) => setMustHaves(m => ({ ...m, vegOnly: e.target.checked }))}
                className="w-4 h-4 rounded text-brand-orange focus:ring-brand-orange cursor-pointer mt-1"
              />
            </div>

            {/* Non-Smoking Household */}
            <div className="pt-3 flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Non-Smoking Household</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  {mustHaves.nonSmoking ? '✓ Eliminates flats where smoking is allowed' : 'Off: Social smokers will be ranked with lifestyle tags'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={mustHaves.nonSmoking}
                onChange={(e) => setMustHaves(m => ({ ...m, nonSmoking: e.target.checked }))}
                className="w-4 h-4 rounded text-brand-orange focus:ring-brand-orange cursor-pointer mt-1"
              />
            </div>

            {/* No Pets */}
            <div className="pt-3 flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Pet-Free Environment</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  {mustHaves.noPets ? '✓ Eliminates flats with dogs or cats' : 'Off: Homes with pets will remain visible'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={mustHaves.noPets}
                onChange={(e) => setMustHaves(m => ({ ...m, noPets: e.target.checked }))}
                className="w-4 h-4 rounded text-brand-orange focus:ring-brand-orange cursor-pointer mt-1"
              />
            </div>

            {/* Non-Drinking Household */}
            <div className="pt-3 flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Non-Drinking Flat</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  {mustHaves.nonDrinking ? '✓ Only shows flats strictly observing alcohol-free living' : 'Off: Normal social preferences apply'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={mustHaves.nonDrinking}
                onChange={(e) => setMustHaves(m => ({ ...m, nonDrinking: e.target.checked }))}
                className="w-4 h-4 rounded text-brand-orange focus:ring-brand-orange cursor-pointer mt-1"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: NICE-TO-HAVES (SOFT RANKING SCORING) */}
        <div className="card-nestmate p-6">
          <div className="mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal bg-teal/10 border border-teal/20 px-2 py-0.5 rounded-full">
              Scoring Weights
            </span>
            <h2 className="text-base font-bold text-slate-900 mt-2">Nice-To-Have Priorities</h2>
            <p className="text-xs text-slate-500">Profiles matching these receive higher percentage compatibility.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Cleanliness Standard</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'high', label: 'Strict / Daily' },
                  { id: 'medium', label: 'Moderate' },
                  { id: 'relaxed', label: 'Relaxed' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSoftPrefs(p => ({ ...p, cleanliness: opt.id }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      softPrefs.cleanliness === opt.id
                        ? 'border-teal bg-teal/10 text-teal'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Sleep & Quiet Hours</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'early', label: 'Early Bird (10 PM)' },
                  { id: 'night_owl', label: 'Night Owl (1 AM+)' },
                  { id: 'flexible', label: 'Flexible / Varied' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSoftPrefs(p => ({ ...p, sleepSchedule: opt.id }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      softPrefs.sleepSchedule === opt.id
                        ? 'border-teal bg-teal/10 text-teal'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Social Atmosphere</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'private', label: 'Quiet & Private' },
                  { id: 'balanced', label: 'Balanced' },
                  { id: 'social', label: 'Very Social' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSoftPrefs(p => ({ ...p, socialVibe: opt.id }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      softPrefs.socialVibe === opt.id
                        ? 'border-teal bg-teal/10 text-teal'
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

        {/* SECTION 3: BUDGET & MOVE-IN */}
        <div className="card-nestmate p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4">Budget & Timeline</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Max Monthly Budget</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(parseInt(e.target.value, 10) || 0)}
                  className="input-nestmate pl-8 text-sm font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Target Move-in Date</label>
              <input
                type="date"
                value={moveInDate}
                onChange={(e) => setMoveInDate(e.target.value)}
                className="input-nestmate text-sm font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <span className="text-xs text-slate-500 hidden sm:inline-block">
            Changes update matching weights across Bangalore listings
          </span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto ml-auto btn-fire py-3 px-8 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Update Preferences</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
