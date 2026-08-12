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
  ArrowLeft, Camera, Loader2,
  MapPin, Building2, User, Users, Calendar, Briefcase,
  Phone, Home, Wallet, Sparkles, ShieldCheck, Moon, Sun, Utensils, Wind, Wine, Heart
} from 'lucide-react';

// Question emoji map
const QUESTION_ICONS: Record<string, string> = {
  sleep_time: '🌙', wake_time: '☀️', food_pref: '🍽️', smoking: '🚭',
  drinking: '🥂', guests: '🏠', cleanliness: '✨', work_mode: '💻',
  pets: '🐾', roommate_gender: '👥',
};

const OPTION_ICONS: Record<string, string> = {
  // sleep_time
  before_10: '🌙', '10_to_12': '😴', after_12: '🦉', varies: '🔄',
  // wake_time
  before_6: '🌅', '6_to_8': '☕', '8_to_10': '🌤️', after_10: '🛌',
  // food_pref
  veg: '🥗', non_veg: '🍗', vegan: '🌱',
  // smoking / drinking
  never: '❌', outside: '💨', socially: '👯', regularly: '🚬', occasionally: '🥃',
  // guests
  rarely: '🏡', sometimes: '👫', often: '🎉', very_often: '🥳',
  // cleanliness
  very: '🧹', somewhat: '😊', relaxed: '😌', messy: '😅',
  // work_mode
  wfo: '🏢', wfh: '🏠', hybrid: '🔄', flexible: '📅',
  // pets
  love: '❤️', ok: '👍', no: '🚫', allergic: '🤧',
  // gender
  any: '💫', female: '👩', male: '👨',
};

const getOptionIcon = (qId: string, optId: string) => {
  if (qId === 'food_pref' && optId === 'no_pref') return '🍜';
  if (qId === 'roommate_gender' && optId === 'no_pref') return '🤝';
  return OPTION_ICONS[optId] || '✅';
};

const GENDER_OPTIONS = [
  { id: 'female', label: 'Female', icon: '👩' },
  { id: 'male', label: 'Male', icon: '👨' },
  { id: 'other', label: 'Other / Prefer not to say', icon: '🤝' },
];

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

  const handleFinish = async () => {
    if (!user) return;
    setScreenIndex(SCREENS.indexOf('loading'));
    setSaving(true);
    setError('');
    try {
      const resolvedGeo = resolveEntityCoordinates({
        uid: user.uid,
        city,
        locality: localities?.[0],
        localities,
      });

      await updateProfile(user.uid, {
        name: name.trim(),
        age: parseInt(age),
        gender,
        profession,
        city,
        localities,
        budget,
        moveInDate: moveIn,
        quizAnswers,
        onboardingComplete: true,
        role: 'seeker',
        ...(resolvedGeo && { geoLocation: { lat: resolvedGeo.lat, lng: resolvedGeo.lng, formattedAddress: `${localities?.[0] || city}, ${city}` } }),
      });

      if (avatarFile) {
        try {
          const url = await uploadProfilePicture(avatarFile, user.uid, () => {});
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
            <div className="w-20 h-20 rounded-full bg-fire/10 flex items-center justify-center animate-pulse">
              <span className="text-4xl">🏠</span>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-display italic mb-2">Finding your matches…</h2>
            <p className="text-ink/50 text-sm">Analysing lifestyle compatibility</p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-fire animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
        </div>
      );
    }

    if (currentScreen === 'success') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center px-4">
          <div className="text-6xl animate-bounce">🎉</div>
          <div>
            <h2 className="text-3xl font-display italic mb-2">You're all set, {name.split(' ')[0]}!</h2>
            <p className="text-ink/60 text-base mb-1">
              We found <span className="font-bold text-fire text-xl">{matchCount}</span> compatible roommates for you.
            </p>
            <p className="text-ink/40 text-sm">Based on your lifestyle preferences and location</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 max-w-sm">
            {Object.entries(quizAnswers).slice(0, 5).map(([qId, ansId]) => {
              const q = quizQuestions.find(q => q.id === qId);
              const opt = q?.options.find(o => o.id === ansId);
              const icon = getOptionIcon(qId, ansId);
              return opt ? (
                <span key={qId} className="badge-teal flex items-center gap-1">
                  {icon} {opt.label}
                </span>
              ) : null;
            })}
          </div>
          <button
            onClick={() => { window.location.href = '/dashboard'; }}
            className="btn-fire text-base px-10 py-3.5 mt-2"
          >
            View My Matches →
          </button>
        </div>
      );
    }

    // Photo screen
    if (currentScreen === 'photo') return (
      <Screen
        emoji="📸" title="Add your photo" subtitle="Profiles with photos get 3× more connects"
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
          <button onClick={() => go(1)} className="w-full text-sm text-ink/40 hover:text-ink/60 transition-colors py-2">
            Skip for now →
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
              <span className="text-2xl">{opt.icon}</span>
              <span className="font-medium">{opt.label}</span>
              {gender === opt.id && <span className="ml-auto text-fire">✓</span>}
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
        emoji="🏙️" title="Which city?" subtitle="We'll show you matches in your city"
        onNext={() => next(() => !city ? 'Please select a city' : null)}
        onBack={() => go(-1)} error={error}
      >
        <div className="grid grid-cols-2 gap-3 mt-4">
          {cities.map(c => (
            <button key={c} onClick={() => { setCity(c); setLocalities([]); }}
              className={`p-4 rounded-2xl border-2 font-medium transition-all text-sm ${city === c ? 'border-fire bg-fire/5 text-fire' : 'border-border bg-white hover:border-fire/30'}`}>
              {c}
            </button>
          ))}
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
            <span className="text-5xl font-display italic text-fire">₹{budget.toLocaleString()}</span>
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
              <div className="w-16 h-16 relative bg-white/90 backdrop-blur-md rounded-2xl border border-fire/30 shadow-md flex items-center justify-center text-3xl transition-all duration-300 hover:scale-105">
                <span className="drop-shadow-xs">{QUESTION_ICONS[q.id] || '💬'}</span>
              </div>
            </div>
            <h2 className="text-2xl font-display italic mb-2">{q.question}</h2>
            <p className="text-xs text-ink/50 bg-white/80 border border-border/60 px-3 py-1.5 rounded-full inline-block shadow-2xs">{q.why}</p>
          </div>

          <div className="space-y-3">
            {q.options.map(opt => {
              const icon = getOptionIcon(q.id, opt.id);
              const selected = answered === opt.id;
              return (
                <button key={opt.id} onClick={() => {
                    if (isLast) {
                      setQuizAnswers(prev => ({ ...prev, [q.id]: opt.id }));
                      handleFinish();
                    } else {
                      handleQuizAnswer(q.id, opt.id);
                    }
                  }}
                  className={`w-full p-3.5 rounded-2xl border-2 text-left flex items-center gap-3.5 transition-all ${
                    selected ? 'border-fire bg-fire/5 font-semibold text-fire shadow-xs' : 'border-border bg-white hover:border-fire/30'
                  }`}>
                  <span className="w-10 h-10 rounded-xl bg-cream/70 flex items-center justify-center text-xl shrink-0 border border-border/60 shadow-2xs">
                    {icon}
                  </span>
                  <span className="text-sm font-medium flex-1">{opt.label}</span>
                  {selected && <div className="w-5 h-5 rounded-full bg-fire text-white flex items-center justify-center text-xs">✓</div>}
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
    <div className="min-h-screen bg-parchment flex flex-col">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-parchment/90 backdrop-blur-sm border-b border-border">
        <div className="h-1 bg-border">
          <div className="h-full bg-gradient-to-r from-fire to-amber-400 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg gradient-fire flex items-center justify-center">
              <span className="text-white text-xs font-bold">N</span>
            </div>
            <span className="text-xs font-semibold text-ink/50">NestMate</span>
          </div>
          <span className="text-xs text-ink/40 font-medium">{progress}% complete</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center pt-20 pb-12 px-4">
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

// ─── Reusable Screen wrapper ──────────────────────────────────────────────────
function Screen({
  emoji, title, subtitle, children, onNext, onBack, nextLabel = 'Continue', error,
}: {
  emoji: string; title: string; subtitle: string; children: React.ReactNode;
  onNext: () => void; onBack: (() => void) | null; nextLabel?: string; error?: string;
}) {
  const IconComp = EMOJI_TO_LUCIDE[emoji] || MapPin;
  return (
    <div className="animate-fade-up">
      <div className="text-center mb-6">
        <div className="relative inline-block mb-3">
          <div className="absolute inset-0 bg-fire/20 rounded-2xl blur-lg animate-pulse" />
          <div className="w-16 h-16 relative bg-white/95 backdrop-blur-md rounded-2xl border-2 border-fire/30 shadow-md flex items-center justify-center transition-all duration-300 hover:scale-105">
            <IconComp className="w-8 h-8 text-fire" />
          </div>
        </div>
        <h2 className="text-2xl font-display italic mb-1">{title}</h2>
        <p className="text-sm text-ink/50">{subtitle}</p>
      </div>

      {children}

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mt-4 text-center">
          {error}
        </p>
      )}

      <button onClick={onNext} className="w-full btn-fire mt-6 py-3.5 text-base font-semibold">
        {nextLabel} →
      </button>

      {onBack && (
        <button onClick={onBack} className="w-full mt-3 text-sm text-ink/40 hover:text-ink/60 flex items-center justify-center gap-1 py-2 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      )}
    </div>
  );
}
