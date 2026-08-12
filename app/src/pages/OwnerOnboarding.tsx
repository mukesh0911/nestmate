import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cities, localitiesByCity, flatTypes, furnishingTypes, amenitiesList, houseRulesList, professions, genderOptions } from '@/lib/staticData';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useListings } from '@/hooks/useListings';
import { useStore } from '@/store/useStore';
import { useStorage } from '@/hooks/useStorage';
import { resolveEntityCoordinates } from '@/lib/locationResolver';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  ArrowLeft, Camera, Upload, X, Loader2, Check,
  MapPin, Building2, User, Users, Calendar, Briefcase,
  Phone, Home, Wallet, Sparkles, ShieldCheck, Moon, Sun, Utensils, Wind, Wine, Heart
} from 'lucide-react';

type ScreenId =
  | 'avatar' | 'name' | 'gender' | 'age' | 'profession' | 'phone'
  | 'city' | 'locality' | 'flat_type' | 'furnishing' | 'rent' | 'partners'
  | 'photos' | 'amenities' | 'available_from' | 'pref_gender' | 'house_rules'
  | 'loading' | 'success';

export default function OwnerOnboarding() {
  const navigate = useNavigate();
  const { user, profile: authProfile, refreshProfile } = useAuth();
  const { updateProfile } = useUserProfile();
  const { createListing, updateListing, getMyListings } = useListings();
  const { setCurrentRole } = useStore();
  const { uploadListingImages, uploadProfilePicture } = useStorage();

  const [screenIndex, setScreenIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [error, setError] = useState('');

  // Form states
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [profession, setProfession] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');

  const [flatType, setFlatType] = useState('');
  const [furnishing, setFurnishing] = useState('');
  const [totalRent, setTotalRent] = useState('');
  const [partnersNeeded, setPartnersNeeded] = useState(1);
  const [city, setCity] = useState('');
  const [locality, setLocality] = useState('');
  const [availableFrom, setAvailableFrom] = useState('');
  const [listingPhotos, setListingPhotos] = useState<string[]>([]); // Object URLs
  const [listingFiles, setListingFiles] = useState<File[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);

  const [preferredGender, setPreferredGender] = useState('Any');
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [customRules, setCustomRules] = useState<string[]>([]);
  const [customRuleInput, setCustomRuleInput] = useState('');

  // Sync profile data and skip profile setup if already completed onboarding
  useEffect(() => {
    if (authProfile) {
      setName(prev => prev || authProfile.name || '');
      setGender(prev => prev || authProfile.gender || '');
      setAge(prev => prev || authProfile.age?.toString() || '');
      setProfession(prev => prev || authProfile.profession || '');
      setCompany(prev => prev || authProfile.company || '');
      setPhone(prev => prev || authProfile.phone || '');
      if (authProfile.onboardingComplete && screenIndex === 0) {
        setScreenIndex(6);
      }
    }
  }, [authProfile]);

  const SCREENS: ScreenId[] = [
    'avatar', 'name', 'gender', 'age', 'profession', 'phone',
    'city', 'locality', 'flat_type', 'furnishing', 'rent', 'partners',
    'photos', 'amenities', 'available_from', 'pref_gender', 'house_rules',
    'loading', 'success'
  ];

  const totalInteractive = SCREENS.length - 2;
  const progress = Math.min(100, Math.round((screenIndex / totalInteractive) * 100));
  const currentScreen = SCREENS[screenIndex];

  const go = (delta: number) => {
    setError('');
    setScreenIndex(prev => {
      const newIndex = prev + delta;
      if (authProfile?.onboardingComplete && newIndex < 6) {
        return prev;
      }
      return Math.min(SCREENS.length - 1, Math.max(0, newIndex));
    });
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
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      if (listingFiles.length + newFiles.length > 10) {
        setError('You can only upload up to 10 photos');
        return;
      }
      setListingFiles(prev => [...prev, ...newFiles]);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setListingPhotos(prev => [...prev, ...newPreviews]);
      setError('');
    }
  };

  const removePhoto = (index: number) => {
    const updatedFiles = [...listingFiles];
    updatedFiles.splice(index, 1);
    setListingFiles(updatedFiles);

    const updatedPhotos = [...listingPhotos];
    URL.revokeObjectURL(updatedPhotos[index]);
    updatedPhotos.splice(index, 1);
    setListingPhotos(updatedPhotos);
  };

  const toggleAmenity = (a: string) => {
    setAmenities(prev =>
      prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
    );
  };

  const toggleRule = (r: string) => {
    setSelectedRules(prev =>
      prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
    );
  };

  const addCustomRule = () => {
    if (!customRuleInput.trim()) return;
    setCustomRules(prev => [...prev, customRuleInput.trim()]);
    setCustomRuleInput('');
  };

  const handlePublish = async () => {
    if (!user) return;
    setScreenIndex(SCREENS.indexOf('loading'));
    setSaving(true);
    setError('');
    setUploadProgress(0);

    const safeProgress = (pct: number) => {
      setUploadProgress(Math.min(100, Math.max(0, Math.round(pct))));
    };

    try {
      setCurrentRole('owner');
      let avatarUrl = authProfile?.avatar || '';
      if (avatarFile) {
        try {
          avatarUrl = await uploadProfilePicture(avatarFile, user.uid, safeProgress);
        } catch (e) {
          console.warn("Avatar upload failed, continuing...", e);
        }
      }

      const total = parseInt(totalRent || '0');
      const share = Math.round(total / (partnersNeeded + 1));

      const resolvedGeo = resolveEntityCoordinates({
        uid: user.uid,
        city,
        locality,
      });

      await updateProfile(user.uid, {
        role: 'owner',
        name: name.trim(),
        age: parseInt(age),
        gender,
        profession,
        company,
        phone,
        city,
        localities: [locality],
        budget: share,
        moveInDate: availableFrom,
        onboardingComplete: true,
        ...(avatarUrl && { avatar: avatarUrl }),
        ...(resolvedGeo && { geoLocation: { lat: resolvedGeo.lat, lng: resolvedGeo.lng, formattedAddress: `${locality}, ${city}` } }),
      });

      // Check if owner already has a listing for this locality and flatType
      const existingListings = await getMyListings(user.uid);
      const matchingListing = existingListings.find(
        l => l.locality.toLowerCase().trim() === locality.toLowerCase().trim() && l.flatType === flatType
      );

      const listingCoords = resolveEntityCoordinates({
        city,
        locality,
      }) || { lat: 13.0827, lng: 80.2707 };

      let listingId = '';
      const listingData = {
        ownerName: name.trim() || authProfile?.name || 'Owner',
        ownerAvatar: avatarUrl,
        title: `${flatType} for rent in ${locality}`,
        description: customRules.length > 0 ? `Custom Rules: ${customRules.join(', ')}` : 'A great flat share opportunity.',
        flatType,
        furnishing,
        city,
        locality,
        address: `${locality}, ${city}`,
        totalRent: total,
        partnerShare: share,
        partnersNeeded,
        deposit: total * 2,
        amenities,
        houseRules: [...selectedRules, ...customRules],
        availableFrom,
        lat: listingCoords.lat,
        lng: listingCoords.lng,
        status: 'active' as const,
      };

      if (matchingListing) {
        listingId = matchingListing.id;
        await updateListing(listingId, listingData);
      } else {
        listingId = await createListing(user.uid, {
          ...listingData,
          images: [],
        });
      }

      if (listingFiles.length > 0) {
        try {
          const uploadedUrls = await uploadListingImages(listingFiles, listingId, safeProgress);
          await updateListing(listingId, { images: uploadedUrls });
        } catch (e) {
          console.warn("Listing images upload failed/partial, continuing...", e);
        }
      }

      safeProgress(100);
      await refreshProfile(user.uid);

      // Fetch actual seeker count in this city
      try {
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'seeker'),
          where('city', '==', city)
        );
        const snap = await getDocs(q);
        setMatchCount(snap.docs.length);
      } catch (e) {
        console.error("Error fetching matches:", e);
      }

      setScreenIndex(SCREENS.indexOf('success'));
    } catch (err: any) {
      console.error("Publish error:", err);
      setError(err.message || 'Failed to publish. Please try again.');
      setScreenIndex(SCREENS.indexOf('house_rules'));
    } finally {
      setSaving(false);
    }
  };

  const renderScreen = () => {
    if (currentScreen === 'loading') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
          <div className="relative w-20 h-20">
            <div className="w-20 h-20 rounded-full bg-fire/10 flex items-center justify-center animate-pulse">
              <span className="text-4xl">🏢</span>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-display italic mb-2">Publishing your listing…</h2>
            <p className="text-ink/50 text-sm">Uploading photos and details ({Math.min(100, Math.max(0, uploadProgress))}%)</p>
          </div>
          <div className="w-full max-w-xs bg-ink/10 h-1.5 rounded-full overflow-hidden">
            <div className="bg-fire h-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(0, uploadProgress))}%` }} />
          </div>
        </div>
      );
    }

    if (currentScreen === 'success') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center px-4">
          <div className="text-6xl animate-bounce">🎉</div>
          <div>
            <h2 className="text-3xl font-display italic mb-2">Listing is Live!</h2>
            <p className="text-ink/60 text-base mb-1">
              Your flat is now visible to seekers in <span className="font-bold text-fire">{city}</span>.
            </p>
            <p className="text-ink/40 text-sm">We found <span className="font-bold text-fire text-xl">{matchCount}</span> potential flatmates in your area.</p>
          </div>
          <div className="card-nestmate p-5 w-full max-w-sm text-left">
            <div className="flex justify-between text-sm mb-2 border-b border-border/50 pb-2">
              <span className="text-ink/60">Property</span>
              <span className="font-medium text-ink">{flatType} in {locality}</span>
            </div>
            <div className="flex justify-between text-sm mb-2 border-b border-border/50 pb-2">
              <span className="text-ink/60">Rent Per Month</span>
              <span className="font-medium text-ink">₹{parseInt(totalRent).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink/60">Split Share</span>
              <span className="font-medium text-fire font-bold">₹{Math.round(parseInt(totalRent) / (partnersNeeded + 1)).toLocaleString()} / user</span>
            </div>
          </div>
          <button
            onClick={() => { window.location.href = '/owner-dashboard'; }}
            className="btn-fire text-base px-10 py-3.5 mt-2"
          >
            Go to Owner Dashboard →
          </button>
        </div>
      );
    }

    // 1. Avatar Photo Screen
    if (currentScreen === 'avatar') return (
      <Screen
        emoji="📸" title="Add your photo" subtitle="A friendly photo builds instant trust with room seekers"
        onNext={() => next()} nextLabel="Continue" onBack={null} error={error}
      >
        <div className="flex justify-center py-6">
          <label className="relative cursor-pointer group">
            <div className={`w-36 h-36 rounded-full overflow-hidden border-4 ${avatarPreview ? 'border-fire' : 'border-dashed border-ink/20'} transition-all flex items-center justify-center bg-cream/50`}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <Camera className="w-8 h-8 text-ink/30 mx-auto mb-1" />
                  <p className="text-xs text-ink/40">Upload photo</p>
                </div>
              )}
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

    // 2. Name Screen
    if (currentScreen === 'name') return (
      <Screen
        emoji="👋" title="What's your name?" subtitle="How flatmates will address you"
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

    // 3. Gender Screen
    if (currentScreen === 'gender') return (
      <Screen
        emoji="🤝" title="I identify as…" subtitle="Helps seekers filter according to preferences"
        onNext={() => next(() => !gender ? 'Please select your gender' : null)}
        onBack={() => go(-1)} error={error}
      >
        <div className="space-y-3 mt-4">
          {[
            { id: 'female', label: 'Female', icon: '👩' },
            { id: 'male', label: 'Male', icon: '👨' },
            { id: 'other', label: 'Other', icon: '🤝' },
          ].map(opt => (
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

    // 4. Age Screen
    if (currentScreen === 'age') return (
      <Screen
        emoji="🎂" title="How old are you?" subtitle="Must be 18 or above to host flatmates"
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

    // 5. Profession Screen
    if (currentScreen === 'profession') return (
      <Screen
        emoji="💼" title="What do you do?" subtitle="Select your primary profession or college"
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
        <div className="mt-4">
          <input
            type="text" value={company} onChange={e => setCompany(e.target.value)}
            placeholder="Company or College name (Optional)"
            className="input-nestmate text-sm text-center"
          />
        </div>
      </Screen>
    );

    // 6. Phone Screen
    if (currentScreen === 'phone') return (
      <Screen
        emoji="📞" title="What is your phone number?" subtitle="For verification and scheduling calls"
        onNext={() => next(() => {
          const clean = phone.replace(/\D/g, '');
          return clean.length < 10 ? 'Please enter a valid 10-digit number' : null;
        })}
        onBack={() => go(-1)} error={error}
      >
        <div className="relative mt-4 max-w-xs mx-auto">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-ink/50">+91</span>
          <input
            type="tel" value={phone} onChange={e => { setPhone(e.target.value); setError(''); }}
            placeholder="Mobile number"
            className="input-nestmate pl-14 text-center text-lg font-semibold tracking-wider"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && next(() => {
              const clean = phone.replace(/\D/g, '');
              return clean.length < 10 ? 'Please enter a valid 10-digit number' : null;
            })}
          />
        </div>
      </Screen>
    );

    // 7. City Screen
    if (currentScreen === 'city') return (
      <Screen
        emoji="🏙️" title="Which city is your room in?" subtitle="We matches room seekers within the same city"
        onNext={() => next(() => !city ? 'Please select a city' : null)}
        onBack={() => go(-1)} error={error}
      >
        <div className="grid grid-cols-2 gap-3 mt-4">
          {cities.map(c => (
            <button key={c} onClick={() => { setCity(c); setLocality(''); }}
              className={`p-4 rounded-2xl border-2 font-medium transition-all text-sm ${city === c ? 'border-fire bg-fire/5 text-fire' : 'border-border bg-white hover:border-fire/30'}`}>
              {c}
            </button>
          ))}
        </div>
      </Screen>
    );

    // 8. Locality Screen
    if (currentScreen === 'locality') {
      const available = localitiesByCity[city] || [];
      return (
        <Screen
          emoji="📍" title="Which area / locality?" subtitle="Select the exact neighborhood of your flat"
          onNext={() => next(() => !locality ? 'Please select a locality' : null)}
          onBack={() => go(-1)} error={error}
        >
          <div className="flex flex-wrap gap-2 mt-4 max-h-[40vh] overflow-y-auto p-1">
            {available.map(loc => (
              <button key={loc} onClick={() => setLocality(loc)}
                className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${locality === loc ? 'border-fire bg-fire text-white' : 'border-border bg-white hover:border-fire/30'}`}>
                {loc}
              </button>
            ))}
          </div>
        </Screen>
      );
    }

    // 9. Flat Type Screen
    if (currentScreen === 'flat_type') return (
      <Screen
        emoji="🏠" title="What type of flat is it?" subtitle="Select the layout configuration"
        onNext={() => next(() => !flatType ? 'Please select a flat configuration' : null)}
        onBack={() => go(-1)} error={error}
      >
        <div className="grid grid-cols-2 gap-3 mt-4">
          {flatTypes.map(ft => (
            <button key={ft} onClick={() => setFlatType(ft)}
              className={`p-4 rounded-2xl border-2 font-medium transition-all text-sm ${flatType === ft ? 'border-fire bg-fire/5 text-fire' : 'border-border bg-white hover:border-fire/30'}`}>
              {ft}
            </button>
          ))}
        </div>
      </Screen>
    );

    // 10. Furnishing Screen
    if (currentScreen === 'furnishing') return (
      <Screen
        emoji="🛋️" title="What is the furnishing status?" subtitle="Select the degree of flat furnishing"
        onNext={() => next(() => !furnishing ? 'Please select a furnishing level' : null)}
        onBack={() => go(-1)} error={error}
      >
        <div className="space-y-3 mt-4">
          {furnishingTypes.map(ft => (
            <button key={ft} onClick={() => setFurnishing(ft)}
              className={`w-full p-4 rounded-2xl border-2 text-left font-medium transition-all ${furnishing === ft ? 'border-fire bg-fire/5 text-fire' : 'border-border bg-white hover:border-fire/30'}`}>
              {ft}
            </button>
          ))}
        </div>
      </Screen>
    );

    // 11. Rent Screen
    if (currentScreen === 'rent') return (
      <Screen
        emoji="💰" title="What is the total monthly rent?" subtitle="Enter total rent of the entire house"
        onNext={() => next(() => {
          const val = parseInt(totalRent);
          return !totalRent || isNaN(val) || val < 1000 ? 'Please enter a valid rent amount' : null;
        })}
        onBack={() => go(-1)} error={error}
      >
        <div className="relative mt-6 max-w-xs mx-auto">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-ink/50">₹</span>
          <input
            type="number" value={totalRent} onChange={e => { setTotalRent(e.target.value); setError(''); }}
            placeholder="Total Rent"
            className="input-nestmate pl-8 text-center text-xl font-bold text-fire"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && next(() => {
              const val = parseInt(totalRent);
              return !totalRent || isNaN(val) || val < 1000 ? 'Please enter a valid rent amount' : null;
            })}
          />
        </div>
        <div className="flex justify-center gap-2 mt-4">
          {[12000, 18000, 25000, 32000].map(r => (
            <button key={r} onClick={() => setTotalRent(r.toString())}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${totalRent === r.toString() ? 'border-fire bg-fire/5 text-fire' : 'border-border hover:border-fire/20'}`}>
              ₹{(r / 1000)}k
            </button>
          ))}
        </div>
      </Screen>
    );

    // 12. Partners Needed Screen
    if (currentScreen === 'partners') {
      const share = Math.round(parseInt(totalRent || '0') / (partnersNeeded + 1));
      return (
        <Screen
          emoji="👥" title="How many flatmates needed?" subtitle="Specify how many rooms/beds are to be filled"
          onNext={() => next()} onBack={() => go(-1)} error={error}
        >
          <div className="flex items-center justify-center gap-6 mt-8">
            <button onClick={() => setPartnersNeeded(p => Math.max(1, p - 1))}
              className="w-12 h-12 rounded-full border-2 border-border flex items-center justify-center text-xl font-bold hover:bg-cream transition-colors">-</button>
            <span className="text-3xl font-bold w-12 text-center">{partnersNeeded}</span>
            <button onClick={() => setPartnersNeeded(p => Math.min(4, p + 1))}
              className="w-12 h-12 rounded-full border-2 border-border flex items-center justify-center text-xl font-bold hover:bg-cream transition-colors">+</button>
          </div>
          <div className="mt-8 bg-fire/5 border border-fire/20 rounded-2xl p-4 text-center max-w-sm mx-auto">
            <p className="text-sm text-fire font-medium">Estimated Split Cost Sharing:</p>
            <p className="text-2xl font-bold text-fire mt-1">₹{share.toLocaleString()}<span className="text-xs font-normal text-ink/50 ml-1">/ person</span></p>
          </div>
        </Screen>
      );
    }

    // 13. Room Photos Upload Screen
    if (currentScreen === 'photos') return (
      <Screen
        emoji="🖼️" title="Add room photos" subtitle="Upload at least 3 photos (max 10). Seekers trust real images."
        onNext={() => next(() => listingFiles.length < 3 ? 'Please upload at least 3 photos of the flat' : null)}
        onBack={() => go(-1)} error={error}
      >
        <div className="mt-4">
          <label className={`w-full h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:border-fire ${error ? 'border-red-400' : 'border-border bg-white'}`}>
            <Upload className="w-6 h-6 text-ink/40" />
            <span className="text-sm font-semibold text-ink/50">Tap to upload photos</span>
            <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoSelect} />
          </label>

          {listingPhotos.length > 0 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {listingPhotos.map((p, i) => (
                <div key={i} className="relative flex-shrink-0">
                  <img src={p} alt="" className="w-20 h-20 rounded-xl object-cover border border-border" />
                  <button onClick={() => removePhoto(i)}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white shadow-md hover:bg-red-600 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-ink/40 mt-2 text-center">{listingFiles.length} photos selected (minimum 3 required)</p>
        </div>
      </Screen>
    );

    // 14. Amenities Screen
    if (currentScreen === 'amenities') return (
      <Screen
        emoji="✨" title="Flat Amenities" subtitle="Select what appliances and features are included"
        onNext={() => next()} onBack={() => go(-1)} error={error}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 max-h-[40vh] overflow-y-auto p-1">
          {amenitiesList.map(a => {
            const sel = amenities.includes(a);
            return (
              <button key={a} onClick={() => toggleAmenity(a)}
                className={`p-3 rounded-xl border-2 text-xs font-semibold transition-all ${sel ? 'border-teal bg-teal/10 text-teal' : 'border-border bg-white hover:border-fire/20'}`}>
                {sel ? '✓ ' : ''}{a}
              </button>
            );
          })}
        </div>
      </Screen>
    );

    // 15. Available From Screen
    if (currentScreen === 'available_from') return (
      <Screen
        emoji="📅" title="When is it available from?" subtitle="Approximate move-in availability date"
        onNext={() => next(() => !availableFrom ? 'Please select a date' : null)}
        onBack={() => go(-1)} error={error}
      >
        <input
          type="date" value={availableFrom} onChange={e => { setAvailableFrom(e.target.value); setError(''); }}
          min={new Date().toISOString().split('T')[0]}
          className="input-nestmate text-center mt-6 text-base"
        />
        <div className="flex justify-center gap-2 mt-4">
          {['ASAP', '1 Month', '2 Months'].map(label => {
            const d = new Date();
            if (label === 'ASAP') d.setDate(d.getDate() + 3);
            else d.setMonth(d.getMonth() + parseInt(label));
            const val = d.toISOString().split('T')[0];
            return (
              <button key={label} onClick={() => setAvailableFrom(val)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${availableFrom === val ? 'border-fire bg-fire/10 text-fire' : 'border-border hover:border-fire/20'}`}>
                {label}
              </button>
            );
          })}
        </div>
      </Screen>
    );

    // 16. Preferred Gender Screen
    if (currentScreen === 'pref_gender') return (
      <Screen
        emoji="👥" title="Preferred flatmate gender" subtitle="What is the preferred gender configuration of matches?"
        onNext={() => next()} onBack={() => go(-1)} error={error}
      >
        <div className="space-y-3 mt-4">
          {['Any', 'Female Only', 'Male Only'].map(opt => (
            <button key={opt} onClick={() => setPreferredGender(opt)}
              className={`w-full p-4 rounded-2xl border-2 text-left font-medium transition-all ${preferredGender === opt ? 'border-fire bg-fire/5 text-fire' : 'border-border bg-white hover:border-fire/30'}`}>
              {opt}
            </button>
          ))}
        </div>
      </Screen>
    );

    // 17. House Rules Screen
    if (currentScreen === 'house_rules') return (
      <Screen
        emoji="🚭" title="House Rules" subtitle="Select what habits and rules you would expect"
        onNext={handlePublish} onBack={() => go(-1)} error={error} nextLabel="Publish Listing"
      >
        <div className="flex flex-wrap gap-2 mt-4 max-h-[30vh] overflow-y-auto p-1">
          {houseRulesList.map(r => {
            const sel = selectedRules.includes(r);
            return (
              <button key={r} onClick={() => toggleRule(r)}
                className={`px-3 py-2 rounded-xl text-sm border-2 transition-all ${sel ? 'border-fire bg-fire/10 text-fire' : 'border-border bg-white hover:border-fire/30'}`}>
                {sel ? '✓ ' : ''}{r}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            type="text" value={customRuleInput} onChange={e => setCustomRuleInput(e.target.value)}
            placeholder="Add custom rule..."
            className="flex-1 input-nestmate text-sm"
            onKeyDown={e => e.key === 'Enter' && addCustomRule()}
          />
          <button onClick={addCustomRule} className="px-4 py-2 bg-cream rounded-xl border border-border text-sm font-semibold hover:bg-cream/70 transition-all">
            Add
          </button>
        </div>
        {customRules.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {customRules.map((r, i) => (
              <span key={i} className="badge-fire flex items-center gap-1">
                {r}
                <button onClick={() => setCustomRules(prev => prev.filter((_, idx) => idx !== i))}>×</button>
              </span>
            ))}
          </div>
        )}
      </Screen>
    );

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
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-parchment/90 backdrop-blur-sm border-b border-border">
        <div className="h-1 bg-border">
          <div className="h-full bg-gradient-to-r from-fire to-amber-400 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg gradient-fire flex items-center justify-center">
              <span className="text-white text-xs font-bold">N</span>
            </div>
            <span className="text-xs font-semibold text-ink/50">NestMate Setup</span>
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

// Reusable Screen Wrapper
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
        <h2 className="text-2xl font-display italic mb-1 text-ink">{title}</h2>
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
