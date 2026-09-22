import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useTranslation } from '@/hooks/useTranslation';
import { useState, useEffect, useRef } from 'react';
import {
  Home, Search, MessageCircle, User, Bell, Compass,
  Menu, X, LogOut, Settings, ChevronDown, ChevronRight, Crown,
  FileText, PlusCircle, Map, Sparkles, ShieldCheck, Building2, Users,
  Bookmark, HelpCircle, Heart, UserCheck
} from 'lucide-react';
import type { Notification } from '@/hooks/useNotifications';
import AuthModal from '@/components/AuthModal';
import { useAdmin } from '@/hooks/useAdmin';
import { toast } from 'sonner';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const { isAdmin } = useAdmin();
  const {
    currentRole,
    setCurrentRole,
    authModalOpen,
    authModalTitle,
    authModalSubtitle,
    authModalRedirect,
    closeAuthModal,
    openAuthModal
  } = useStore();
  const { subscribeToNotifications } = useNotifications();
  const { t } = useTranslation();

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Sync role from Firebase profile → Zustand store
  useEffect(() => {
    if (profile?.role && profile.role !== currentRole) {
      setCurrentRole(profile.role);
    }
  }, [profile?.role]);

  // Subscribe to unread notification count
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToNotifications(user.uid, (notifs: Notification[]) => {
      setUnreadCount(notifs.filter(n => !n.read).length);
    });
    return () => unsub();
  }, [user?.uid]);

  const [showBottomNav, setShowBottomNav] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 50);

      // Keep bottom nav visible if mobile menu drawer is open
      if (mobileMenuOpen) {
        setShowBottomNav(true);
        return;
      }

      // Always show near the very top of the page
      if (currentScrollY < 30) {
        setShowBottomNav(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Scrolling DOWN -> smoothly hide bottom navigation bar
      if (currentScrollY > lastScrollY.current + 8) {
        setShowBottomNav(false);
      }
      // Scrolling UP -> smoothly restore bottom navigation bar
      else if (currentScrollY < lastScrollY.current - 6) {
        setShowBottomNav(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileMenuOpen]);

  // Close dropdown when clicking elsewhere
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileDropdown && !(e.target as HTMLElement).closest('.profile-dropdown-container')) {
        setProfileDropdown(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [profileDropdown]);

  const isAuthenticated = !!(user && profile);
  const effectiveRole = profile?.role || currentRole || 'seeker';

  const standardLinks = [
    { path: '/explore?tab=rooms', label: 'Rooms', icon: Building2 },
    { path: '/explore?tab=roommates', label: 'Flatmates', icon: Users },
    { path: '/chat', label: t('messages') || 'Messages', icon: MessageCircle, badge: unreadCount > 0 ? unreadCount : undefined },
    { path: '/profile', label: t('profile') || 'Profile', icon: User },
  ];

  const ownerLinks = [
    { path: '/owner-dashboard', label: 'Overview', icon: Home },
    { path: '/owner-dashboard?tab=listings', label: 'My Listings', icon: Building2 },
    { path: '/owner-dashboard?tab=applicants', label: 'Applicants', icon: Users },
    { path: '/owner-dashboard?tab=seekers', label: 'Find Seekers', icon: Compass },
    { path: '/chat', label: t('messages') || 'Messages', icon: MessageCircle, badge: unreadCount > 0 ? unreadCount : undefined },
    { path: '/profile', label: t('profile') || 'Profile', icon: User },
  ];

  const links = effectiveRole === 'owner'
    ? ownerLinks
    : standardLinks;

  const isLinkActive = (linkPath: string): boolean => {
    const currentFullPath = location.pathname + location.search;

    if (linkPath.includes('?')) {
      const [targetPath, targetSearch] = linkPath.split('?');
      if (location.pathname !== targetPath) return false;

      const targetParams = new URLSearchParams(targetSearch);
      const currentParams = new URLSearchParams(location.search);
      for (const [k, v] of targetParams.entries()) {
        const currentVal = currentParams.get(k);
        // Default tab on /explore is 'rooms' if query param is omitted
        if (k === 'tab' && v === 'rooms' && !currentVal) continue;
        if (currentVal !== v) return false;
      }
      return true;
    }

    if (location.pathname === linkPath) {
      if (location.search) {
        const hasSpecificMatch = links.some(
          l => l.path !== linkPath && l.path.startsWith(linkPath + '?') && isLinkActive(l.path)
        );
        if (hasSpecificMatch) return false;
      }
      return true;
    }

    if (linkPath === '/explore' && location.pathname.startsWith('/explore')) {
      return true;
    }

    return false;
  };

  const handleLogout = async () => {
    setProfileDropdown(false);
    setMobileMenuOpen(false);
    await logout();
    navigate('/');
  };

  const handlePostRoomClick = () => {
    if (!isAuthenticated) {
      openAuthModal({
        title: 'Post Your Room Listing',
        subtitle: 'Sign in or use a 1-click demo account to list your room and find compatible flatmates.',
        redirect: '/owner-dashboard',
      });
    } else if (effectiveRole === 'owner') {
      navigate('/edit-listing/new');
    } else {
      toast.info('Posting a room is an Owner feature. Switch to Owner mode in Settings.');
      navigate('/settings');
    }
  };

  if (location.pathname === '/') {
    return (
      <div className="min-h-screen bg-parchment overflow-x-clip md:overflow-x-visible">
        <AuthModal
          isOpen={authModalOpen}
          onClose={closeAuthModal}
          title={authModalTitle}
          subtitle={authModalSubtitle}
          redirectAfterLogin={authModalRedirect}
        />
        <main id="main-content" className="min-h-screen overflow-x-clip md:overflow-x-visible">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment overflow-x-clip md:overflow-x-visible">
      {/* Auth Modal Rendered Globally */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={closeAuthModal}
        title={authModalTitle}
        subtitle={authModalSubtitle}
        redirectAfterLogin={authModalRedirect}
      />

      {/* Navigation Bar */}
      <nav aria-label="Main navigation" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 pt-safe ${scrolled ? 'bg-[#FBF9F6]/95 backdrop-blur-md shadow-xs border-b border-gray-200/60' : 'bg-[#FBF9F6]/90 backdrop-blur-md border-b border-gray-200/40'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-[60px]">
            {/* Logo */}
            <Link to={effectiveRole === 'owner' ? '/owner-dashboard' : '/'} className="flex items-center gap-2.5 group">
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

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-6 h-[60px]">
              {links.map((link) => {
                const isActive = isLinkActive(link.path);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative flex items-center gap-1.5 h-full text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'text-[#E5501A]'
                        : 'text-[#1A1A2E]/70 hover:text-[#1A1A2E]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                    {link.badge !== undefined && link.badge > 0 && (
                      <span className="min-w-[15px] h-3.5 bg-[#E5501A] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                        {link.badge}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#E5501A] rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Admin Portal Quick Link */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-black text-white font-semibold text-xs transition-all shadow-xs border border-slate-700 active:scale-[0.98]"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Admin Portal</span>
                </Link>
              )}

              {/* + Post Room CTA (Desktop / Tablet) */}
              <button
                onClick={handlePostRoomClick}
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#E5501A] hover:bg-[#D0400B] text-white font-semibold text-xs sm:text-sm transition-all shadow-sm shadow-[#E5501A]/20 cursor-pointer active:scale-[0.98]"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Post Room</span>
              </button>

              {/* Notifications (All screens) */}
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    openAuthModal({ title: 'Notifications', redirect: '/notifications' });
                  } else {
                    navigate('/notifications');
                  }
                }}
                className="inline-flex relative p-2 rounded-full text-[#1A1A2E]/70 hover:text-[#1A1A2E] hover:bg-black/5 transition-all cursor-pointer"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              >
                <Bell className="w-4 h-4" />
                {(unreadCount > 0 || !isAuthenticated) && (
                  <span className="absolute top-1 right-1 min-w-[15px] h-3.5 bg-[#E5501A] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : ''}
                  </span>
                )}
              </button>

              {/* Desktop Profile Menu */}
              {isAuthenticated ? (
                <>
                  {/* Desktop Dropdown */}
                  <div className="relative hidden sm:block profile-dropdown-container">
                    <button
                      onClick={() => setProfileDropdown(!profileDropdown)}
                      className="flex items-center gap-2 px-3 py-1 rounded-full hover:bg-black/5 transition-all border border-gray-200/80 bg-white shadow-xs cursor-pointer"
                    >
                      <div className="relative w-7 h-7 shrink-0">
                        {(profile?.avatar || user?.photoURL) && !(profile?.avatar || user?.photoURL)?.includes('dicebear') ? (
                          <img
                            src={profile?.avatar || user?.photoURL || undefined}
                            alt={profile?.name || user?.displayName || 'User'}
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 min-w-[28px] max-w-[28px] min-h-[28px] max-h-[28px] rounded-full border border-gray-200 object-cover shrink-0"
                          />
                        ) : (
                          <div aria-hidden="true" className="w-7 h-7 rounded-full border border-gray-200 bg-[#FFF2EB] text-[#E5501A] flex items-center justify-center text-[10px] font-bold shrink-0">
                            {(profile?.name || user?.displayName || 'U').trim().charAt(0).toUpperCase()}
                          </div>
                        )}
                        {profile?.isPremium && (
                          <Crown className="absolute -top-1 -right-1 w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                        )}
                      </div>
                      <span className="text-xs font-semibold text-[#1A1A2E] max-w-[90px] truncate">{profile?.name?.split(' ')[0] || 'User'}</span>
                      <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${profileDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {profileDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fade-up">
                        <div className="px-4 py-3 border-b border-gray-100 bg-[#FBF9F6]">
                          <p className="text-sm font-bold text-[#1A1A2E] truncate">{profile.name}</p>
                          <p className="text-xs text-gray-500 truncate">{profile.phone || user.email || ''}</p>
                          <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FFF2EB] text-[#E5501A]">
                            {effectiveRole === 'owner' ? 'Property Owner' : 'Room Seeker'}
                          </div>
                        </div>
                        <div className="py-1.5 px-1 space-y-0.5">
                          {isAdmin && (
                            <button
                              onClick={() => { setProfileDropdown(false); navigate('/admin'); }}
                              className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-[#1A1A2E] hover:bg-gray-50 rounded-xl transition-all cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                <span>Admin Portal</span>
                              </div>
                              <span className="text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
                                Admin
                              </span>
                            </button>
                          )}
                          <button
                            onClick={() => { setProfileDropdown(false); navigate(effectiveRole === 'owner' ? '/owner-dashboard' : '/explore?tab=rooms'); }}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold text-[#1A1A2E]/80 hover:text-[#1A1A2E] hover:bg-gray-50 rounded-xl transition-all cursor-pointer"
                          >
                            <Building2 className="w-4 h-4 text-[#E5501A]" /> {effectiveRole === 'owner' ? t('dashboard') : 'Explore Rooms'}
                          </button>
                          <button
                            onClick={() => { setProfileDropdown(false); navigate('/profile'); }}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold text-[#1A1A2E]/80 hover:text-[#1A1A2E] hover:bg-gray-50 rounded-xl transition-all cursor-pointer"
                          >
                            <User className="w-4 h-4 text-[#1A1A2E]" /> {t('profile')}
                          </button>
                          <button
                            onClick={() => { setProfileDropdown(false); navigate('/settings'); }}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold text-[#1A1A2E]/80 hover:text-[#1A1A2E] hover:bg-gray-50 rounded-xl transition-all cursor-pointer"
                          >
                            <Settings className="w-4 h-4 text-gray-500" /> {t('settings')}
                          </button>
                          <button
                            onClick={() => { setProfileDropdown(false); logout(); }}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                          >
                            <LogOut className="w-4 h-4" /> {t('logout')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile Compact Circular Avatar (Matching Screenshot) */}
                  <button
                    onClick={() => navigate('/profile')}
                    className="sm:hidden w-9 h-9 rounded-full border border-gray-200/90 overflow-hidden shrink-0 shadow-2xs cursor-pointer flex items-center justify-center bg-[#FFF2EB]"
                    aria-label="View Profile"
                  >
                    {(profile?.avatar || user?.photoURL) && !(profile?.avatar || user?.photoURL)?.includes('dicebear') ? (
                      <img
                        src={profile?.avatar || user?.photoURL || undefined}
                        alt={profile?.name || user?.displayName || 'User'}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-[#E5501A]">
                        {(profile?.name || user?.displayName || 'U').trim().charAt(0).toUpperCase()}
                      </span>
                    )}
                  </button>
                </>
              ) : (
                <>
                  {/* Desktop Sign In Button */}
                  <button
                    onClick={() => openAuthModal({ title: 'Sign In to NestMate', subtitle: 'Sign in to access your profile, saved rooms, and messages.' })}
                    className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full hover:bg-black/5 transition-all border border-gray-200/80 bg-white shadow-xs cursor-pointer text-xs font-semibold text-[#1A1A2E]"
                  >
                    <User className="w-3.5 h-3.5 text-gray-500" />
                    <span>Sign In</span>
                  </button>

                  {/* Mobile Peach Circular Avatar (Matching Reference Top Right) */}
                  <button
                    onClick={() => openAuthModal({ title: 'Sign In to NestMate', subtitle: 'Sign in to access your profile, saved rooms, and messages.' })}
                    className="sm:hidden w-9 h-9 rounded-full bg-[#FFE8D6] border border-[#FFD0B0] flex items-center justify-center text-[#E5501A] shadow-2xs cursor-pointer active:scale-95 shrink-0"
                    title="Sign In"
                    aria-label="Sign In"
                  >
                    <User className="w-4.5 h-4.5 text-[#E5501A]" />
                  </button>
                </>
              )}

              {/* Mobile Menu Toggle (hidden on mobile since bottom nav has dedicated Menu tab) */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="hidden p-2 rounded-xl text-[#1A1A2E]/80 hover:text-[#1A1A2E] hover:bg-black/5 cursor-pointer"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

      </nav>

      {/* Main Content — extra bottom pad on mobile for bottom nav + safe area */}
      <main
        id="main-content"
        className="pt-[60px] pb-[calc(76px+env(safe-area-inset-bottom,0px))] md:pb-0 min-h-screen overflow-x-clip md:overflow-x-visible"
      >
        <div key={location.pathname} className="page-transition">
          <Outlet />
        </div>
      </main>

      {/* Mobile Menu Drawer (Slide-Up Sheet) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end animate-fade-in" role="dialog" aria-modal="true" aria-label="Navigation Menu">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Sheet */}
          <div className="relative z-10 bg-[#FBF9F6] rounded-t-[28px] border-t border-gray-200/80 shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="pt-3.5 pb-2 px-5 flex items-center justify-between border-b border-gray-200/60 bg-[#FBF9F6] shrink-0">
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2.5" />
              <div className="flex items-center gap-2 pt-1">
                <span className="text-base font-bold text-[#1A1A2E]">Menu</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-full text-gray-500 hover:text-[#1A1A2E] hover:bg-black/5 cursor-pointer pt-1"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto px-4 py-4 space-y-3.5 flex-1">
              {/* User / Guest Status Card */}
              {isAuthenticated ? (
                <div className="p-3.5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-lg font-bold text-[#E5501A] shrink-0 overflow-hidden">
                    {profile?.avatar ? (
                      <img src={profile.avatar} alt={profile.name || 'User'} className="w-full h-full object-cover" />
                    ) : (
                      (profile?.name || user?.email || 'U')[0].toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#1A1A2E] truncate">{profile?.name || user?.email?.split('@')[0] || 'User'}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-[#E5501A] border border-orange-200/60 capitalize">
                        {effectiveRole === 'owner' ? 'Property Owner' : 'Room Seeker'}
                      </span>
                      {profile?.city && (
                        <span className="text-[11px] text-gray-500 truncate">• {profile.city}</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/60 shadow-2xs space-y-2.5">
                  <div>
                    <p className="text-xs font-bold text-[#1A1A2E]">Welcome to NestMate</p>
                    <p className="text-[11px] text-gray-600 mt-0.5">Find verified rooms and compatible flatmates in Bangalore.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => { setMobileMenuOpen(false); openAuthModal(); }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-[#E5501A] bg-white border border-[#E5501A]/30 shadow-2xs cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Demo
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                      className="w-full flex items-center justify-center py-2 px-3 rounded-xl text-xs font-bold text-white bg-[#1A1A2E] shadow-2xs cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              )}

              {/* + Post Room CTA */}
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); handlePostRoomClick(); }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#E5501A] hover:bg-[#D0400B] text-white font-bold text-xs sm:text-sm shadow-sm shadow-[#E5501A]/20 cursor-pointer active:scale-[0.99] transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Post Room Listing</span>
              </button>

              {/* Admin Portal if Admin */}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Admin Portal</span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                    Admin
                  </span>
                </Link>
              )}

              {/* Secondary Navigation Section */}
              <div className="bg-white rounded-2xl border border-gray-200/70 divide-y divide-gray-100 overflow-hidden shadow-2xs">
                {/* Explore / Dashboard primary link */}
                <Link
                  to={isAuthenticated ? (effectiveRole === 'owner' ? '/owner-dashboard' : '/explore?tab=rooms') : '/explore?tab=rooms'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#E5501A] flex items-center justify-center">
                      {effectiveRole === 'owner' ? <Home className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                    </div>
                    <span className="text-xs font-semibold text-[#1A1A2E]">
                      {effectiveRole === 'owner' ? 'Owner Dashboard' : 'Explore Rooms'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>

                {/* Browse Seekers link for Owners */}
                {effectiveRole === 'owner' && (
                  <Link
                    to="/owner-dashboard?tab=seekers"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Compass className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-[#1A1A2E]">Browse Room Seekers</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                )}

                {/* Saved */}
                <Link
                  to={isAuthenticated ? '/explore?tab=saved' : '/login'}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (!isAuthenticated) openAuthModal({ title: 'Saved Rooms', redirect: '/explore?tab=saved' });
                  }}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                      <Heart className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-[#1A1A2E]">Saved Listings</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>

                {/* My Applications / Interests / Applicants */}
                <Link
                  to={
                    isAuthenticated
                      ? effectiveRole === 'owner'
                        ? '/owner-dashboard?tab=applicants'
                        : '/explore?tab=connections'
                      : '/login'
                  }
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (!isAuthenticated) openAuthModal({ title: 'My Connections', redirect: '/explore?tab=connections' });
                  }}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-[#1A1A2E]">
                      {effectiveRole === 'owner' ? 'Applicants & Inquiries' : 'My Applications / Interests'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>

                {/* My Listings (for owner) */}
                {(effectiveRole === 'owner' || (profile as any)?.ownerType === 'owner_flatmate') && (
                  <Link
                    to="/owner-dashboard?tab=listings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-[#1A1A2E]">My Listings</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                )}

                {/* Settings */}
                <Link
                  to="/settings"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (!isAuthenticated) openAuthModal({ title: 'Settings', redirect: '/settings' });
                  }}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Settings className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-[#1A1A2E]">Settings</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>

                {/* Safety */}
                <Link
                  to="/safety"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-[#1A1A2E]">Safety Center</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>

                {/* Help & Support */}
                <Link
                  to="/help"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-[#1A1A2E]">Help &amp; Support</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              </div>

              {/* Logout (if logged in) */}
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white border border-rose-200 text-rose-600 font-bold text-xs hover:bg-rose-50 cursor-pointer shadow-2xs transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('logout') || 'Log Out'}</span>
                </button>
              )}
            </div>

            {/* Bottom inset spacing */}
            <div className="pb-[max(12px,env(safe-area-inset-bottom,0px))]" />
          </div>
        </div>
      )}

      {/* FINAL MOBILE BOTTOM NAVIGATION: Exactly 4 items: Rooms | Messages | Profile | Menu */}
      <nav
        aria-label="Mobile navigation"
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FBF9F6]/95 backdrop-blur-md border-t border-gray-200/70 shadow-[0_-4px_20px_rgba(26,26,46,0.06)] pt-1 pb-[max(4px,env(safe-area-inset-bottom,0px))] transition-all duration-300 ease-in-out ${
          showBottomNav
            ? 'translate-y-0 opacity-100'
            : 'translate-y-[120%] opacity-0 pointer-events-none'
        }`}
      >
        <div className="grid grid-cols-4 h-[54px] w-full px-1">
          {/* 1. DASHBOARD (FOR OWNER) / ROOMS (FOR SEEKER) */}
          <Link
            to={effectiveRole === 'owner' ? '/owner-dashboard' : '/explore?tab=rooms'}
            onClick={() => setMobileMenuOpen(false)}
            className={`relative flex flex-col items-center justify-center h-full transition-all cursor-pointer ${
              (effectiveRole === 'owner' ? location.pathname.startsWith('/owner-dashboard') : (isLinkActive('/explore') || location.pathname.startsWith('/room/') || location.pathname.startsWith('/browse-')))
                ? 'text-[#E5501A] font-bold'
                : 'text-[#1A1A2E]/60 hover:text-[#1A1A2E]'
            }`}
          >
            {(effectiveRole === 'owner' ? location.pathname.startsWith('/owner-dashboard') : (isLinkActive('/explore') || location.pathname.startsWith('/room/') || location.pathname.startsWith('/browse-'))) && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#E5501A] rounded-b-full shadow-xs" />
            )}
            {effectiveRole === 'owner' ? (
              <Home className="w-5 h-5" aria-hidden />
            ) : (
              <Building2 className="w-5 h-5" aria-hidden />
            )}
            <span className="text-[10px] font-semibold mt-1 tracking-tight">
              {effectiveRole === 'owner' ? 'Dashboard' : 'Rooms'}
            </span>
          </Link>

          {/* 2. MESSAGES */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              if (!isAuthenticated) {
                openAuthModal({ title: 'Sign In to View Messages', redirect: '/chat' });
              } else {
                navigate('/chat');
              }
            }}
            className={`relative flex flex-col items-center justify-center h-full transition-all cursor-pointer ${
              location.pathname.startsWith('/chat')
                ? 'text-[#E5501A] font-bold'
                : 'text-[#1A1A2E]/60 hover:text-[#1A1A2E]'
            }`}
          >
            {location.pathname.startsWith('/chat') && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#E5501A] rounded-b-full shadow-xs" />
            )}
            <div className="relative">
              <MessageCircle className="w-5 h-5" aria-hidden />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-[15px] h-3.5 bg-[#E5501A] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold mt-1 tracking-tight">Messages</span>
          </button>

          {/* 3. PROFILE */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              if (!isAuthenticated) {
                openAuthModal({ title: 'Sign In to View Profile', redirect: '/profile' });
              } else {
                navigate('/profile');
              }
            }}
            className={`relative flex flex-col items-center justify-center h-full transition-all cursor-pointer ${
              (location.pathname.startsWith('/profile') || location.pathname.startsWith('/edit-profile')) && !mobileMenuOpen
                ? 'text-[#E5501A] font-bold'
                : 'text-[#1A1A2E]/60 hover:text-[#1A1A2E]'
            }`}
          >
            {(location.pathname.startsWith('/profile') || location.pathname.startsWith('/edit-profile')) && !mobileMenuOpen && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#E5501A] rounded-b-full shadow-xs" />
            )}
            <User className="w-5 h-5" aria-hidden />
            <span className="text-[10px] font-semibold mt-1 tracking-tight">Profile</span>
          </button>

          {/* 4. MENU */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`relative flex flex-col items-center justify-center h-full transition-all cursor-pointer ${
              mobileMenuOpen
                ? 'text-[#E5501A] font-bold'
                : 'text-[#1A1A2E]/60 hover:text-[#1A1A2E]'
            }`}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#E5501A] rounded-b-full shadow-xs" />
            )}
            <Menu className="w-5 h-5" aria-hidden />
            <span className="text-[10px] font-semibold mt-1 tracking-tight">Menu</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
