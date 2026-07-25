import { useState, useEffect } from 'react';
import {
  Sparkles, ShieldCheck, CheckCircle2, MessageCircle,
  ChevronRight, ChevronLeft, Zap, UserCheck, Flame, RefreshCw
} from 'lucide-react';
import { useStore } from '@/store/useStore';

interface ProfileCard {
  id: string;
  name: string;
  role: string;
  companyOrCategory: string;
  location: string;
  avatar: string;
  matchScore: number;
  category: 'tech' | 'creative' | 'medical' | 'finance';
  verified: boolean;
  repliedTime: string;
  factors: { label: string; active: boolean }[];
  yourShare: number;
  youSave: number;
  bioQuote: string;
}

const SAMPLE_PROFILES: ProfileCard[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    role: 'Software Engineer',
    companyOrCategory: 'Tech · Google',
    location: 'HSR Layout, Bengaluru',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
    matchScore: 96,
    category: 'tech',
    verified: true,
    repliedTime: 'Replies in ~5 mins',
    factors: [
      { label: 'Sleep: 11 PM', active: true },
      { label: 'Veg Kitchen', active: true },
      { label: 'Hybrid WFH', active: true },
      { label: 'Non-Smoker', active: true },
    ],
    yourShare: 12000,
    youSave: 8500,
    bioQuote: 'Looking for a calm flatmate who respects personal space & keeps the kitchen clean!',
  },
  {
    id: '2',
    name: 'Rohan Verma',
    role: 'Product Designer',
    companyOrCategory: 'Creatives · Swiggy',
    location: 'Koramangala, Bengaluru',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&q=80',
    matchScore: 93,
    category: 'creative',
    verified: true,
    repliedTime: 'Replies in ~10 mins',
    factors: [
      { label: 'Weekend Chef', active: true },
      { label: 'Fitness Enthusiast', active: true },
      { label: 'Pet Friendly', active: true },
      { label: 'Night Owl: 12 AM', active: true },
    ],
    yourShare: 14500,
    youSave: 9000,
    bioQuote: 'Love music, specialty coffee & hosting low-key weekend game nights.',
  },
  {
    id: '3',
    name: 'Ananya Roy',
    role: 'Resident Doctor',
    companyOrCategory: 'Medical · Manipal Hospital',
    location: 'Indiranagar, Bengaluru',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&q=80',
    matchScore: 91,
    category: 'medical',
    verified: true,
    repliedTime: 'Replies in ~15 mins',
    factors: [
      { label: 'Quiet Study Hours', active: true },
      { label: 'Non-Smoker', active: true },
      { label: 'Early Riser: 6 AM', active: true },
      { label: 'Clean Freak', active: true },
    ],
    yourShare: 13000,
    youSave: 7800,
    bioQuote: 'Doctor on shifts! Looking for a peaceful, clean home to relax after long days.',
  },
  {
    id: '4',
    name: 'Kabir Mehta',
    role: 'Financial Analyst',
    companyOrCategory: 'Finance · Deloitte',
    location: 'Bandra West, Mumbai',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80',
    matchScore: 94,
    category: 'finance',
    verified: true,
    repliedTime: 'Replies in ~2 mins',
    factors: [
      { label: 'Weekend Golfer', active: true },
      { label: 'Occasional Drinker', active: true },
      { label: 'Full-time Office', active: true },
      { label: 'Aadhaar Verified', active: true },
    ],
    yourShare: 16000,
    youSave: 11500,
    bioQuote: 'Clean habits, love football matches on weekends & transparent budget sharing.',
  },
];

export default function HeroMatchShowcase() {
  const [activeCategory, setActiveCategory] = useState<'all' | 'tech' | 'creative' | 'medical' | 'finance'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [animating, setAnimating] = useState(false);

  const filteredProfiles = activeCategory === 'all'
    ? SAMPLE_PROFILES
    : SAMPLE_PROFILES.filter(p => p.category === activeCategory);

  const currentProfile = filteredProfiles[currentIndex % filteredProfiles.length] || SAMPLE_PROFILES[0];

  const handleNext = () => {
    setAnimating(true);
    setIsLiked(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredProfiles.length);
      setAnimating(false);
    }, 180);
  };

  const handlePrev = () => {
    setAnimating(true);
    setIsLiked(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + filteredProfiles.length) % filteredProfiles.length);
      setAnimating(false);
    }, 180);
  };

  const handleConnect = () => {
    setIsLiked(true);
    setShowConnectModal(true);
  };

  // Auto-cycle profile every 8 seconds unless modal is open
  useEffect(() => {
    if (showConnectModal) return;
    const timer = setInterval(() => {
      handleNext();
    }, 8000);
    return () => clearInterval(timer);
  }, [currentIndex, activeCategory, showConnectModal]);

  return (
    <div className="w-full max-w-[440px] mx-auto flex flex-col items-center gap-4">
      {/* 1. Sleek Top Trust Header (Ultra-Crisp Premium Pills) */}
      <div className="w-full flex items-center justify-between gap-2 px-1">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white rounded-full shadow-sm border border-teal/30 text-xs font-extrabold text-ink">
          <ShieldCheck className="w-4 h-4 text-teal" />
          <span>Aadhaar Verified</span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-fire to-fire-dark text-white rounded-full shadow-md border border-fire/30 text-xs font-extrabold">
          <Flame className="w-3.5 h-3.5 text-white animate-pulse" />
          <span>{currentProfile.matchScore}% Match Score</span>
        </div>
      </div>

      {/* 2. Premium Category Filter Segmented Control */}
      <div className="w-full bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-border/80 shadow-xs flex items-center gap-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: 'All' },
          { id: 'tech', label: 'Tech' },
          { id: 'creative', label: 'Creatives' },
          { id: 'medical', label: 'Medical' },
          { id: 'finance', label: 'Finance' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id as any);
              setCurrentIndex(0);
            }}
            className={`flex-1 min-w-[64px] py-1.5 rounded-xl text-xs font-extrabold transition-all text-center ${
              activeCategory === cat.id
                ? 'bg-fire text-white shadow-sm scale-102'
                : 'text-ink/75 hover:text-ink hover:bg-cream/60'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 3. Main Interactive Profile Card */}
      <div
        className={`w-full bg-white rounded-3xl shadow-2xl p-6 border border-border/80 transition-all duration-300 relative overflow-hidden ${
          animating ? 'opacity-30 scale-98' : 'opacity-100 scale-100'
        }`}
      >
        {/* Profile Card Top Section */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative flex-shrink-0">
            <img
              src={currentProfile.avatar}
              alt={currentProfile.name}
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border-2 border-fire/20 shadow-sm"
            />
            {currentProfile.verified && (
              <div className="absolute -bottom-1 -right-1 bg-teal text-white p-1 rounded-full shadow-md" title="Verified Roommate">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-ink text-lg truncate">
                {currentProfile.name}
              </h3>
            </div>
            <p className="text-xs text-ink/60 font-semibold truncate mt-0.5">{currentProfile.role}</p>
            <p className="text-xs text-ink/40 font-medium truncate">{currentProfile.location}</p>

            <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-teal bg-teal/10 px-2.5 py-0.5 rounded-lg border border-teal/20">
              <Zap className="w-3 h-3" /> {currentProfile.repliedTime}
            </div>
          </div>
        </div>

        {/* Bio Quote */}
        <div className="bg-cream/50 rounded-2xl p-3 mb-4 border border-border/40 text-xs italic text-ink/75 leading-relaxed">
          "{currentProfile.bioQuote}"
        </div>

        {/* Compatibility Factors Grid */}
        <div className="bg-parchment/60 rounded-2xl p-3.5 mb-4 border border-border/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-ink/40 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-fire" /> Compatibility Breakdown
            </span>
            <span className="text-[10px] font-extrabold text-teal">4/4 Matched</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {currentProfile.factors.map((factor, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-border/40 shadow-2xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-teal flex-shrink-0" />
                <span className="truncate text-xs font-semibold text-ink/80">{factor.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rent & Budget Savings */}
        <div className="bg-gradient-to-r from-teal/10 via-parchment to-fire/10 rounded-2xl p-3.5 mb-5 border border-border/60 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-ink/50 uppercase tracking-wider">Your Share</p>
            <p className="text-lg font-black text-ink">
              ₹{currentProfile.yourShare.toLocaleString('en-IN')}<span className="text-xs font-normal text-ink/50">/mo</span>
            </p>
          </div>
          <div className="h-7 w-px bg-border/60" />
          <div className="text-right">
            <p className="text-[10px] font-extrabold text-teal uppercase tracking-wider">Est. Monthly Savings</p>
            <p className="text-lg font-black text-teal">
              ₹{currentProfile.youSave.toLocaleString('en-IN')}<span className="text-xs font-normal text-teal/70">/mo</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-3 border border-border rounded-xl text-ink/60 hover:text-ink hover:bg-cream/60 transition-all"
            title="Previous Profile"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleNext}
            className="flex-1 py-3 border border-border rounded-xl text-xs font-bold text-ink/70 hover:bg-cream/60 transition-all flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Skip
          </button>

          <button
            onClick={handleConnect}
            className={`flex-1 py-3 rounded-xl text-xs font-extrabold transition-all shadow-sm flex items-center justify-center gap-1.5 text-white ${
              isLiked ? 'bg-teal hover:bg-teal-dark' : 'bg-fire hover:bg-fire-dark'
            }`}
          >
            {isLiked ? (
              <>
                <UserCheck className="w-4 h-4" /> Matched!
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4" /> Connect Now
              </>
            )}
          </button>

          <button
            onClick={handleNext}
            className="p-3 border border-border rounded-xl text-ink/60 hover:text-ink hover:bg-cream/60 transition-all"
            title="Next Profile"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. Harmonized Bottom Social Proof Metrics */}
      <div className="w-full bg-white rounded-2xl p-4 flex items-center justify-around text-center shadow-lg border border-border/80">
        <div className="flex-1 px-1">
          <p className="text-xl font-black text-ink tracking-tight">12.4K+</p>
          <p className="text-[10px] text-ink/50 font-bold uppercase tracking-wider mt-0.5">Verified Users</p>
        </div>
        <div className="h-6 w-px bg-border/60" />
        <div className="flex-1 px-1">
          <p className="text-xl font-black text-fire tracking-tight">96%</p>
          <p className="text-[10px] text-ink/50 font-bold uppercase tracking-wider mt-0.5">Match Accuracy</p>
        </div>
        <div className="h-6 w-px bg-border/60" />
        <div className="flex-1 px-1">
          <p className="text-xl font-black text-teal tracking-tight">₹8.5K</p>
          <p className="text-[10px] text-ink/50 font-bold uppercase tracking-wider mt-0.5">Avg Savings</p>
        </div>
      </div>

      {/* Interactive Modal when clicking Connect */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-border animate-in zoom-in-95">
            <div className="w-16 h-16 bg-fire/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-fire/20">
              <Sparkles className="w-8 h-8 text-fire" />
            </div>

            <span className="inline-block bg-teal/10 text-teal text-xs font-extrabold px-3 py-1 rounded-full mb-2">
              🎉 High Compatibility Match!
            </span>

            <h3 className="text-xl font-extrabold text-ink mb-2">
              Connect with {currentProfile.name}
            </h3>

            <p className="text-xs text-ink/60 leading-relaxed mb-6">
              You share <span className="font-bold text-ink">{currentProfile.matchScore}% lifestyle compatibility</span> including sleep schedule, dietary habits, and room budget in {currentProfile.location}.
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowConnectModal(false);
                  useStore.getState().openAuthModal({
                    title: `Message ${currentProfile.name}`,
                    subtitle: 'Sign in to start safe, direct chatting with no brokerage.',
                    redirect: '/browse-seekers',
                  });
                }}
                className="w-full py-3 bg-fire text-white rounded-xl font-bold text-sm shadow-md hover:bg-fire-dark transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" /> Start Direct Chat
              </button>

              <button
                onClick={() => setShowConnectModal(false)}
                className="w-full py-2.5 border border-border rounded-xl font-semibold text-xs text-ink/60 hover:bg-parchment transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
