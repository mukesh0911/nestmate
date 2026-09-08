import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizQuestions, cities, localitiesByCity, professions } from '@/lib/staticData';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { calculateCompatibility } from '@/hooks/useMatches';
import { resolveEntityCoordinates } from '@/lib/locationResolver';
import { useStorage } from '@/hooks/useStorage';
import { useMatches } from '@/hooks/useMatches';
import {
  ArrowLeft, ArrowRight, Camera, Loader2,
  MapPin, Building2, User, Users, Calendar, Briefcase,
  Phone, Home, Wallet, Sparkles, ShieldCheck, Moon, MoonStar, Sun, Sunrise, Utensils, Wind, Wine, Heart,
  CheckCircle2, Check, MessageCircle, Cigarette, Laptop, PawPrint,
  Ban, Coffee, BedDouble, Salad, Drumstick, Leaf, Building, RefreshCw, PartyPopper, Smile, Frown, ThumbsUp
} from 'lucide-react';

// Sprint 5A: functional question icons are Lucide components — no emoji in UI chrome
const QUESTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  sleep_time: Moon, wake_time: Sun, food_pref: Utensils, smoking: Cigarette,
  drinking: Wine, guests: Home, cleanliness: Sparkles, work_mode: Laptop,
  pets: PawPrint, roommate_gender: Users,
};

// Sprint 6B: quiz option icons are Lucide components — no emoji in UI chrome
const OPTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  // sleep_time
  before_10: Moon, '10_to_12': MoonStar, after_12: Sparkles, varies: RefreshCw,
  // wake_time
  before_6: Sunrise, '6_to_8': Coffee, '8_to_10': Sun, after_10: BedDouble,
  // food_pref
  veg: Salad, non_veg: Drumstick, vegan: Leaf,
  // smoking / drinking
  never: Ban, outside: Wind, socially: Users, regularly: Cigarette, occasionally: Wine,
  // guests
  rarely: Home, sometimes: Users, often: PartyPopper, very_often: PartyPopper,
  // cleanliness
  very: Sparkles, somewhat: Smile, relaxed: Coffee, messy: Frown,
  // work_mode
  wfo: Building, wfh: Home, hybrid: RefreshCw, flexible: Calendar,
  // pets
  love: Heart, ok: ThumbsUp, no: Ban, allergic: Wind,
  // gender
  any: Users, female: User, male: User,
};

const getOptionIcon = (qId: string, optId: string): React.ComponentType<{ className?: string }> => {
  if (qId === 'food_pref' && optId === 'no_pref') return Utensils;
  if (qId === 'roommate_gender' && optId === 'no_pref') return Users;
  return OPTION_ICONS[optId] || CheckCircle2;
};

const GENDER_OPTIONS = [
  { id: 'female', label: 'Female', Icon: User },
  { id: 'male', label: 'Male', Icon: User },
  { id: 'other', label: 'Other / Prefer not to say', Icon: Users },
];

const CITY_SVG_ICONS: Record<string, React.ReactNode> = {
  'Chennai': (
    <svg className="w-7 h-7 stroke-[#ff5a36] fill-none stroke-[1.5] stroke-linecap-round stroke-linejoin-round" viewBox="0 0 24 24">
      <path d="M12 2v20M8 6l4-4 4 4M6 10l6-4 6 4M4 14l8-4 8 4M2 18l10-4 10 4M2 22h20" />
    </svg>
  ),
  'Bengaluru': (
    <svg className="w-7 h-7 stroke-[#ff5a36] fill-none stroke-[1.5] stroke-linecap-round stroke-linejoin-round" viewBox="0 0 24 24">
      <path d="M12 2a4 4 0 0 0-4 4v4H4v8h16v-8h-4V6a4 4 0 0 0-4-4z" />
      <path d="M12 2v4M8 10h8M12 14v4M10 18h4" />
      <path d="M2 22h20" />
    </svg>
  ),
  'Hyderabad': (
    <svg className="w-7 h-7 stroke-[#ff5a36] fill-none stroke-[1.5] stroke-linecap-round stroke-linejoin-round" viewBox="0 0 24 24">
      <path d="M4 22V6M20 22V6M4 10h16" />
      <path d="M8 22v-6a4 4 0 0 1 8 0v6" />
      <path d="M4 6l4-4M20 6l-4-4" />
      <path d="M2 22h20" />
    </svg>
  ),
  'Pune': (
    <svg className="w-7 h-7 stroke-[#ff5a36] fill-none stroke-[1.5] stroke-linecap-round stroke-linejoin-round" viewBox="0 0 24 24">
      <path d="M2 22h20" />
      <path d="M4 22v-8l4-4 4 4 4-4 4 4v8" />
      <path d="M10 22v-4h4v4" />
      <path d="M8 10V6M16 10V6" />
      <path d="M6 6h12" />
    </svg>
  ),
  'Mumbai': (
    <svg className="w-7 h-7 stroke-[#ff5a36] fill-none stroke-[1.5] stroke-linecap-round stroke-linejoin-round" viewBox="0 0 24 24">
      <path d="M2 22h20" />
      <path d="M4 22V4h4v6a4 4 0 0 0 8 0V4h4v18" />
      <path d="M12 10v12" />
      <path d="M6 4l-2-2M18 4l2-2" />
    </svg>
  ),
  'Delhi NCR': (
    <svg className="w-7 h-7 stroke-[#ff5a36] fill-none stroke-[1.5] stroke-linecap-round stroke-linejoin-round" viewBox="0 0 24 24">
      <path d="M2 22h20" />
      <path d="M6 22V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14" />
      <path d="M10 22v-6a2 2 0 0 1 4 0v6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
};

// All screens in order
type ScreenId =
  | 'photo' | 'name' | 'gender' | 'age' | 'profession'
  | 'city' | 'localities' | 'budget' | 'movein'
  | `quiz_${number}` | 'loading' | 'success';

export default function SeekerOnboarding() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const { updateProfile } = useUserProfile();
  const { uploadProfilePicture } = useStorage();
  const { findMatches } = useMatches();

  const [screenIndex, setScreenIndex] = useState(0);
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd');
  const [saving, setSaving] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [error, setError] = useState('');

  // Form state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [profession, setProfession] = useState('');
  const [city, setCity] = useState('');
  const [localities, setLocalities] = useState<string[]>([]);
  const [budget, setBudget] = useState(10000);
  const [moveIn, setMoveIn] = useState('');
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});

  const quizScreens: ScreenId[] = quizQuestions.map((_, i) => `quiz_${i}` as ScreenId);
  const SCREENS: ScreenId[] = [
    'photo', 'name', 'gender', 'age', 'profession',
    'city', 'localities', 'budget', 'movein',
    ...quizScreens,
    'loading', 'success',
  ];

  const totalInteractive = SCREENS.length - 2; // exclude loading + success
  const progress = Math.min(100, Math.round((screenIndex / totalInteractive) * 100));
  const currentScreen = SCREENS[screenIndex];

  const go = (delta: number) => {
    setError('');
    setDir(delta > 0 ? 'fwd' : 'back');
    setScreenIndex(i => i + delta);
  };

  const next = (validate?: () => string | null) => {
    if (validate) {
      const err = validate();
      if (err) { setError(err); return; }
    }
    go(1);
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }
  };

  const handleQuizAnswer = (questionId: string, answerId: string) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: answerId }));
    setTimeout(() => go(1), 250);
  };

  const handleFinish = async (answersOverride?: Record<string, string>) => {
    if (!user) return;
    setScreenIndex(SCREENS.indexOf('loading'));
    setSaving(true);
    setError('');
    const effectiveQuizAnswers = answersOverride || quizAnswers || {};
    try {
      const resolvedGeo = resolveEntityCoordinates({
        uid: user.uid,
        city,
        locality: localities?.[0],
        localities,
      });

      const parsedAge = parseInt(age, 10);
      const safeAge = isNaN(parsedAge) ? 0 : parsedAge;
      const parsedBudget = typeof budget === 'number' ? budget : parseInt(budget, 10);
      const safeBudget = isNaN(parsedBudget) ? 10000 : parsedBudget;

      await updateProfile(user.uid, {
        name: name.trim(),
        age: safeAge,
        gender: gender || '',
        profession: profession || '',
        city: city || '',
        localities: localities || [],
        budget: safeBudget,
        moveInDate: moveIn || '',
        quizAnswers: effectiveQuizAnswers,
        onboardingComplete: true,
        role: 'seeker',
        ...(resolvedGeo && { geoLocation: { lat: resolvedGeo.lat, lng: resolvedGeo.lng, formattedAddress: `${localities?.[0] || city}, ${city}` } }),
      });

      if (avatarFile) {
        try {
          const url = await uploadProfilePicture(avatarFile, user.uid, () => { });
          if (url) await updateProfile(user.uid, { avatar: url });
        } catch { /* non-blocking */ }
      }

      const updated = await refreshProfile(user.uid);
      if (updated) {
        try {
          const matches = await findMatches(updated, city);
          setMatchCount(matches.length);
        } catch { /* non-blocking */ }
      }

      setScreenIndex(SCREENS.indexOf('success'));
    } catch (err: any) {
      console.error("Finish error:", err);
      setError(err.message || 'Failed to save. Please try again.');
      setScreenIndex(SCREENS.indexOf('movein'));
    } finally {
      setSaving(false);
    }
  };

  // Render each screen
  const renderScreen = () => {
    if (currentScreen === 'loading') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <div className="relative w-20 h-20">
            <div className="w-20 h-20 rounded-full bg-fire/10 flex items-center justify-center animate-pulse-dot">
              <Home className="w-8 h-8 text-fire" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="type-h2 mb-2">Finding your matches…</h2>
            <p className="text-ink/50 text-sm">Analysing lifestyle compatibility</p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-fire animate-pulse-dot" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
        </div>
      );
    }

    if (currentScreen === 'success') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center px-4">
          <div className="w-20 h-20 rounded-full bg-teal/10 flex items-center justify-center animate-fade-up">
            <CheckCircle2 className="w-10 h-10 text-teal" />
          </div>
          <div>
            <h2 className="type-h1 mb-2">You're all set, {name.split(' ')[0]}!</h2>
            <p className="text-ink/60 text-base mb-1">
              We found <span className="font-bold text-fire text-xl">{matchCount}</span> compatible roommates for you.
            </p>
            <p className="text-ink/40 text-sm">Based on your lifestyle preferences and location</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 max-w-sm">
            {Object.entries(quizAnswers).slice(0, 5).map(([qId, ansId]) => {
              const q = quizQuestions.find(q => q.id === qId);
              const opt = q?.options.find(o => o.id === ansId);
              const BadgeIcon = getOptionIcon(qId, ansId);
              return opt ? (
                <span key={qId} className="badge-teal flex items-center gap-1">
                  <BadgeIcon className="w-3 h-3" /> {opt.label}
                </span>
              ) : null;
            })}
          </div>
          <button
            onClick={async () => {
              if (user?.uid) {
                try {
                  await updateProfile(user.uid, { onboardingComplete: true });
                  await refreshProfile(user.uid);
                } catch (e) {
                  console.error('Failed to set onboardingComplete on finish click', e);
                }
              }
              navigate('/dashboard', { replace: true });
            }}
            className="btn-fire text-base px-10 py-3.5 mt-2 cursor-pointer"
          >
            View My Matches →
          </button>
        </div>
      );
    }

    // Photo screen
    if (currentScreen === 'photo') return (
      // Sprint 6B truth fix: the "3× more connects" statistic was fabricated — no such measurement exists
      <Screen
        emoji="📸" title="Add your photo" subtitle="A clear photo helps others recognize and trust you"
        onNext={() => next()} nextLabel="Continue" onBack={null}
        error={error}
      >
        <div className="flex justify-center py-6">
          <label className="relative cursor-pointer group">
            <div className={`w-36 h-36 rounded-full overflow-hidden border-4 ${avatarPreview ? 'border-fire' : 'border-dashed border-ink/20'} transition-all flex items-center justify-center bg-cream/50`}>
              {avatarPreview
                ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                : <div className="text-center"><Camera className="w-8 h-8 text-ink/30 mx-auto mb-1" /><p className="text-xs text-ink/40">Upload photo</p></div>
              }
            </div>
            {avatarPreview && (
              <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
          </label>
        </div>
        {!avatarPreview && (
          <button onClick={() => go(1)} className="w-full text-sm text-ink/40 hover:text-ink/60 transition-colors py-2 flex items-center justify-center gap-1">
            Skip for now <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </Screen>
    );

    // Name screen
    if (currentScreen === 'name') return (
      <Screen
        emoji="👋" title="What's your name?" subtitle="This is how other users will see you"
        onNext={() => next(() => name.trim().length < 2 ? 'Please enter your full name' : null)}
        onBack={() => go(-1)} error={error}
      >
        <input
          type="text" value={name} onChange={e => { setName(e.target.value); setError(''); }}
          placeholder="Your full name"
          className="input-nestmate text-lg text-center font-medium tracking-wide mt-4"
          autoFocus
          onKeyDown={e => e.key === 'Enter' && next(() => name.trim().length < 2 ? 'Please enter your full name' : null)}
        />
      </Screen>
    );

    // Gender screen
    if (currentScreen === 'gender') return (
      <Screen
        emoji="🤝" title="I identify as…" subtitle="This helps us personalise your experience"
        onNext={() => next(() => !gender ? 'Please select an option' : null)}
        onBack={() => go(-1)} error={error}
      >
        <div className="space-y-3 mt-4">
          {GENDER_OPTIONS.map(opt => (
            <button key={opt.id} onClick={() => setGender(opt.id)}
              className={`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all ${gender === opt.id ? 'border-fire bg-fire/5' : 'border-border bg-white hover:border-fire/30'}`}>
              {/* Sprint 6B: Lucide icon replaces emoji */}
              <span className="w-10 h-10 rounded-xl bg-cream/70 flex items-center justify-center shrink-0 border border-border/60">
                <opt.Icon className="w-5 h-5 text-fire" />
              </span>
              <span className="font-medium">{opt.label}</span>
              {gender === opt.id && <Check className="ml-auto w-4 h-4 text-fire shrink-0" />}
            </button>
          ))}
        </div>
      </Screen>
    );

    // Age screen
    if (currentScreen === 'age') return (
      <Screen
        emoji="🎂" title="How old are you?" subtitle="Must be 18 or above to use NestMate"
        onNext={() => next(() => {
          const n = parseInt(age);
          return !age || isNaN(n) || n < 18 || n > 65 ? 'Please enter a valid age (18–65)' : null;
        })}
        onBack={() => go(-1)} error={error}
      >
        <input
          type="number" value={age} onChange={e => { setAge(e.target.value); setError(''); }}
          placeholder="Your age" min={18} max={65}
          className="input-nestmate text-lg text-center font-medium mt-4 w-40 mx-auto block"
          autoFocus
          onKeyDown={e => e.key === 'Enter' && next(() => {
            const n = parseInt(age);
            return !age || isNaN(n) || n < 18 || n > 65 ? 'Please enter a valid age (18–65)' : null;
          })}
        />
      </Screen>
    );

    // Profession screen
    if (currentScreen === 'profession') return (
      <Screen
        emoji="💼" title="What do you do?" subtitle="Helps match you with compatible lifestyles"
        onNext={() => next(() => !profession ? 'Please select a profession' : null)}
        onBack={() => go(-1)} error={error}
      >
        <div className="grid grid-cols-2 gap-2 mt-4">
          {professions.map(p => (
            <button key={p} onClick={() => setProfession(p)}
              className={`p-3 rounded-xl border-2 text-sm font-medium transition-all text-left ${profession === p ? 'border-fire bg-fire/5 text-fire' : 'border-border bg-white hover:border-fire/30'}`}>
              {p}
            </button>
          ))}
        </div>
      </Screen>
    );

    // City screen
    if (currentScreen === 'city') return (
      <Screen
        emoji="🏙️" title="Which city?" subtitle="We match you with room seekers in the same city"
        onNext={() => next(() => !city ? 'Please select a city' : null)}
        onBack={() => go(-1)} error={error}
      >
        <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          {cities.map(c => {
            const isSelected = city === c;
            return (
              <button
                type="button"
                key={c}
                aria-pressed={isSelected}
                aria-label={c}
                onClick={() => { setCity(c); setLocalities([]); }}
                className={`group relative bg-white border rounded-2xl p-4 flex items-center gap-4 cursor-pointer text-left transition-all duration-200 ${isSelected
                  ? 'border-brand-orange shadow-md bg-orange-50/20'
                  : 'border-slate-100 hover:border-brand-orange hover:shadow-sm'
                  }`}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-orange-100' : 'bg-orange-50 group-hover:bg-orange-100'
                  }`}>
                  {CITY_SVG_ICONS[c] || (
                    <svg className="w-7 h-7 stroke-brand-orange fill-none stroke-[1.5]" viewBox="0 0 24 24">
                      <path d="M4 22V6M20 22V6M4 10h16M2 22h20" />
                    </svg>
                  )}
                </div>
                <span className={`font-semibold text-lg transition-colors ${isSelected ? 'text-brand-orange font-bold' : 'text-slate-800 group-hover:text-brand-orange'
                  }`}>
                  {c}
                </span>
                <div className={`absolute inset-0 border-2 rounded-2xl pointer-events-none transition-all ${isSelected ? 'border-brand-orange' : 'border-transparent'
                  }`} />
              </button>
            );
          })}
        </div>
      </Screen>
    );

    // Localities screen
    if (currentScreen === 'localities') {
      const available = localitiesByCity[city] || [];
      return (
        <Screen
          emoji="📍" title="Preferred areas?" subtitle="Select up to 3 localities you'd like to live in"
          onNext={() => next(() => localities.length === 0 ? 'Please select at least one area' : null)}
          onBack={() => go(-1)} error={error}
        >
          <div className="flex flex-wrap gap-2 mt-4">
            {available.map(loc => {
              const sel = localities.includes(loc);
              return (
                <button key={loc} onClick={() => {
                  if (sel) setLocalities(l => l.filter(x => x !== loc));
                  else if (localities.length < 3) setLocalities(l => [...l, loc]);
                }}
                  className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${sel ? 'border-fire bg-fire text-white' : 'border-border bg-white hover:border-fire/30'}`}>
                  {loc}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-ink/40 mt-3">{localities.length}/3 selected</p>
        </Screen>
      );
    }

    // Budget screen
    if (currentScreen === 'budget') return (
      <Screen
        emoji="💰" title="Monthly budget?" subtitle="Your share of rent per month"
        onNext={() => next()} onBack={() => go(-1)} error={error}
      >
        <div className="mt-8 space-y-6">
          <div className="text-center">
            {/* Sprint 6B: functional numbers use the sans voice — no italic serif */}
            <span className="text-5xl font-bold text-fire">₹{budget.toLocaleString()}</span>
            <span className="text-ink/40 text-sm ml-1">/month</span>
          </div>
          <input
            type="range" min={3000} max={40000} step={1000} value={budget}
            onChange={e => setBudget(parseInt(e.target.value))}
            className="w-full accent-fire"
          />
          <div className="flex justify-between text-xs text-ink/40">
            <span>₹3,000</span><span>₹40,000</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[6000, 10000, 15000].map(b => (
              <button key={b} onClick={() => setBudget(b)}
                className={`py-2 rounded-xl border text-sm font-medium transition-all ${budget === b ? 'border-fire bg-fire/5 text-fire' : 'border-border hover:border-fire/30'}`}>
                ₹{(b / 1000)}k
              </button>
            ))}
          </div>
        </div>
      </Screen>
    );

    // Move-in date
    if (currentScreen === 'movein') return (
      <Screen
        emoji="📅" title="When to move in?" subtitle="Approximate date is fine"
        onNext={() => next(() => !moveIn ? 'Please select a date' : null)}
        onBack={() => go(-1)} error={error}
        nextLabel="Almost there!"
      >
        <input
          type="date" value={moveIn} onChange={e => { setMoveIn(e.target.value); setError(''); }}
          min={new Date().toISOString().split('T')[0]}
          className="input-nestmate text-center mt-6 text-base"
        />
        <div className="flex flex-wrap gap-2 mt-4">
          {['ASAP', '1 Month', '2 Months', '3 Months'].map(label => {
            const d = new Date();
            if (label === 'ASAP') d.setDate(d.getDate() + 3);
            else d.setMonth(d.getMonth() + parseInt(label));
            const val = d.toISOString().split('T')[0];
            return (
              <button key={label} onClick={() => setMoveIn(val)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${moveIn === val ? 'border-fire bg-fire/10 text-fire' : 'border-border hover:border-fire/30'}`}>
                {label}
              </button>
            );
          })}
        </div>
      </Screen>
    );

    // Quiz screens
    if (currentScreen.startsWith('quiz_')) {
      const idx = parseInt(currentScreen.split('_')[1]);
      const q = quizQuestions[idx];
      const answered = quizAnswers[q.id];
      const isLast = idx === quizQuestions.length - 1;

      return (
        <div className="animate-fade-up">
          <div className="text-center mb-8">
            <div className="relative inline-block mb-3">
              <div className="absolute inset-0 bg-fire/20 rounded-2xl blur-lg animate-pulse" />
              <div className="w-16 h-16 bg-white rounded-2xl border border-border flex items-center justify-center transition-colors duration-200">
                {(() => {
                  const QIcon = QUESTION_ICONS[q.id] || MessageCircle;
                  return <QIcon className="w-7 h-7 text-fire" />;
                })()}
              </div>
            </div>
            <h2 className="type-h2 mb-2">{q.question}</h2>
            <p className="text-xs text-ink/50 bg-white/80 border border-border/60 px-3 py-1.5 rounded-full inline-block shadow-2xs">{q.why}</p>
          </div>

          <div className="space-y-3">
            {q.options.map(opt => {
              const OptIcon = getOptionIcon(q.id, opt.id);
              const selected = answered === opt.id;
              return (
                <button key={opt.id} onClick={() => {
                  const nextAnswers = { ...quizAnswers, [q.id]: opt.id };
                  setQuizAnswers(nextAnswers);
                  if (isLast) {
                    handleFinish(nextAnswers);
                  } else {
                    handleQuizAnswer(q.id, opt.id);
                  }
                }}
                  className={`w-full p-3.5 rounded-2xl border-2 text-left flex items-center gap-3.5 transition-all ${selected ? 'border-fire bg-fire/5 font-semibold text-fire shadow-xs' : 'border-border bg-white hover:border-fire/30'
                    }`}>
                  <span className="w-10 h-10 rounded-xl bg-cream/70 flex items-center justify-center shrink-0 border border-border/60 shadow-2xs">
                    <OptIcon className="w-5 h-5 text-fire" />
                  </span>
                  <span className="text-sm font-medium flex-1">{opt.label}</span>
                  {selected && <div className="w-5 h-5 rounded-full bg-fire text-white flex items-center justify-center"><Check className="w-3 h-3" /></div>}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-6">
            <button onClick={() => go(-1)} className="text-sm text-ink/40 hover:text-ink/60 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <span className="text-xs text-ink/30">Question {idx + 1} of {quizQuestions.length}</span>
          </div>
        </div>
      );
    }

    return null;
  };

  if (currentScreen === 'success' || currentScreen === 'loading') {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {renderScreen()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-between select-none">
      {/* Top Progress & Header */}
      <div className="w-full bg-white border-b border-gray-100 sticky top-0 z-50">
        {/* Progress Bar */}
        <div className="w-full h-1 bg-gray-100 absolute top-0 left-0 z-30">
          <div className="h-full bg-brand-orange transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <header className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center relative z-20 bg-white">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-orange flex items-center justify-center text-white shadow-xs">
              <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">NestMate Setup</span>
          </div>
          {/* Progress Text */}
          <div className="text-sm font-medium">
            <span className="text-brand-orange font-bold">{progress}%</span> <span className="text-gray-400">complete</span>
          </div>
        </header>
      </div>

      {/* Main Form Content */}
      <div className="flex-1 flex items-center justify-center pt-24 pb-12 px-4">
        <div className="w-full max-w-md">
          {renderScreen()}
        </div>
      </div>
    </div>
  );
}

const EMOJI_TO_LUCIDE: Record<string, any> = {
  '📍': MapPin,
  '🏙️': Building2,
  '👋': User,
  '🤝': Users,
  '👩': User,
  '👨': User,
  '🎂': Calendar,
  '💼': Briefcase,
  '📞': Phone,
  '🏠': Home,
  '🛋️': Home,
  '💰': Wallet,
  '👥': Users,
  '📷': Camera,
  '✨': Sparkles,
  '📅': Calendar,
  '📜': ShieldCheck,
  '🌙': Moon,
  '☀️': Sun,
  '🍽️': Utensils,
  '🚭': Wind,
  '🥂': Wine,
  '💻': Briefcase,
  '🐾': Heart,
  '💬': Sparkles,
};

// ─── Reusable Screen wrapper matching screenshot design ───────────────────────
function Screen({
  emoji, title, subtitle, children, onNext, onBack, nextLabel = 'Continue', error,
}: {
  emoji: string; title: string; subtitle: string; children: React.ReactNode;
  onNext: () => void; onBack: (() => void) | null; nextLabel?: string; error?: string;
}) {
  const IconComp = EMOJI_TO_LUCIDE[emoji] || MapPin;
  return (
    <div className="animate-fade-up max-w-md mx-auto w-full">
      <div className="text-center mb-6">
        {/* Step badge — Sprint 6B: restrained elevation, no decorative glow/scale */}
        <div className="w-20 h-20 bg-white rounded-3xl border border-orange-100 flex items-center justify-center shadow-card mb-5 mx-auto">
          <IconComp className="w-9 h-9 text-brand-orange" />
        </div>

        {/* Title */}
        {/* Sprint 5B: sans voice for ordinary headings */}
        <h2 className="type-h2 text-slate-900 text-center mb-2">
          {title}
        </h2>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-slate-500 font-normal text-center max-w-sm mx-auto leading-relaxed">
          {subtitle}
        </p>
      </div>

      {children}

      {error && (
        <p className="text-xs sm:text-sm text-red-500 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mt-4 text-center font-medium">
          {error}
        </p>
      )}

      {/* Primary Continue Button */}
      <button
        type="button"
        onClick={onNext}
        className="w-full bg-brand-orange hover:bg-orange-600 active:scale-[0.98] text-white font-bold text-sm sm:text-base py-4 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-orange-500/25 transition-all cursor-pointer mt-6"
      >
        <span>{nextLabel}</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      {/* Back Link */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="w-full mt-3 text-xs sm:text-sm font-semibold text-slate-400 hover:text-slate-700 flex items-center justify-center gap-1.5 py-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      )}
    </div>
  );
}
