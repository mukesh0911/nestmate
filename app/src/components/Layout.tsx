import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useTranslation } from '@/hooks/useTranslation';
import { useState, useEffect } from 'react';
import {
  Home, Search, MessageCircle, User, Bell, Compass,
  Menu, X, LogOut, Settings, ChevronDown, Crown,
  FileText, PlusCircle, Map, Sparkles
} from 'lucide-react';
import type { Notification } from '@/hooks/useNotifications';
import AuthModal from '@/components/AuthModal';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const guestLinks = [
    { path: '/explore', label: 'Explore', icon: Compass },
    { path: '/map', label: 'Map View', icon: Map },
  ];

  const seekerLinks = [
    { path: '/dashboard', label: t('dashboard'), icon: Home },
    { path: '/explore', label: 'Explore', icon: Compass },
    { path: '/chat', label: t('messages'), icon: MessageCircle },
  ];

  const ownerLinks = [
    { path: '/owner-dashboard', label: t('dashboard'), icon: Home },
    { path: '/explore', label: 'Explore', icon: Compass },
    { path: '/chat', label: t('messages'), icon: MessageCircle },
  ];

  const links = !isAuthenticated
    ? guestLinks
    : effectiveRole === 'owner'
    ? ownerLinks
    : seekerLinks;

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
        subtitle: 'Sign in or use a 1-click demo account to list your room and find verified flatmates.',
        redirect: '/owner-dashboard',
      });
    } else {
      // Always go to owner-dashboard; onboarding questions appear only when "Create Listing" is clicked
      navigate('/owner-dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-parchment overflow-x-hidden">
      {/* Auth Modal Rendered Globally */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={closeAuthModal}
        title={authModalTitle}
        subtitle={authModalSubtitle}
        redirectAfterLogin={authModalRedirect}
      />

      {/* Navigation Bar */}
      <nav aria-label="Main navigation" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 pt-safe ${
        scrolled ? 'frosted-glass shadow-sm border-b border-border/40' : 'bg-parchment/90 backdrop-blur-lg border-b border-border/30'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-[60px]">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-orange flex items-center justify-center text-white shadow-xs">
                <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">NestMate</span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {links.map((link) => {
                const isActive = location.pathname === link.path || (link.path === '/explore' && location.pathname.startsWith('/explore'));
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-ink text-white shadow-xs'
                        : 'text-ink/70 hover:text-ink hover:bg-ink/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center gap-2.5">
              {/* + Post Room CTA (Visible to everyone) */}
              <button
                onClick={handlePostRoomClick}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-fire/10 text-fire hover:bg-fire hover:text-white font-semibold text-xs transition-all shadow-2xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Post Room</span>
              </button>

              {isAuthenticated ? (
                <>
                  {/* Notifications */}
                  <button
                    onClick={() => navigate('/notifications')}
                    className="relative p-2 rounded-xl text-ink/70 hover:text-ink hover:bg-ink/5 transition-all"
                    aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-fire text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Desktop Profile Menu */}
                  <div className="relative hidden sm:block profile-dropdown-container">
                    <button
                      onClick={() => setProfileDropdown(!profileDropdown)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-ink/5 transition-all border border-border/50 bg-white/60"
                    >
                      <div className="relative">
                        <img
                          src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`}
                          alt={profile.name}
                          className="w-7 h-7 rounded-full border-2 border-fire/30 object-cover"
                        />
                        {profile.isPremium && (
                          <Crown className="absolute -top-1 -right-1 w-3.5 h-3.5 text-gold" />
                        )}
                      </div>
                      <span className="text-xs font-semibold text-ink max-w-[100px] truncate">{profile.name?.split(' ')[0] || 'User'}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-ink/40 transition-transform ${profileDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {profileDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-border overflow-hidden z-50 animate-fade-up">
                        <div className="px-4 py-3 border-b border-border/50 bg-cream/30">
                          <p className="text-sm font-bold text-ink">{profile.name}</p>
                          <p className="text-xs text-ink/50 truncate">{profile.phone || user.email || ''}</p>
                        </div>
                        <div className="py-1">
                          <button
                            onClick={() => { setProfileDropdown(false); navigate(effectiveRole === 'owner' ? '/owner-dashboard' : '/dashboard'); }}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-ink/80 hover:bg-cream/50 transition-all font-medium"
                          >
                            <Home className="w-4 h-4 text-fire" /> {t('dashboard')}
                          </button>
                          <button
                            onClick={() => { setProfileDropdown(false); navigate('/profile'); }}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-ink/80 hover:bg-cream/50 transition-all font-medium"
                          >
                            <User className="w-4 h-4 text-navy" /> {t('profile')}
                          </button>
                          <button
                            onClick={() => { setProfileDropdown(false); navigate('/settings'); }}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-ink/80 hover:bg-cream/50 transition-all font-medium"
                          >
                            <Settings className="w-4 h-4 text-ink/60" /> {t('settings')}
                          </button>
                        </div>
                        <div className="border-t border-border/50 py-1">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-all font-medium"
                          >
                            <LogOut className="w-4 h-4" /> {t('logout')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Guest Auth Actions */
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openAuthModal()}
                    className="hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-xl border border-fire/30 text-fire bg-fire/5 hover:bg-fire/10 font-bold text-xs transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Demo Login</span>
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-3 py-1.5 text-xs font-bold text-ink/80 hover:text-ink hover:bg-ink/5 rounded-xl transition-all"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="btn-fire text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs"
                  >
                    Get Started
                  </button>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-ink/70 hover:text-ink hover:bg-ink/5"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileMenuOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-border shadow-lg animate-fade-in">
            <div className="px-4 py-3 space-y-1">
              <button
                onClick={() => { setMobileMenuOpen(false); handlePostRoomClick(); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-fire text-white font-bold text-sm shadow-sm mb-2"
              >
                <PlusCircle className="w-4 h-4" />
                + Post Room Listing
              </button>

              {links.map((link) => {
                const isActive = location.pathname === link.path || (link.path === '/explore' && location.pathname.startsWith('/explore'));
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive ? 'bg-ink text-white' : 'text-ink/80 hover:bg-ink/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                );
              })}

              {!isAuthenticated ? (
                <div className="pt-2 space-y-2 border-t border-border/50">
                  <button
                    onClick={() => { setMobileMenuOpen(false); openAuthModal(); }}
                    className="w-full btn-outline flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-fire border-fire/30"
                  >
                    <Sparkles className="w-4 h-4" /> Try Instant Demo
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                    className="w-full btn-ghost py-2.5 rounded-xl text-sm font-bold"
                  >
                    Log In / Register
                  </button>
                </div>
              ) : (
                <div className="pt-2 space-y-1 border-t border-border/50">
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-ink/80 hover:bg-ink/5"
                  >
                    <User className="w-5 h-5 text-navy" />
                    {t('profile')}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 w-full text-left"
                  >
                    <LogOut className="w-5 h-5" />
                    {t('logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content — extra bottom pad on mobile for bottom nav + safe area */}
      <main
        id="main-content"
        className={`pt-[60px] ${
          location.pathname === '/map'
            ? 'pb-0 h-[calc(100dvh-60px-68px-env(safe-area-inset-bottom,0px))] md:h-[calc(100dvh-60px)] overflow-hidden'
            : 'pb-[calc(68px+env(safe-area-inset-bottom,0px))] md:pb-0 min-h-screen overflow-x-hidden'
        }`}
      >
        <div key={location.pathname} className={`page-transition ${location.pathname === '/map' ? 'h-full w-full flex flex-col' : ''}`}>
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Bar */}
      <nav aria-label="Mobile navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] pt-0 pb-1">
        <div className="flex items-center justify-around h-[56px] px-1 sm:px-2">
          {links.map((link) => {
            const isActive = location.pathname === link.path || (link.path === '/explore' && location.pathname.startsWith('/explore'));
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[48px] flex-1 max-w-[72px] h-full transition-all ${
                  isActive ? 'text-brand-orange font-bold' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-orange rounded-b-full shadow-2xs" />
                )}
                <Icon className="w-5 h-5" aria-hidden />
                <span className="text-[10px] font-semibold mt-1 tracking-tight truncate max-w-[64px] px-0.5">{link.label}</span>
              </Link>
            );
          })}
          {isAuthenticated ? (
            <Link
              to="/profile"
              className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[48px] flex-1 max-w-[72px] h-full transition-all ${
                location.pathname === '/profile' ? 'text-brand-orange font-bold' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              {location.pathname === '/profile' && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-orange rounded-b-full shadow-2xs" />
              )}
              <User className="w-5 h-5" aria-hidden />
              <span className="text-[10px] font-semibold mt-1 tracking-tight">{t('profile')}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal()}
              aria-label="Open demo or sign in"
              className="relative flex flex-col items-center justify-center min-w-[56px] min-h-[44px] flex-1 max-w-[72px] h-full text-brand-orange font-bold"
            >
              <Sparkles className="w-5 h-5" aria-hidden />
              <span className="text-[10px] font-semibold mt-1 tracking-tight">Demo</span>
            </button>
          )}
        </div>
        {/* iOS Home Indicator Bar */}
        <div className="w-32 h-1 bg-slate-900/80 rounded-full mx-auto my-1" />
      </nav>
    </div>
  );
}
