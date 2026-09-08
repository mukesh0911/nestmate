import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Search, Home, CheckCircle } from 'lucide-react';

export default function RoleSelect() {
  const navigate = useNavigate();
  const { setCurrentRole } = useStore();
  const { user, profile, isLoading } = useAuth();
  const { setRole } = useUserProfile();

  useEffect(() => {
    if (!isLoading && profile?.onboardingComplete) {
      navigate(profile.role === 'owner' ? '/owner-dashboard' : '/dashboard', { replace: true });
    }
  }, [isLoading, profile?.onboardingComplete, profile?.role, navigate]);

  const handleSelectRole = async (role: 'seeker' | 'owner') => {
    setCurrentRole(role);
    try {
      if (user?.uid) {
        await setRole(user.uid, role);
      }
    } catch (err: any) {
      console.error('Failed to save selected role:', err);
    }

    navigate(role === 'seeker' ? '/onboarding/seeker' : '/onboarding/owner');
  };

  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center px-4 py-12 page-transition">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-xs font-bold text-fire mb-3 tracking-widest uppercase">Step 1 of 1</p>
          <h1 className="type-h1 mb-3">I want to…</h1>
          <p className="text-ink/60 max-w-md mx-auto">
            Choose your primary role. You can always switch later from your profile settings.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Seeker Card */}
          <button
            type="button"
            onClick={() => handleSelectRole('seeker')}
            className="group relative card-nestmate p-8 text-left transition-all duration-300 hover:shadow-lift hover:-translate-y-1 hover:border-navy/30 overflow-hidden"
          >
            {/* Background Number */}
            <span className="absolute top-4 right-4 text-[120px] font-display italic font-bold text-navy/[0.03] leading-none select-none">
              01
            </span>

            <div className="relative">
              <div className="w-14 h-14 bg-navy/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-navy/20 transition-colors">
                <Search className="w-7 h-7 text-navy" />
              </div>

              <h3 className="type-h3 mb-3 text-navy">Find a Room & Roommate</h3>
              <p className="text-sm text-ink/60 mb-6 leading-relaxed">
                I don't have a flat yet. I want to find both a compatible roommate and a place to live.
              </p>

              <ul className="space-y-2.5 mb-8">
                {[
                  'Browse compatible roommates',
                  'Discover rooms in your budget',
                  'Take the compatibility quiz',
                  'Connect and move in together',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-ink/70">
                    <CheckCircle className="w-4 h-4 text-navy flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="w-full py-3 bg-navy text-white rounded-xl font-medium text-center transition-all group-hover:bg-navy-dark group-hover:shadow-lg">
                Continue as Seeker
              </div>
            </div>

            {/* Hover Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-navy/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>

          {/* Owner Card */}
          <button
            type="button"
            onClick={() => handleSelectRole('owner')}
            className="group relative card-nestmate p-8 text-left transition-all duration-300 hover:shadow-lift hover:-translate-y-1 hover:border-fire/30 overflow-hidden"
          >
            {/* Background Number */}
            <span className="absolute top-4 right-4 text-[120px] font-display italic font-bold text-fire/[0.03] leading-none select-none">
              02
            </span>

            <div className="relative">
              <div className="w-14 h-14 bg-fire/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-fire/20 transition-colors">
                <Home className="w-7 h-7 text-fire" />
              </div>

              <h3 className="type-h3 mb-3 text-fire">List My Room / Flat</h3>
              <p className="text-sm text-ink/60 mb-6 leading-relaxed">
                I already have a flat or room. I want to find a compatible person to share it with.
              </p>

              <ul className="space-y-2.5 mb-8">
                {[
                  'List your room with photos',
                  'Set roommate preferences',
                  'Review applicant profiles',
                  'Choose the best match',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-ink/70">
                    <CheckCircle className="w-4 h-4 text-fire flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="w-full py-3 bg-fire text-white rounded-xl font-medium text-center transition-all group-hover:bg-fire-dark group-hover:shadow-lg">
                Continue as Owner
              </div>
            </div>

            {/* Hover Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-fire/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>
        </div>

        {/* Tip */}
        <p className="text-center text-sm text-ink/40 mt-8">
          You can switch between Seeker and Owner modes anytime from your profile settings.
        </p>
      </div>
    </div>
  );
}
