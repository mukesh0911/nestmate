/**
 * ProfileCompleteness — A progress meter showing how complete a user's
 * profile is, with specific nudges for each missing field.
 *
 * Drives higher profile quality → better matches → higher conversion.
 *
 * Usage: <ProfileCompleteness profile={profile} compact />
 */
import { useNavigate } from 'react-router-dom';
import { Camera, FileText, Briefcase, Brain, Mail, ShieldCheck, ChevronRight } from 'lucide-react';
import type { UserProfile } from '@/hooks/useAuth';

interface ProfileField {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  done: boolean;
  weight: number;      // 0-100, sums to 100
  actionLabel: string;
  actionPath: string;
}

export function getProfileFields(profile: UserProfile | null): ProfileField[] {
  if (!profile) return [];

  const role = profile.role || 'seeker';

  if (role === 'owner') {
    return [
      {
        id: 'photo',
        label: 'Add Profile Photo',
        description: 'A clear photo builds credibility with applicants',
        icon: <Camera className="w-4 h-4" />,
        done: !!profile.avatar && profile.avatar.trim().length > 0,
        weight: 20,
        actionLabel: 'Add Photo',
        actionPath: '/edit-profile',
      },
      {
        id: 'bio',
        label: 'Write Host Bio',
        description: 'Tell prospective tenants about yourself and properties',
        icon: <FileText className="w-4 h-4" />,
        done: !!profile.bio && profile.bio.trim().length >= 5,
        weight: 20,
        actionLabel: 'Write Bio',
        actionPath: '/edit-profile',
      },
      {
        id: 'city',
        label: 'Set City & Locality',
        description: 'Help applicants find your listings in the right area',
        icon: <Briefcase className="w-4 h-4" />,
        done: !!profile.city && profile.city.trim().length > 0,
        weight: 20,
        actionLabel: 'Set City',
        actionPath: '/edit-profile',
      },
      {
        id: 'phone',
        label: 'Verify Phone Number',
        description: 'Enables instant notifications and applicant contact',
        icon: <Mail className="w-4 h-4" />,
        done: !!profile.phone || !!profile.workEmailVerified,
        weight: 20,
        actionLabel: 'Verify Phone',
        actionPath: '/edit-profile',
      },
      {
        id: 'identity',
        label: 'Verify Ownership & ID',
        description: 'Verified badge unlocks active property listings',
        icon: <ShieldCheck className="w-4 h-4" />,
        done: !!profile.isVerified || (profile.verificationLevel ?? 0) >= 1,
        weight: 20,
        actionLabel: 'Verify ID',
        actionPath: '/owner-dashboard?tab=listings',
      },
    ];
  }

  return [
    {
      id: 'photo',
      label: 'Add Profile Photo',
      description: 'A real photo helps people recognise you',
      icon: <Camera className="w-4 h-4" />,
      done: !!profile.avatar && profile.avatar.trim().length > 0,
      weight: 20,
      actionLabel: 'Add Photo',
      actionPath: '/edit-profile',
    },
    {
      id: 'bio',
      label: 'Write Your Bio',
      description: 'Let potential roommates know who you are',
      icon: <FileText className="w-4 h-4" />,
      done: !!profile.bio && profile.bio.trim().length >= 5,
      weight: 15,
      actionLabel: 'Write Bio',
      actionPath: '/edit-profile',
    },
    {
      id: 'profession',
      label: 'Add Profession',
      description: 'Helps match with compatible lifestyles',
      icon: <Briefcase className="w-4 h-4" />,
      done: !!profile.profession && profile.profession.trim().length > 0,
      weight: 15,
      actionLabel: 'Add Profession',
      actionPath: '/edit-profile',
    },
    {
      id: 'quiz',
      label: 'Complete Compatibility Quiz',
      description: '10 questions → accurate roommate matches',
      icon: <Brain className="w-4 h-4" />,
      done: !!profile.quizAnswers && Object.keys(profile.quizAnswers).length >= 5,
      weight: 25,
      actionLabel: 'Take Quiz',
      actionPath: '/seeker-onboarding',
    },
    {
      id: 'workemail',
      label: 'Verify Work / College Email',
      description: 'Boosts trust — earn Gold badge',
      icon: <Mail className="w-4 h-4" />,
      done: !!profile.workEmailVerified,
      weight: 15,
      actionLabel: 'Verify Email',
      actionPath: '/edit-profile',
    },
    {
      id: 'aadhaar',
      label: 'Verify Government ID',
      description: 'Highest trust tier — Verified Pro badge',
      icon: <ShieldCheck className="w-4 h-4" />,
      done: !!profile.isVerified || (profile.verificationLevel ?? 0) >= 1,
      weight: 10,
      actionLabel: 'Verify ID',
      actionPath: '/trust',
    },
  ];
}

export function computeCompleteness(profile: UserProfile | null): number {
  const fields = getProfileFields(profile);
  const total = fields.reduce((sum, f) => sum + (f.done ? f.weight : 0), 0);
  return total;
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface ProfileCompletenessProps {
  profile: UserProfile | null;
  compact?: boolean;        // If true: shows only bar + percentage + first nudge
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProfileCompleteness({
  profile,
  compact = false,
  className = '',
}: ProfileCompletenessProps) {
  const navigate = useNavigate();
  const fields = getProfileFields(profile);
  const pct = computeCompleteness(profile);

  const incomplete = fields.filter(f => !f.done);
  const firstNudge = incomplete[0];

  const barColor =
    pct >= 85 ? 'bg-teal' :
      pct >= 60 ? 'bg-fire' :
        'bg-amber-400';

  if (compact) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-semibold text-ink/50 uppercase tracking-wide">
            Profile {pct}% complete
          </span>
          {firstNudge && (
            <button
              onClick={() => navigate(firstNudge.actionPath)}
              className="text-[10px] text-fire font-medium hover:underline"
            >
              {firstNudge.actionLabel} →
            </button>
          )}
        </div>
        <div className="h-1.5 bg-cream rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} rounded-full transition-all duration-700`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {firstNudge && pct < 100 && (
          <p className="text-[10px] text-ink/40 mt-1 truncate">
            {firstNudge.description}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`card-nestmate p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm">Profile Completeness</h3>
          <p className="text-xs text-ink/50">
            {pct < 100
              ? `${100 - pct} points left to reach 100%`
              : 'Your profile is complete!'}
          </p>
        </div>
        <div className={`text-2xl font-bold ${pct >= 85 ? 'text-teal' : pct >= 60 ? 'text-fire' : 'text-amber-500'
          }`}>
          {pct}%
        </div>
      </div>

      {/* Bar */}
      <div className="h-2.5 bg-cream rounded-full overflow-hidden mb-5">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {fields.map(field => (
          <div
            key={field.id}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${field.done
              ? 'opacity-60'
              : 'bg-fire/3 border border-fire/10 cursor-pointer hover:bg-fire/5'
              }`}
            onClick={field.done ? undefined : () => navigate(field.actionPath)}
          >
            {/* Icon */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${field.done ? 'bg-teal/10 text-teal' : 'bg-fire/10 text-fire'
              }`}>
              {field.done ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : field.icon}
            </div>

            {/* Label + desc */}
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold ${field.done ? 'text-ink/40 line-through' : 'text-ink'}`}>
                {field.label}
              </p>
              {!field.done && (
                <p className="text-[10px] text-ink/40 leading-relaxed truncate">
                  {field.description}
                </p>
              )}
            </div>

            {/* Weight badge or chevron */}
            {field.done ? (
              <span className="text-[9px] font-bold text-teal bg-teal/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                +{field.weight}
              </span>
            ) : (
              <ChevronRight className="w-4 h-4 text-fire/50 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
