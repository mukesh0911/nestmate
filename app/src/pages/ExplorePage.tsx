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
    <div className="min-h-screen bg-[#F8F7F4] pb-24 sm:pb-16 overflow-x-hidden">
      
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Title row */}
        <div className="pt-5 pb-4 sm:pt-7 sm:pb-5">
          <div className="flex items-start justify-between gap-4">
            {/* Left: Title + subtitle */}
            <div className="min-w-0">
              <h1 className="text-[26px] sm:text-[30px] font-bold tracking-tight text-ink leading-none">
                Explore
              </h1>
              <p className="text-[13px] text-ink/50 font-medium mt-1.5 leading-snug">
                {subtitle}
              </p>
            </div>

            {/* Right: Compact segmented tab control */}
            <div className="flex-shrink-0 self-start mt-0.5">
              <div className="flex items-center p-1 bg-white rounded-2xl border border-gray-200 shadow-xs gap-0.5">
                <button
                  type="button"
                  onClick={() => handleTabChange('rooms')}
                  aria-pressed={activeTab === 'rooms'}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all duration-200 cursor-pointer min-h-[36px] ${
                    activeTab === 'rooms'
                      ? 'bg-fire text-white shadow-sm'
                      : 'text-ink/50 hover:text-ink hover:bg-gray-50'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Rooms</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('roommates')}
                  aria-pressed={activeTab === 'roommates'}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all duration-200 cursor-pointer min-h-[36px] ${
                    activeTab === 'roommates'
                      ? 'bg-fire text-white shadow-sm'
                      : 'text-ink/50 hover:text-ink hover:bg-gray-50'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{isOwner ? 'Seekers' : 'Roommates'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Thin divider */}
        <div className="h-px bg-gray-200/80 mb-5" />

        {/* ── Content ─────────────────────────────────────────── */}
        {activeTab === 'rooms' ? <BrowseRooms embedded /> : <BrowseSeekers embedded />}
      </div>
    </div>
  );
}
