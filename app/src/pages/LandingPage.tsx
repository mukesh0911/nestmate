import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  ArrowRight, Check, Star, Shield, MessageCircle,
  FileText, Users, Search, ChevronRight, Menu, X, LogOut,
  Building2, Sparkles, ShieldCheck, CheckCircle2, ArrowUpRight,
  MapPin, Heart, Zap, Award, Map
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useStore } from '@/store/useStore';
import HeroMatchShowcase from '@/components/HeroMatchShowcase';

interface LandingAuthState {
  uid: string | null;
  role: 'seeker' | 'owner' | null;
  onboardingComplete: boolean;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authState, setAuthState] = useState<LandingAuthState>({
    uid: null,
    role: null,
    onboardingComplete: false,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (snap.exists()) {
            const data = snap.data();
            setAuthState({
              uid: firebaseUser.uid,
              role: data.role || null,
              onboardingComplete: data.onboardingComplete || false,
            });
          } else {
            setAuthState({ uid: firebaseUser.uid, role: null, onboardingComplete: false });
          }
        } catch {
          setAuthState({ uid: firebaseUser.uid, role: null, onboardingComplete: false });
        }
      } else {
        setAuthState({ uid: null, role: null, onboardingComplete: false });
      }
    });
    return unsubscribe;
  }, []);

  // Search state for Hero widget
  const [searchTab, setSearchTab] = useState<'rooms' | 'seekers'>('rooms');
  const [selectedCity, setSelectedCity] = useState('Bengaluru');
  const [localityQuery, setLocalityQuery] = useState('');

  // Auth-aware navigation helpers
  const getDashboard = () =>
    authState.role === 'owner' ? '/owner-dashboard' : '/dashboard';

  const handleGetStarted = () => {
    if (authState.uid && authState.onboardingComplete) {
      navigate(getDashboard());
    } else {
      navigate('/login');
    }
  };

  const handleBrowseRooms = () => {
    navigate('/explore?tab=rooms');
  };

  const handleBrowseSeekers = () => {
    navigate('/explore?tab=roommates');
  };

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Sprint 4B (truth): the locality input is now actually applied as a
    // filter. Previously it was collected but silently discarded, so a user
    // searching "Koramangala" got city-wide results.
    const locality = localityQuery.trim();
    useStore.getState().updateFilters({
      city: selectedCity,
      localities: locality ? [locality] : [],
    });
    if (searchTab === 'rooms') {
      navigate('/explore?tab=rooms');
    } else {
      navigate('/explore?tab=roommates');
    }
  };

  const handleCityClick = (cityName: string) => {
    useStore.getState().updateFilters({ city: cityName });
    navigate('/explore?tab=rooms');
  };

  const handleListRoom = () => {
    if (authState.uid) {
      // Always go to owner-dashboard; onboarding questions appear only when "Create Listing" is clicked
      navigate('/owner-dashboard');
    } else {
      useStore.getState().openAuthModal({
        title: 'Post Your Room Listing',
        subtitle: 'Sign in or use quick demo account to list your room.',
        redirect: '/owner-dashboard',
      });
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const popularCities = [
    { name: 'Bengaluru', rooms: 'Explore rooms', image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600&q=80' },
    { name: 'Mumbai', rooms: 'Explore rooms', image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&q=80' },
    { name: 'Delhi NCR', rooms: 'Explore rooms', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=80' },
    { name: 'Hyderabad', rooms: 'Explore rooms', image: 'https://images.unsplash.com/photo-1605007493699-af65834f8a00?w=600&q=80' },
    { name: 'Pune', rooms: 'Explore rooms', image: 'https://images.unsplash.com/photo-1602941525421-8f8b81d3189e?w=600&q=80' },
    { name: 'Chennai', rooms: 'Explore rooms', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&q=80' },
  ];

  return (
    <div className="min-h-screen bg-parchment overflow-x-hidden">
      {/* Hero Section - Split Screen */}
      <section className="min-h-[calc(100dvh-60px)] flex flex-col lg:flex-row">
        {/* Left Column - Value Proposition & Search */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-10 lg:px-16 xl:px-20 pt-8 sm:pt-12 lg:pt-16 pb-10 sm:pb-12">
          <div className="max-w-2xl">
            {/* Eyebrow Tag */}
            {/* Sprint 5B: eyebrow is quiet metadata — no pulsing decoration */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-fire/10 rounded-full mb-6 border border-fire/20">
              <Sparkles className="w-3.5 h-3.5 text-fire" />
              <span className="type-label">Roommate & Flat Finder Platform</span>
            </div>

            {/* Sprint 5B: serif display reserved for the single hero statement */}
            <h1 className="type-display mb-5">
              Find compatible <span className="text-fire underline decoration-fire/30">flatmates</span>, rooms & PGs
            </h1>

            {/* Description */}
            <p className="type-body-lg mb-8">
              NestMate matches you with compatible roommates based on lifestyle, sleep habits & budget. Zero brokerage, consent-based contact, and transparent trust signals.
            </p>

            {/* Sprint 5B: search is a product control — hairline border, one
                elevation level, radius from the ladder (no 3xl/shadow-2xl) */}
            <div className="card-nestmate p-4 sm:p-5 mb-8">
              {/* Sleek SVG Vector Tabs */}
              <div className="flex items-center gap-2 p-1.5 bg-cream/70 rounded-2xl mb-4 w-full sm:w-fit border border-border/40">
                <button
                  type="button"
                  onClick={() => setSearchTab('rooms')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${searchTab === 'rooms'
                    ? 'bg-fire text-white shadow-sm'
                    : 'text-ink/60 hover:text-ink hover:bg-white/50'
                    }`}
                >
                  <Building2 className={`w-4 h-4 ${searchTab === 'rooms' ? 'text-white' : 'text-fire'}`} />
                  <span>Find Rooms & Flats</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSearchTab('seekers')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${searchTab === 'seekers'
                    ? 'bg-fire text-white shadow-sm'
                    : 'text-ink/60 hover:text-ink hover:bg-white/50'
                    }`}
                >
                  <Users className={`w-4 h-4 ${searchTab === 'seekers' ? 'text-white' : 'text-navy'}`} />
                  <span>Find Flatmates</span>
                </button>
              </div>

              {/* Search Inputs */}
              <form onSubmit={handleHeroSearch} className="flex flex-col sm:flex-row items-center gap-3">
                <div className="w-full sm:w-44 flex-col text-left">
                  <label className="text-[10px] font-bold text-ink/50 uppercase tracking-wider block mb-1">City</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full bg-cream/40 border border-border/80 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold outline-none focus:border-fire transition-colors"
                  >
                    {['Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Pune', 'Chennai'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="w-full flex-1 flex-col text-left">
                  <label className="text-[10px] font-bold text-ink/50 uppercase tracking-wider block mb-1">Locality / Landmark</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-ink/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. HSR Layout, Koramangala, Bandra..."
                      value={localityQuery}
                      onChange={(e) => setLocalityQuery(e.target.value)}
                      className="w-full bg-cream/40 border border-border/80 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm font-medium outline-none focus:border-fire transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  aria-label="Search listings"
                  data-testid="hero-search-button"
                  className="w-full sm:w-auto btn-fire px-6 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm sm:mt-5 transition-all cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </form>
            </div>

            {/* Action Buttons — mobile: Demo only (search tabs already cover browse); sm+: full set */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 mb-6 sm:mb-8">
              <button
                onClick={handleBrowseRooms}
                className="hidden sm:inline-flex btn-fire items-center justify-center gap-2 text-sm px-5 py-3 shadow-sm"
              >
                <Building2 className="w-4 h-4" />
                Browse All Rooms
              </button>
              <button
                onClick={handleBrowseSeekers}
                className="hidden sm:inline-flex btn-outline items-center justify-center gap-2 text-sm px-5 py-3"
              >
                <Users className="w-4 h-4 text-navy" />
                Find Flatmates
              </button>
              <button
                type="button"
                onClick={() => useStore.getState().openAuthModal()}
                className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-3 min-h-[48px] rounded-xl border border-teal/40 bg-teal/5 text-teal hover:bg-teal/10 font-bold text-sm transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Instant Demo
              </button>
            </div>

            {/* List Your Room CTA */}
            <div className="mb-6 sm:mb-8">
              <button
                onClick={handleListRoom}
                className="inline-flex items-center gap-2 text-sm font-bold text-ink/70 hover:text-fire transition-colors group bg-white/70 px-4 py-2.5 rounded-xl border border-border/50 shadow-2xs max-w-full"
              >
                <FileText className="w-4 h-4 text-fire shrink-0" />
                <span className="text-left leading-snug">Have a room to offer? List Your Room Free</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-fire shrink-0" />
              </button>
            </div>

            {/* Trust line — no fabricated user avatars or counts */}
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="w-4 h-4 text-teal shrink-0" aria-hidden />
              <p className="text-xs sm:text-sm text-ink/60 leading-snug">
                Real rooms with owner-confirmed availability, across India
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Match Showcase */}
        <div className="flex-1 gradient-dark relative overflow-hidden flex flex-col items-center justify-center px-3 py-8 sm:p-8 lg:p-12 gradient-mesh-fire min-h-0 sm:min-h-[520px] lg:min-h-[580px]">
          <HeroMatchShowcase />
        </div>
      </section>

      {/* Popular Cities Grid Section (Competitor-Inspired Premium Design) */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-white border-y border-border/60">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy/10 text-navy font-bold text-xs mb-3">
                <MapPin className="w-3.5 h-3.5" /> Popular Destinations
              </div>
              <h2 className="type-h1">
                View Rooms in Popular Cities
              </h2>
            </div>
            <button
              onClick={handleBrowseRooms}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-fire hover:text-fire-dark transition-colors group"
            >
              Browse All Cities <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>

          {/* Cities Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {popularCities.map((city) => (
              <div
                key={city.name}
                onClick={() => handleCityClick(city.name)}
                className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer shadow-xs hover:shadow-md transition-all duration-200"
              >
                <img
                  src={city.image}
                  alt={city.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent flex flex-col justify-end p-3.5">
                  <h3 className="text-base font-bold text-white group-hover:text-fire transition-colors">{city.name}</h3>
                  <p className="text-[11px] text-white/80 font-medium">{city.rooms}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Banners Section (Inspired by Competitor Layout in image2.png) */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-16">

          {/* Banner 1: Verified & Trusted Community */}
          <div className="card-nestmate p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative">
            <div className="max-w-xl z-10">
              <div className="w-12 h-12 bg-teal/10 rounded-2xl flex items-center justify-center mb-5">
                <ShieldCheck className="w-6 h-6 text-teal" />
              </div>
              <h2 className="type-h2 mb-4">
                Know what each profile has actually verified.
              </h2>
              <p className="type-body-lg mb-6">
                NestMate shows an honest trust ladder — phone verification at sign-in, plus optional admin-reviewed work email and government ID checks — so you can see exactly what each person has verified before you connect.
              </p>
              <button
                onClick={() => navigate('/how-it-works')}
                className="btn-teal px-6 py-3 text-sm font-bold rounded-xl inline-flex items-center gap-2 shadow-sm"
              >
                Learn How It Works <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="w-full md:w-80 h-56 bg-gradient-to-tr from-teal/20 to-teal/5 rounded-2xl flex items-center justify-center p-6 border border-teal/20 relative">
              <div className="bg-white rounded-xl shadow-lg p-5 w-full border border-border text-center space-y-3">
                <div className="w-10 h-10 bg-teal/10 rounded-full flex items-center justify-center mx-auto text-teal">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-ink">3-Step Trust Ladder</p>
                <p className="text-[11px] text-ink/50">Phone · Work Email · Govt ID review</p>
                <span className="inline-block px-3 py-1 bg-teal/10 text-teal text-[10px] font-bold rounded-full">Consent-based contact</span>
              </div>
            </div>
          </div>

          {/* Banner 2: Premium Properties & Zero Brokerage */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="card-nestmate p-8 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 bg-fire/10 rounded-xl flex items-center justify-center mb-4">
                  <Building2 className="w-5 h-5 text-fire" />
                </div>
                <h3 className="type-h2 mb-3">Looking for Premium Properties?</h3>
                <p className="type-body mb-6">
                  Explore 1BHK, 2BHK and luxury gated society rooms with modular kitchens, AC, gym, and 24/7 security.
                </p>
              </div>
              <button
                onClick={handleBrowseRooms}
                className="btn-fire text-xs font-bold px-5 py-3 rounded-xl w-fit inline-flex items-center gap-2"
              >
                Explore Premium Rooms <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="card-nestmate p-8 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 bg-navy/10 rounded-xl flex items-center justify-center mb-4">
                  <Award className="w-5 h-5 text-navy" />
                </div>
                <h3 className="type-h2 mb-3">Zero Brokerage</h3>
                {/* Sprint 4B (truth): no invented savings figures — actual savings
                     depend on local broker rates, so we state the mechanism only. */}
                <p className="type-body mb-6">
                  No broker, no brokerage fee. Connect directly with owners and flatmates with transparent rent splits.
                </p>
              </div>
              <button
                onClick={handleBrowseSeekers}
                className="btn-navy text-xs font-bold px-5 py-3 rounded-xl w-fit inline-flex items-center gap-2"
              >
                Find Flatmates Direct <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 sm:py-28 px-4 sm:px-6 bg-white border-t border-border/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="type-h1 mb-4">How It Works</h2>
            <p className="type-body-lg max-w-lg mx-auto">Three simple steps to find your perfect roommate match</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: Users,
                title: 'Create Your Profile',
                desc: 'Answer 10 lifestyle questions about your habits, preferences, and schedule.',
              },
              {
                step: '02',
                icon: Search,
                title: 'Get Matched',
                desc: 'Our algorithm finds compatible people in your city based on lifestyle alignment.',
              },
              {
                step: '03',
                icon: MessageCircle,
                title: 'Connect & Move In',
                desc: 'Chat safely in-app and share phone numbers only when both of you agree.',
              },
            ].map((item, i) => (
              <div key={i} className="card-nestmate-hover p-8 text-center">
                <div className="w-14 h-14 mx-auto mb-5 bg-fire/10 rounded-2xl flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-fire" />
                </div>
                <p className="type-label mb-2">Step {item.step}</p>
                <h3 className="type-h3 mb-3">{item.title}</h3>
                <p className="type-body">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="type-h1 mb-4">Everything You Need</h2>
            <p className="type-body-lg max-w-lg mx-auto">Tools designed for finding, sharing, and living together</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Users, title: 'Compatibility Matching', desc: 'Lifestyle quiz generates compatibility scores for every match. Find people who actually fit your routine.' },
              { icon: ShieldCheck, title: 'Verified Profiles', desc: 'Phone, Work ID, and Government ID verification create a trust ladder reviewed by our team.' },
              { icon: Building2, title: 'Browse Rooms', desc: 'Filter by budget, location, amenities, and compatibility. See rooms that match your lifestyle.' },
              { icon: MessageCircle, title: 'Safe Chat', desc: 'Built-in messaging with phone number privacy. Share contacts only when both parties agree.' },
              { icon: Map, title: 'Map Discovery', desc: 'Explore listings on an interactive map across Chennai, Bengaluru, Hyderabad, Pune, Mumbai, and Delhi NCR.' },
              { icon: Zap, title: 'Smart Filters', desc: 'Narrow by gender, budget, furnishing, amenities, and verified-only profiles in seconds.' },
            ].map((feat, i) => (
              <div key={i} className="card-nestmate-hover p-6">
                <div className="w-11 h-11 bg-fire/10 rounded-xl flex items-center justify-center mb-4">
                  <feat.icon className="w-5 h-5 text-fire" />
                </div>
                <h3 className="type-h3 mb-2">{feat.title}</h3>
                <p className="type-body">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="type-h1 mb-4">Simple Pricing</h2>
            <p className="type-body-lg max-w-lg mx-auto">Start free, upgrade when you are ready</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="card-nestmate p-6 flex flex-col bg-white rounded-2xl border border-border">
              <div className="mb-6">
                <p className="text-sm font-medium text-ink/60 mb-1">Free</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">₹0</span>
                  <span className="text-sm text-ink/50">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {/* Sprint 4C (truth): connects are unlimited during beta — no
                    enforcement exists, and this must match PricingPage. */}
                {['Unlimited connects (beta)', 'View all matches', '1 active listing', 'Basic chat', 'Trust badges'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-ink/70">
                    <Check className="w-4 h-4 text-teal flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/login')} className="btn-outline w-full text-sm font-bold">Get Started Free</button>
            </div>

            {/* Premium - Highlighted */}
            <div className="relative card-nestmate p-6 flex flex-col border-2 border-fire">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-fire text-white text-xs font-bold px-3.5 py-1 rounded-full shadow-sm">Most Popular</span>
              </div>
              <div className="mb-6 mt-2">
                <p className="text-sm font-bold text-fire mb-1">Premium</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">₹299</span>
                  <span className="text-sm text-ink/50">/month</span>
                </div>
                <p className="text-xs text-ink/50 mt-1">Or ₹2,499/year (Save 30%)</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {/* Sprint 4C (truth): unbuilt premium features are disclosed,
                    not sold as available today. */}
                {['Everything in Free', 'Map discovery', 'Multiple listings', 'See who viewed your profile (coming soon)', 'Priority placement (coming soon)', 'Profile boost (coming soon)'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-ink/70">
                    <Check className="w-4 h-4 text-fire flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {/* Sprint 4C (truth): Premium is not purchasable yet — CTA is an
                  honest waitlist action, not a purchase promise. */}
              <button onClick={() => navigate('/login')} className="btn-outline w-full text-sm font-bold">Premium — Coming Soon</button>
            </div>

            {/* Corporate */}
            <div className="card-nestmate p-6 flex flex-col bg-white rounded-2xl border border-border">
              <div className="mb-6">
                <p className="text-sm font-medium text-ink/60 mb-1">Corporate</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">Custom</span>
                </div>
                <p className="text-xs text-ink/50 mt-1">For companies & HR teams</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {['HR dashboard', 'Employee housing mgmt', 'Priority support', 'Verified company badge', 'Bulk listings'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-ink/70">
                    <Check className="w-4 h-4 text-navy flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {/* Sprint 4C (truth): dead button replaced with a real mailto link. */}
              <a href="mailto:hello@nestmate.in?subject=Corporate%20Plan%20Inquiry" className="btn-navy w-full text-sm font-bold flex items-center justify-center">Email Sales</a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-4 sm:px-6">
        {/* Sprint 5B: final CTA is an editorial moment — display face allowed,
             but no decorative mega-shadow on a flat banner */}
        <div className="max-w-4xl mx-auto gradient-dark rounded-2xl p-10 sm:p-16 text-center relative overflow-hidden">
          <h2 className="type-display text-white mb-4">
            Start finding your roommate today
          </h2>
          <p className="text-white/70 mb-8 max-w-md mx-auto type-body-lg">
            Find your perfect living situation through NestMate
          </p>
          <button onClick={() => navigate('/login')} className="btn-fire text-base font-bold px-8 py-3.5 rounded-xl shadow-sm">
            Get Started — It's Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-white pt-16 pb-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg gradient-fire flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.88-2.88 7.19-5 9.88C9.92 16.21 7 11.85 7 9z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-ink">NestMate</span>
              </div>
              <p className="text-sm text-ink/50 max-w-xs">
                A people-first roommate matching platform. Find compatible roommates, not just empty rooms.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-bold text-sm mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-sm text-ink/50 hover:text-ink transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-sm text-ink/50 hover:text-ink transition-colors">Pricing</a></li>
                <li><Link to="/how-it-works" className="text-sm text-ink/50 hover:text-ink transition-colors">How It Works</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold text-sm mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-sm text-ink/50 hover:text-ink transition-colors">About Us</Link></li>
                {/* Sprint 4C (truth): Blog/Careers pages do not exist — placeholder
                    links removed rather than faked. */}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold text-sm mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy" className="text-sm text-ink/50 hover:text-ink transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-sm text-ink/50 hover:text-ink transition-colors">Terms of Service</Link></li>
                {/* Sprint 4C (truth): no Cookie Policy page exists; linking it to
                    Privacy was misleading — removed. */}
              </ul>
            </div>
          </div>

          <div className="border-t border-border/50 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-ink/40">© 2026 NestMate. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
