import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Building2, Users } from 'lucide-react';
import BrowseRooms from './BrowseRooms';
import BrowseSeekers from './BrowseSeekers';

export default function ExplorePage() {
  const { profile: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const isOwner = currentUser?.role === 'owner';
  const defaultTab = isOwner ? 'roommates' : 'rooms';
  const rawTab = searchParams.get('tab');

  const activeTab = rawTab === 'rooms' || rawTab === 'roommates' ? rawTab : defaultTab;

  const handleTabChange = (tab: 'rooms' | 'roommates') => {
    setSearchParams({ tab }, { replace: true });
  };

  useEffect(() => {
    if (!rawTab) {
      setSearchParams({ tab: defaultTab }, { replace: true });
    }
  }, [rawTab, defaultTab, setSearchParams]);

  const subtitle =
    activeTab === 'rooms'
      ? 'Verified rooms & apartments across India'
      : isOwner
      ? 'Room seekers looking for accommodation'
      : 'Compatible flatmates & room owners near you';

  return (
    <div className="min-h-screen bg-[#fbf9f9] pb-24 sm:pb-16 overflow-x-hidden">
      {/* Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5">
        
        {/* Explore Title & Subtitle */}
        <div className="mb-4">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight mb-1 leading-tight">
            Explore
          </h1>
          {/* Orange Underline Accent Bar */}
          <div className="w-12 h-1 bg-brand-orange rounded-full mb-3" />
          <p className="text-xs sm:text-sm font-medium text-slate-500">
            {subtitle}
          </p>
        </div>

        {/* Segmented Pill Tab Control (Rooms / Seekers) */}
        <div className="mb-5">
          <div className="bg-[#f0ece9] border border-slate-200/80 rounded-full p-1 inline-flex items-center shadow-2xs">
            <button
              type="button"
              onClick={() => handleTabChange('rooms')}
              aria-pressed={activeTab === 'rooms'}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'rooms'
                  ? 'bg-white text-brand-orange shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4 shrink-0" />
              <span>Rooms</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('roommates')}
              aria-pressed={activeTab === 'roommates'}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'roommates'
                  ? 'bg-white text-brand-orange shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>{isOwner ? 'Seekers' : 'Seekers'}</span>
            </button>
          </div>
        </div>

        {/* ── Content (BrowseRooms / BrowseSeekers) ──────────────────────── */}
        {activeTab === 'rooms' ? <BrowseRooms embedded /> : <BrowseSeekers embedded />}
      </div>
    </div>
  );
}
