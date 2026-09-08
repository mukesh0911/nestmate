import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { localitiesByCity, flatTypes } from '@/lib/staticData';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useStore } from '@/store/useStore';
import {
  ArrowLeft, ArrowRight, Check, MapPin, Building2, User, Users,
  ShieldCheck, Sparkles, Home, Info, PlusCircle, CheckCircle2, Shield
} from 'lucide-react';

export default function OwnerOnboarding() {
  const navigate = useNavigate();
  const { user, profile: authProfile, refreshProfile } = useAuth();
  const { updateProfile } = useUserProfile();
  const { setCurrentRole } = useStore();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Owner Type
  const [ownerType, setOwnerType] = useState<'owner_flatmate' | 'landlord'>('owner_flatmate');

  // Step 2: Property Basics (Bangalore only)
  const [locality, setLocality] = useState('Koramangala');
  const [flatType, setFlatType] = useState('2 BHK');
  const [totalRooms, setTotalRooms] = useState('2');
  const [roomsToOffer, setRoomsToOffer] = useState('1');

  // Step 3: Household Expectations Preview
  const [genderPref, setGenderPref] = useState<'any' | 'female' | 'male'>('any');
  const [dietPref, setDietPref] = useState<'any' | 'veg'>('any');
  const [smokingPolicy, setSmokingPolicy] = useState<'no_smoking' | 'social_ok'>('no_smoking');
  const [petPolicy, setPetPolicy] = useState<'no_pets' | 'pets_ok'>('pets_ok');

  const bangaloreLocalities = localitiesByCity['Bengaluru'] || [
    'Koramangala', 'Indiranagar', 'HSR Layout', 'Whitefield', 'BTM Layout',
    'Bellandur', 'Marathahalli', 'Jayanagar', 'JP Nagar', 'Electronic City'
  ];

  const [ownerName, setOwnerName] = useState(authProfile?.name || '');

  // Populate from existing profile if present
  useEffect(() => {
    if (authProfile?.name) {
      setOwnerName(authProfile.name);
    }
    if (authProfile?.localities && authProfile.localities.length > 0) {
      setLocality(authProfile.localities[0]);
    }
    if ((authProfile as any)?.ownerType) {
      setOwnerType((authProfile as any).ownerType);
    }
  }, [authProfile]);

  const handleFinish = async (destination: 'listing' | 'dashboard' | 'verify') => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      setCurrentRole('owner');
      const finalName = ownerName.trim() || authProfile?.name?.trim() || user.displayName?.trim() || (user.email ? user.email.split('@')[0] : 'Property Owner');

      await updateProfile(user.uid, {
        name: finalName,
        role: 'owner',
        ownerType,
        city: 'Bengaluru',
        localities: [locality],
        propertyBasics: {
          locality,
          flatType,
          totalRooms: parseInt(totalRooms, 10) || 2,
          roomsToOffer: parseInt(roomsToOffer, 10) || 1,
        },
        householdExpectations: {
          genderPref,
          dietPref,
          smokingPolicy,
          petPolicy,
        },
        onboardingComplete: true,
      });

      await refreshProfile(user.uid);

      if (destination === 'listing') {
        // Carry property basics in navigation state to prefill OWN-01 wizard
        navigate('/edit-listing/new', {
          state: {
            prefill: {
              city: 'Bengaluru',
              locality,
              flatType,
              houseRules: [
                dietPref === 'veg' ? 'Veg kitchen only' : null,
                smokingPolicy === 'no_smoking' ? 'No smoking inside' : null,
                petPolicy === 'no_pets' ? 'No pets' : 'Pets friendly',
              ].filter(Boolean),
            }
          }
        });
      } else if (destination === 'verify') {
        navigate('/profile', { state: { openVerification: true } });
      } else {
        navigate('/owner-dashboard');
      }
    } catch (err: any) {
      console.error('Failed to complete owner onboarding:', err);
      setError(err.message || 'Failed to save onboarding. Please try again.');
      setLoading(false);
    }
  };

  const progressPercent = Math.round((step / 4) * 100);

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-between select-none">
      {/* Top Header & Progress */}
      <div className="w-full bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="w-full h-1 bg-gray-100 absolute top-0 left-0 z-30">
          <div
            className="h-full bg-brand-orange transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <header className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center relative z-20 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-orange flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900">Owner Setup</span>
              <span className="hidden sm:inline-block ml-2 text-xs text-ink/40">Step {step} of 4</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => handleFinish('dashboard')}
              className="text-xs text-ink/50 hover:text-ink font-medium transition-colors"
            >
              Save & Exit
            </button>
            <div className="text-sm font-medium">
              <span className="text-brand-orange font-bold">{progressPercent}%</span>{' '}
              <span className="text-gray-400">done</span>
            </div>
          </div>
        </header>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center pt-8 pb-16 px-4">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
          
          {/* STEP 1: OWNER TYPE */}
          {step === 1 && (
            <div>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-orange-50 rounded-2xl border border-orange-100 flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-brand-orange" />
                </div>
                <h2 className="type-h2 text-slate-900 mb-1">What type of owner are you?</h2>
                <p className="text-sm text-slate-500">
                  This sets how your listings and profile appear to flatmate seekers in Bangalore.
                </p>
              </div>

              <div className="mb-6">
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Your Name</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="input-nestmate w-full"
                />
              </div>

              <div className="space-y-4 mb-8">
                <div
                  onClick={() => setOwnerType('owner_flatmate')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    ownerType === 'owner_flatmate'
                      ? 'border-brand-orange bg-orange-50/50 shadow-xs'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                        <span>I live here & have a spare room</span>
                        <span className="text-[10px] bg-brand-orange/10 text-brand-orange px-2 py-0.5 rounded-full font-bold">
                          Live-in Flatmate
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Seekers see your lifestyle compatibility score and match with you as a fellow resident.
                      </p>
                    </div>
                    {ownerType === 'owner_flatmate' && (
                      <CheckCircle2 className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
                    )}
                  </div>
                </div>

                <div
                  onClick={() => setOwnerType('landlord')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    ownerType === 'landlord'
                      ? 'border-brand-orange bg-orange-50/50 shadow-xs'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                        <span>I own or manage the property</span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                          Landlord / Manager
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        List rooms for rent with transparent rent and house rules; prospective tenants apply directly.
                      </p>
                    </div>
                    {ownerType === 'landlord' && (
                      <CheckCircle2 className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full btn-fire py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: PROPERTY BASICS */}
          {step === 2 && (
            <div>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-orange-50 rounded-2xl border border-orange-100 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-brand-orange" />
                </div>
                <h2 className="type-h2 text-slate-900 mb-1">Where is your property located?</h2>
                <p className="text-sm text-slate-500">
                  NestMate currently operates exclusively across Bangalore neighborhoods.
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Bangalore Locality
                  </label>
                  <select
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="w-full input-nestmate text-sm font-medium"
                  >
                    {bangaloreLocalities.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Flat Configuration
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {flatTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFlatType(type)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                          flatType === type
                            ? 'border-brand-orange bg-orange-50 text-brand-orange'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Total Rooms
                    </label>
                    <select
                      value={totalRooms}
                      onChange={(e) => setTotalRooms(e.target.value)}
                      className="w-full input-nestmate text-sm"
                    >
                      <option value="1">1 Room</option>
                      <option value="2">2 Rooms</option>
                      <option value="3">3 Rooms</option>
                      <option value="4">4+ Rooms</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Rooms to Offer
                    </label>
                    <select
                      value={roomsToOffer}
                      onChange={(e) => setRoomsToOffer(e.target.value)}
                      className="w-full input-nestmate text-sm"
                    >
                      <option value="1">1 Room</option>
                      <option value="2">2 Rooms</option>
                      <option value="3">3 Rooms</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-3 border border-slate-200 rounded-2xl text-slate-600 font-semibold text-sm hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 btn-fire py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: HOUSEHOLD EXPECTATIONS PREVIEW */}
          {step === 3 && (
            <div>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-orange-50 rounded-2xl border border-orange-100 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-brand-orange" />
                </div>
                <h2 className="type-h2 text-slate-900 mb-1">Household Norms & Expectations</h2>
                <p className="text-sm text-slate-500">
                  Set baseline expectations shown on your listings so seekers can assess fit.
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Flatmate Gender Preference
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'any', label: 'Any Gender' },
                      { id: 'female', label: 'Female Only' },
                      { id: 'male', label: 'Male Only' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setGenderPref(item.id as any)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                          genderPref === item.id
                            ? 'border-brand-orange bg-orange-50 text-brand-orange'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Kitchen / Food Norms
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDietPref('any')}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                        dietPref === 'any'
                          ? 'border-brand-orange bg-orange-50 text-brand-orange'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      Non-veg Friendly
                    </button>
                    <button
                      type="button"
                      onClick={() => setDietPref('veg')}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                        dietPref === 'veg'
                          ? 'border-brand-orange bg-orange-50 text-brand-orange'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      Veg Kitchen Only
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Smoking
                    </label>
                    <button
                      type="button"
                      onClick={() => setSmokingPolicy(p => p === 'no_smoking' ? 'social_ok' : 'no_smoking')}
                      className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                        smokingPolicy === 'no_smoking'
                          ? 'border-slate-200 text-slate-700'
                          : 'border-brand-orange bg-orange-50 text-brand-orange'
                      }`}
                    >
                      {smokingPolicy === 'no_smoking' ? '🚭 No smoking' : '🚬 Smoking ok'}
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Pets
                    </label>
                    <button
                      type="button"
                      onClick={() => setPetPolicy(p => p === 'pets_ok' ? 'no_pets' : 'pets_ok')}
                      className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                        petPolicy === 'pets_ok'
                          ? 'border-brand-orange bg-orange-50 text-brand-orange'
                          : 'border-slate-200 text-slate-700'
                      }`}
                    >
                      {petPolicy === 'pets_ok' ? '🐾 Pets welcome' : '🚫 No pets'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-3 border border-slate-200 rounded-2xl text-slate-600 font-semibold text-sm hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 btn-fire py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: VERIFICATION EXPLAINER */}
          {step === 4 && (
            <div>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-teal/10 rounded-2xl border border-teal/20 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-teal" />
                </div>
                <h2 className="type-h2 text-slate-900 mb-1">Publishing Trust Standards</h2>
                <p className="text-sm text-slate-500">
                  NestMate keeps the marketplace 100% verified and free of broker spam.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-teal/20 flex items-center justify-center text-teal shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs text-slate-600">
                    <strong className="text-slate-900 block font-semibold mb-0.5">Proof of Identity & Property Control</strong>
                    Publishing an active room requires Tier 2 (Govt ID) or Tier 3 (Electricity bill / rental agreement).
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-teal/20 flex items-center justify-center text-teal shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs text-slate-600">
                    <strong className="text-slate-900 block font-semibold mb-0.5">Review Under 24 Hours</strong>
                    Our moderation team verifies submissions securely. Seekers only see verified trust badges, never your personal documents.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-teal/20 flex items-center justify-center text-teal shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs text-slate-600">
                    <strong className="text-slate-900 block font-semibold mb-0.5">Zero Brokerage & Masked Phone Numbers</strong>
                    Direct communication with prospective tenants inside NestMate chat. Phone numbers are revealed only upon mutual handshake.
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                  {error}
                </p>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => handleFinish('listing')}
                  disabled={loading}
                  className="w-full btn-fire py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      <span>Create Your First Listing</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleFinish('verify')}
                    disabled={loading}
                    className="py-2.5 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all text-center"
                  >
                    Verify Identity Now
                  </button>
                  <button
                    onClick={() => handleFinish('dashboard')}
                    disabled={loading}
                    className="py-2.5 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all text-center"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>

              <div className="mt-4 text-center">
                <Link to="/trust" className="text-xs text-slate-400 hover:text-brand-orange transition-colors underline">
                  Read more in the Trust & Safety Center
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
