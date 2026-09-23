import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft, ShieldCheck, Eye, EyeOff, Lock, User, CheckCircle2,
  Sparkles, MapPin, Briefcase, Calendar, Info, Settings, AlertTriangle
} from 'lucide-react';

export default function ProfilePreview() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [showAnnotations, setShowAnnotations] = useState(true);

  if (!profile) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-sm text-slate-500 mb-4">Please log in to preview your profile.</p>
          <Link to="/login" className="btn-fire py-2 px-4 rounded-xl text-xs font-bold">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Privacy flags
  const isBlurred = (profile as any)?.settings?.blurPhoto || false;
  const isNameInitials = (profile as any)?.settings?.showInitialsOnly || false;
  const isPubliclyVisible = (profile as any)?.isPubliclyVisibleProfile !== false;

  // Masked name logic
  const displayName = isNameInitials
    ? `${profile.name?.charAt(0) || 'U'}.`
    : profile.name || 'Anonymous User';

  return (
    <div className="min-h-screen bg-[#FBF9F6] pb-24">
      {/* Top Navigation Bar */}
      <div className="bg-[#FBF9F6]/95 backdrop-blur-md border-b border-gray-200/60 py-3.5 px-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#1A1A2E] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#E5501A]" />
            <h1 className="font-serif font-medium text-base text-[#1A1A2E]">Public Profile Preview</h1>
          </div>
          <Link
            to="/settings"
            className="text-xs font-semibold text-[#E5501A] hover:underline flex items-center gap-1"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Adjust</span>
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Banner Notice */}
        <div className="bg-[#FFF2EB]/60 border border-[#E5501A]/20 rounded-3xl p-4 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-[#E5501A] shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xs font-bold text-[#1A1A2E] mb-0.5">
                Exact Stranger View
              </h2>
              <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
                This shows precisely how other roommate seekers in your city see your profile before connecting. Phone numbers and private verification documents are strictly hidden.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAnnotations(a => !a)}
            className="text-[11px] font-semibold px-3 py-1.5 bg-white border border-gray-200 text-[#1A1A2E] rounded-full shrink-0 hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
          >
            {showAnnotations ? 'Hide Tags' : 'Show Tags'}
          </button>
        </div>

        {/* Profile Card Projection */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 relative overflow-hidden">
          {/* Public Visibility Chip */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Profile Card
            </span>
            <span className={`text-xs font-semibold px-3 py-0.5 rounded-full ${
              isPubliclyVisible ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {isPubliclyVisible ? 'Active in Discovery' : 'Hidden from Discovery'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-6">
            {/* Avatar with optional blur */}
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-gray-200 bg-[#FBF9F6] flex items-center justify-center shadow-xs">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={displayName}
                    className={`w-full h-full object-cover ${isBlurred ? 'blur-md' : ''}`}
                  />
                ) : (
                  <User className="w-10 h-10 text-gray-300" />
                )}
              </div>
              {showAnnotations && isBlurred && (
                <span className="absolute -bottom-2 -right-2 bg-[#1A1A2E] text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow-xs">
                  Photo Blurred
                </span>
              )}
            </div>

            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h2 className="font-serif font-medium text-xl text-[#1A1A2E]">{displayName}</h2>
                {profile.isVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-gray-500 mb-3 font-medium">
                {[profile.gender, profile.age ? `${profile.age} yrs` : null, profile.profession]
                  .filter(Boolean)
                  .join(' · ')}
              </p>

              {/* Localities */}
              {profile.localities && profile.localities.length > 0 && (
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-gray-600 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-[#E5501A]" />
                  <span>Targeting: <strong className="text-[#1A1A2E]">{profile.localities.join(', ')}</strong></span>
                </div>
              )}

              {/* Budget */}
              {profile.budget && (
                <p className="text-xs text-gray-600">
                  Budget: <strong className="text-[#1A1A2E] font-bold">₹{profile.budget.toLocaleString()}/mo</strong>
                </p>
              )}
            </div>
          </div>

          {/* About / Bio */}
          {profile.bio && (
            <div className="mb-6 bg-[#FBF9F6] rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">About</span>
                {showAnnotations && (
                  <span className="text-[10px] text-emerald-700 font-semibold">Visible to Everyone</span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-normal">{profile.bio}</p>
            </div>
          )}

          {/* Lifestyle Attributes Preview */}
          {profile.quizAnswers && Object.keys(profile.quizAnswers).length > 0 && (
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Lifestyle Habits & Household Norms
                </span>
                {showAnnotations && (
                  <span className="text-[10px] text-emerald-700 font-semibold">Public for Matching</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(profile.quizAnswers).map(([key, val]) => (
                  <span
                    key={key}
                    className="text-xs px-3 py-1.5 rounded-full bg-[#FBF9F6] border border-gray-200 text-gray-700 font-medium"
                  >
                    <strong className="capitalize text-[#1A1A2E]">{key.replace('_', ' ')}:</strong> {String(val)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Masked Contact Guarantee */}
          <div className="p-4 rounded-2xl border border-dashed border-gray-300 bg-[#FBF9F6] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Lock className="w-4 h-4 text-gray-400 shrink-0" />
              <span>Mobile Number: <strong className="font-mono text-[#1A1A2E]">+91 ••••• •••••</strong></span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white border border-gray-200 px-2.5 py-0.5 rounded-full">
              Connections Only
            </span>
          </div>
        </div>

        {/* Adjust Visibility CTA */}
        <div className="text-center pt-2">
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 rounded-full bg-[#E5501A] hover:bg-[#D0400B] active:scale-[0.98] text-white font-semibold text-xs sm:text-sm py-3 px-6 shadow-xs transition-all"
          >
            <Settings className="w-4 h-4" />
            <span>Adjust Privacy & Visibility Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
