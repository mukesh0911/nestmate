/**
 * TrustBadge — NestMate's trust verification ladder.
 *
 * Tiers:
 *   Bronze       — Phone verified (every user starts here)
 *   Silver       — Profile ≥60% complete (photo + bio + profession)
 *   Gold         — Work email verified (admin-reviewed)
 *   Verified Pro — Government ID verified via NestMate document review
 *
 * Usage: <TrustBadge profile={profile} size="sm" showLabel />
 */
import { useState } from 'react';
import { Shield, ShieldCheck, Star, Award, X, ChevronRight } from 'lucide-react';
import type { UserProfile } from '@/hooks/useAuth';

// ─── Types ───────────────────────────────────────────────────────────────────

type TrustTier = 'bronze' | 'silver' | 'gold' | 'pro';

interface TrustScore {
  tier: TrustTier;
  score: number;       // 0-100
  label: string;
  steps: TrustStep[];
}

interface TrustStep {
  id: string;
  label: string;
  description: string;
  done: boolean;
  points: number;
}

// ─── Trust computation ────────────────────────────────────────────────────────

/**
 * Compute the trust ladder.
 *
 * @param profile        Firestore user document
 * @param authProviders  Firebase Auth provider IDs for the signed-in user
 *                       (e.g. ['phone'], ['google.com']). Phone verification is
 *                       REAL only when the user authenticated via phone OTP —
 *                       Google/email signups have NOT verified any phone.
 */
export function computeTrustScore(
  profile: UserProfile | null,
  authProviders: string[] = []
): TrustScore {
  if (!profile) {
    return { tier: 'bronze', score: 0, label: 'Bronze', steps: [] };
  }

  const steps: TrustStep[] = [
    {
      id: 'phone',
      label: 'Phone Verified',
      description: 'Your phone number was verified via OTP at sign-in',
      done: authProviders.includes('phone'),
      points: 20,
    },
    {
      id: 'photo',
      label: 'Profile Photo',
      description: 'Add a real photo so people can recognise you',
      done: typeof profile.avatar === 'string' && profile.avatar.length > 0 && !profile.avatar.includes('dicebear'),
      points: 15,
    },
    {
      id: 'bio',
      label: 'Bio Added',
      description: 'Write something about yourself (min 20 chars)',
      done: (profile.bio?.length ?? 0) >= 20,
      points: 10,
    },
    {
      id: 'profession',
      label: 'Profession Filled',
      description: 'Add your profession for better matches',
      done: !!profile.profession,
      points: 10,
    },
    {
      id: 'quiz',
      label: 'Compatibility Quiz',
      description: 'Complete the 10-question lifestyle quiz',
      done: !!profile.quizAnswers && typeof profile.quizAnswers === 'object' && !Array.isArray(profile.quizAnswers) && Object.keys(profile.quizAnswers).length >= 5,
      points: 15,
    },
    {
      id: 'workemail',
      label: 'Work Email Verified',
      description: 'Verify your corporate or educational email',
      done: !!profile.workEmailVerified,
      points: 15,
    },
    {
      id: 'aadhaar',
      label: 'Government ID Verified',
      description: 'Upload a government ID — reviewed by the NestMate team',
      done: !!profile.isVerified,
      points: 15,
    },
  ];

  const score = steps.reduce((sum, s) => sum + (s.done ? s.points : 0), 0);

  let tier: TrustTier = 'bronze';
  let label = 'Bronze';

  if (profile.isVerified) {
    tier = 'pro';
    label = 'Verified Pro';
  } else if (profile.workEmailVerified) {
    tier = 'gold';
    label = 'Gold';
  } else if (score >= 55) {
    tier = 'silver';
    label = 'Silver';
  }

  return { tier, score, label, steps };
}

// ─── Tier config ──────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<TrustTier, {
  bg: string; border: string; text: string; icon: React.ReactNode; glow: string;
}> = {
  bronze: {
    bg: 'bg-amber-100',
    border: 'border-amber-300',
    text: 'text-amber-700',
    icon: <Shield className="w-full h-full" />,
    glow: 'shadow-amber-200',
  },
  silver: {
    bg: 'bg-slate-100',
    border: 'border-slate-300',
    text: 'text-slate-600',
    icon: <Shield className="w-full h-full" />,
    glow: 'shadow-slate-200',
  },
  gold: {
    bg: 'bg-yellow-100',
    border: 'border-yellow-400',
    text: 'text-yellow-700',
    icon: <Star className="w-full h-full fill-current" />,
    glow: 'shadow-yellow-200',
  },
  pro: {
    bg: 'bg-teal-50',
    border: 'border-teal',
    text: 'text-teal',
    icon: <ShieldCheck className="w-full h-full" />,
    glow: 'shadow-teal-100',
  },
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface TrustBadgeProps {
  profile: UserProfile | null;
  /** Auth provider IDs (e.g. ['phone'], ['google.com']) for truthful phone signal */
  authProviders?: string[];
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showTooltip?: boolean;   // open breakdown panel on click
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TrustBadge({
  profile,
  authProviders,
  size = 'sm',
  showLabel = false,
  showTooltip = false,
  className = '',
}: TrustBadgeProps) {
  const [open, setOpen] = useState(false);
  const trust = computeTrustScore(profile, authProviders);
  const cfg = TIER_CONFIG[trust.tier];

  const sizeMap = {
    xs: { outer: 'w-5 h-5', icon: 'w-3 h-3', text: 'text-[9px]' },
    sm: { outer: 'w-7 h-7', icon: 'w-4 h-4', text: 'text-[10px]' },
    md: { outer: 'w-9 h-9', icon: 'w-5 h-5', text: 'text-xs' },
    lg: { outer: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-sm' },
  };

  const sz = sizeMap[size];

  return (
    <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
      <button
        onClick={showTooltip ? () => setOpen(true) : undefined}
        title={`Trust Level: ${trust.label}`}
        className={`
          ${sz.outer} rounded-full flex items-center justify-center flex-shrink-0
          border ${cfg.bg} ${cfg.border} ${cfg.text}
          shadow-sm ${cfg.glow}
          ${showTooltip ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
        `}
        aria-label={`Trust badge: ${trust.label}`}
      >
        <span className={sz.icon}>{cfg.icon}</span>
      </button>

      {showLabel && (
        <span className={`${sz.text} font-semibold ${cfg.text}`}>
          {trust.label}
        </span>
      )}

      {/* Tooltip Panel */}
      {showTooltip && open && (
        <TrustBreakdownPanel
          trust={trust}
          cfg={cfg}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Breakdown panel ──────────────────────────────────────────────────────────

function TrustBreakdownPanel({
  trust,
  cfg,
  onClose,
}: {
  trust: TrustScore;
  cfg: typeof TIER_CONFIG[TrustTier];
  onClose: () => void;
}) {
  const nextTierMap: Record<TrustTier, string | null> = {
    bronze: 'Silver — complete your profile to 55 points',
    silver: 'Gold — verify your work or college email',
    gold: 'Verified Pro — get your government ID reviewed by NestMate',
    pro: null,
  };

  const nextTip = nextTierMap[trust.tier];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-x-4 bottom-4 sm:absolute sm:inset-auto sm:bottom-auto sm:top-full sm:left-0 sm:mt-2 sm:w-80 z-[201]">
        <div className="bg-white rounded-[20px] shadow-2xl p-5 border border-border">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${cfg.bg} ${cfg.text}`}>
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Trust Score</h3>
                <p className={`text-xs font-semibold ${cfg.text}`}>{trust.label}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-ink/5 rounded-full">
              <X className="w-4 h-4 text-ink/40" />
            </button>
          </div>

          {/* Score bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-ink/50 mb-1">
              <span>Trust Points</span>
              <span className="font-bold">{trust.score}/100</span>
            </div>
            <div className="h-2 bg-cream rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${trust.tier === 'pro' ? 'bg-teal' :
                  trust.tier === 'gold' ? 'bg-yellow-400' :
                    trust.tier === 'silver' ? 'bg-slate-400' : 'bg-amber-400'
                  }`}
                style={{ width: `${trust.score}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-2 mb-4">
            {trust.steps.map(step => (
              <div
                key={step.id}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl transition-colors ${step.done ? 'bg-teal/5' : 'bg-cream/50'
                  }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${step.done ? 'bg-teal text-white' : 'bg-ink/10 text-ink/30'
                  }`}>
                  {step.done ? (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-[8px] font-bold">{step.points}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${step.done ? 'text-teal' : 'text-ink/60'}`}>
                    {step.label}
                    {!step.done && <span className="ml-1 text-ink/30 font-normal">+{step.points} pts</span>}
                  </p>
                  {!step.done && (
                    <p className="text-[10px] text-ink/40 leading-relaxed">{step.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Next tier tip */}
          {nextTip && (
            <div className="bg-fire/5 border border-fire/20 rounded-xl p-3 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-fire flex-shrink-0" />
              <p className="text-xs text-fire/80">
                <span className="font-semibold">Level up: </span>{nextTip}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
