import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Globe, Menu, X, ChevronDown, User, LogOut, PlusCircle, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useStore } from '@/store/useStore';
import { cities } from '@/lib/staticData';

interface LandingNavbarProps {
  onListSpace: () => void;
}

export default function LandingNavbar({ onListSpace }: LandingNavbarProps) {
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('EN');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSignOut = async () => {
    await logout();
    setMobileMenuOpen(false);
  };

  const isAuthenticated = !!(user && profile);
  const dashboardPath = profile?.role === 'owner' ? '/owner-dashboard' : '/dashboard';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md shadow-xs border-b border-border/60 py-3'
          : 'bg-transparent py-4 sm:py-5'
      }`}
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-[#E5501A] flex items-center justify-center text-white shadow-xs transition-transform group-hover:scale-105">
            <svg
              viewBox="0 0 24 24"
              className="w-4.5 h-4.5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 10.5L12 3l9 7.5" />
              <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
              <path d="M9 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-[#1A1A2E]">NestMate</span>
        </Link>

        {/* Center: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
          <Link
            to="/explore?tab=rooms"
            className="text-xs font-semibold text-[#1A1A2E]/80 hover:text-[#E5501A] transition-colors"
          >
            Find a Room
          </Link>
          <Link
            to="/explore?tab=roommates"
            className="text-xs font-semibold text-[#1A1A2E]/80 hover:text-[#E5501A] transition-colors"
          >
            Find Flatmates
          </Link>
          <button
            type="button"
            onClick={onListSpace}
            className="text-xs font-semibold text-[#1A1A2E]/80 hover:text-[#E5501A] transition-colors cursor-pointer"
          >
            List Your Space
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('how-it-works')}
            className="text-xs font-semibold text-[#1A1A2E]/80 hover:text-[#E5501A] transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <Link
            to="/safety"
            className="text-xs font-semibold text-[#1A1A2E]/80 hover:text-[#E5501A] transition-colors"
          >
            Safety
          </Link>
          <button
            type="button"
            onClick={() => scrollToSection('community')}
            className="text-xs font-semibold text-[#1A1A2E]/80 hover:text-[#E5501A] transition-colors cursor-pointer"
          >
            Community
          </button>
        </nav>

        {/* Right: Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {/* City Selector Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 text-xs font-medium text-[#1A1A2E] bg-white border border-gray-200/80 px-3.5 py-1.5 rounded-full hover:border-gray-300 hover:bg-gray-50/50 shadow-xs transition-colors cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{selectedLang !== 'EN' ? selectedLang : (useStore.getState().filters.city || profile?.city || 'All India')}</span>
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 max-h-60 overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    useStore.getState().updateFilters({ city: '' });
                    setSelectedLang('All India');
                    setLangDropdownOpen(false);
                    navigate('/explore');
                  }}
                  className="w-full text-left px-3.5 py-1.5 text-gray-700 hover:text-[#E5501A] hover:bg-orange-50/40 transition-colors font-medium border-b border-gray-100"
                >
                  All India (All Cities)
                </button>
                {cities.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      useStore.getState().updateFilters({ city });
                      setSelectedLang(city);
                      setLangDropdownOpen(false);
                      navigate(`/explore?city=${encodeURIComponent(city)}`);
                    }}
                    className="w-full text-left px-3.5 py-1.5 text-gray-700 hover:text-[#E5501A] hover:bg-orange-50/40 transition-colors font-medium"
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to={dashboardPath}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#1A1A2E] text-white text-xs font-semibold hover:bg-black transition-all shadow-xs"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="p-1.5 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="px-2.5 py-1.5 text-xs font-semibold text-[#1A1A2E] hover:text-[#E5501A] transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/login"
                className="px-5 py-2 rounded-full bg-[#1A1A2E] text-xs font-semibold text-white hover:bg-black transition-all shadow-xs"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu right side: City Selector + Hamburger button */}
        <div className="flex items-center gap-2 sm:hidden">
          {/* Mobile City Selector Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1 text-[11px] font-medium text-[#1A1A2E] bg-white border border-gray-200 px-2.5 py-1 rounded-full shadow-xs cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{selectedLang !== 'EN' ? selectedLang : (useStore.getState().filters.city || profile?.city || 'All India')}</span>
              <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-40 max-h-60 overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    useStore.getState().updateFilters({ city: '' });
                    setSelectedLang('All India');
                    setLangDropdownOpen(false);
                    navigate('/explore');
                  }}
                  className="w-full text-left px-3 py-1.5 text-gray-700 hover:text-[#E5501A] hover:bg-orange-50/40 transition-colors font-medium border-b border-gray-100"
                >
                  All India
                </button>
                {cities.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      useStore.getState().updateFilters({ city });
                      setSelectedLang(city);
                      setLangDropdownOpen(false);
                      navigate(`/explore?city=${encodeURIComponent(city)}`);
                    }}
                    className="w-full text-left px-3 py-1.5 text-gray-700 hover:text-[#E5501A] hover:bg-orange-50/40 transition-colors font-medium"
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-xl text-[#1A1A2E] hover:bg-black/5 transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-[#1A1A2E]" />
            ) : (
              <Menu className="w-5 h-5 text-[#1A1A2E]" />
            )}
          </button>
        </div>

        {/* Tablet Hamburger button */}
        <div className="hidden sm:flex lg:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-[#1A1A2E] hover:bg-black/5 transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-[#1A1A2E]" />
            ) : (
              <Menu className="w-6 h-6 text-[#1A1A2E]" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Backdrop & Dropdown Drawer */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-50 lg:hidden bg-white border-b border-gray-200 shadow-2xl px-5 py-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <nav className="flex flex-col space-y-1">
              <Link
                to="/explore?tab=rooms"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-xl text-sm font-semibold text-[#1A1A2E] hover:bg-orange-50 hover:text-[#E5501A] transition-colors"
              >
                Find a Room
              </Link>
              <Link
                to="/explore?tab=roommates"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-xl text-sm font-semibold text-[#1A1A2E] hover:bg-orange-50 hover:text-[#E5501A] transition-colors"
              >
                Find Flatmates
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onListSpace();
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-[#1A1A2E] hover:bg-orange-50 hover:text-[#E5501A] transition-colors cursor-pointer"
              >
                List Your Space
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('how-it-works')}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-[#1A1A2E] hover:bg-orange-50 hover:text-[#E5501A] transition-colors cursor-pointer"
              >
                How It Works
              </button>
              <Link
                to="/safety"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-xl text-sm font-semibold text-[#1A1A2E] hover:bg-orange-50 hover:text-[#E5501A] transition-colors"
              >
                Safety
              </Link>
              <button
                type="button"
                onClick={() => scrollToSection('community')}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-[#1A1A2E] hover:bg-orange-50 hover:text-[#E5501A] transition-colors cursor-pointer"
              >
                Community
              </button>
            </nav>

            <div className="pt-3 border-t border-gray-100 flex flex-col gap-2.5">
              {isAuthenticated ? (
                <>
                  <Link
                    to={dashboardPath}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-3 rounded-full bg-[#1A1A2E] text-white font-semibold text-sm text-center shadow-xs"
                  >
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 rounded-full border border-gray-200 text-center text-sm font-semibold text-[#1A1A2E] hover:bg-gray-50 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 rounded-full bg-[#1A1A2E] text-white text-center text-sm font-semibold shadow-xs hover:bg-black transition-colors"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
