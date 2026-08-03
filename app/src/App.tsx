import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState, Suspense, lazy } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useActiveTracking } from '@/hooks/useActiveTracking';
import { Loader2 } from 'lucide-react';

// ----- Lazy-loaded pages (code splitting) -----
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const AuthPage = lazy(() => import('@/pages/AuthPage'));
const PhoneLogin = lazy(() => import('@/pages/PhoneLogin'));
const OTPVerify = lazy(() => import('@/pages/OTPVerify'));
const RoleSelect = lazy(() => import('@/pages/RoleSelect'));
const SeekerOnboarding = lazy(() => import('@/pages/SeekerOnboarding'));
const OwnerOnboarding = lazy(() => import('@/pages/OwnerOnboarding'));
const SeekerDashboard = lazy(() => import('@/pages/SeekerDashboard'));
const OwnerDashboard = lazy(() => import('@/pages/OwnerDashboard'));
const BrowseDashboard = lazy(() => import('@/pages/BrowseDashboard'));
const RoomDetail = lazy(() => import('@/pages/RoomDetail'));
const MatchDetail = lazy(() => import('@/pages/MatchDetail'));
const ChatPage = lazy(() => import('@/pages/ChatPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const EditProfile = lazy(() => import('@/pages/EditProfile'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));

const HowItWorks = lazy(() => import('@/pages/HowItWorks'));
const PricingPage = lazy(() => import('@/pages/PricingPage'));
const AboutUs = lazy(() => import('@/pages/AboutUs'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const EditListing = lazy(() => import('@/pages/EditListing'));
const BrowseSeekers = lazy(() => import('@/pages/BrowseSeekers'));
const MapView = lazy(() => import('@/pages/MapView'));
const SeedData = lazy(() => import('@/pages/SeedData'));

// Admin pages - extra lazy since rarely visited
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminListings = lazy(() => import('@/pages/admin/AdminListings'));
const AdminReports = lazy(() => import('@/pages/admin/AdminReports'));
const AdminVerifications = lazy(() => import('@/pages/admin/AdminVerifications'));
const AdminNotifications = lazy(() => import('@/pages/admin/AdminNotifications'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));

// Layout is NOT lazy — it's needed on every authenticated page
import Layout from '@/components/Layout';

// ----- Page title manager -----
const PAGE_TITLES: Record<string, string> = {
  '/': 'NestMate — Find Your Perfect Roommate in India',
  '/login': 'Log In | NestMate',
  '/how-it-works': 'How It Works | NestMate',
  '/pricing': 'Pricing | NestMate',
  '/about': 'About Us | NestMate',
  '/privacy': 'Privacy Policy | NestMate',
  '/terms': 'Terms of Service | NestMate',
  '/role-select': 'Choose Your Role | NestMate',
  '/onboarding/seeker': 'Seeker Onboarding | NestMate',
  '/onboarding/owner': 'Owner Onboarding | NestMate',
  '/dashboard': 'Dashboard | NestMate',
  '/owner-dashboard': 'Owner Dashboard | NestMate',
  '/browse-rooms': 'Browse | NestMate',
  '/browse-seekers': 'Browse Seekers | NestMate',
  '/chat': 'Messages | NestMate',
  '/profile': 'My Profile | NestMate',
  '/edit-profile': 'Edit Profile | NestMate',
  '/settings': 'Settings | NestMate',
  '/notifications': 'Notifications | NestMate',
  '/map': 'Map View | NestMate',
  '/admin': 'Admin Dashboard | NestMate',
};

function usePageTitle() {
  const location = useLocation();
  useEffect(() => {
    const path = location.pathname;
    const title = PAGE_TITLES[path] || 'NestMate';
    document.title = title;
  }, [location.pathname]);
}

// ----- Loading fallback -----
function PageLoader() {
  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center" role="status" aria-label="Loading page">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-fire animate-spin" />
        <p className="text-sm text-ink/40">Loading...</p>
      </div>
    </div>
  );
}

interface AuthState {
  uid: string | null;
  role: 'seeker' | 'owner' | null;
  onboardingComplete: boolean;
  loading: boolean;
}

// Guard authenticated routes
function PrivateRoute({ children, isAuthenticated }: { children: React.ReactNode, isAuthenticated: boolean }) {
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Guard dashboard routes — also enforces role-based routing
function OnboardingGuard({ children, isAuthenticated, authState, expectedRole }: {
  children: React.ReactNode,
  isAuthenticated: boolean,
  authState: AuthState,
  expectedRole?: 'seeker' | 'owner'
}) {
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!authState.onboardingComplete) {
    if (!authState.role) return <Navigate to="/role-select" replace />;
    return <Navigate to={authState.role === 'seeker' ? '/onboarding/seeker' : '/onboarding/owner'} replace />;
  }
  // Role mismatch — redirect to the correct dashboard
  if (expectedRole && authState.role && authState.role !== expectedRole) {
    return <Navigate to={authState.role === 'seeker' ? '/dashboard' : '/owner-dashboard'} replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const [authState, setAuthState] = useState<AuthState>({
    uid: null,
    role: null,
    onboardingComplete: false,
    loading: true,
  });

  // Track user activity status
  useActiveTracking();

  // Dynamic page titles
  usePageTitle();

  // Real-time auth + profile sync
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        unsubscribeProfile = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              setAuthState({
                uid: firebaseUser.uid,
                role: data.role || null,
                onboardingComplete: data.onboardingComplete || false,
                loading: false,
              });
              if (data.settings?.darkMode) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            } else {
              setAuthState({ uid: firebaseUser.uid, role: null, onboardingComplete: false, loading: false });
              document.documentElement.classList.remove('dark');
            }
          },
          (err) => {
            console.error('Profile listener error:', err);
            setAuthState({ uid: firebaseUser.uid, role: null, onboardingComplete: false, loading: false });
          }
        );
      } else {
        setAuthState({ uid: null, role: null, onboardingComplete: false, loading: false });
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  if (authState.loading) {
    return <PageLoader />;
  }

  const isAuthenticated = !!authState.uid;

  const getDashboardRoute = (): string => {
    if (!isAuthenticated) return '/login';
    if (!authState.onboardingComplete) {
      if (!authState.role) return '/role-select';
      return authState.role === 'seeker' ? '/onboarding/seeker' : '/onboarding/owner';
    }
    return authState.role === 'seeker' ? '/dashboard' : '/owner-dashboard';
  };

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={isAuthenticated ? <Navigate to={getDashboardRoute()} replace /> : <AuthPage />} />
        <Route path="/phone-login" element={isAuthenticated ? <Navigate to={getDashboardRoute()} replace /> : <PhoneLogin />} />
        <Route path="/verify-otp" element={isAuthenticated ? <Navigate to={getDashboardRoute()} replace /> : <OTPVerify />} />

        {/* Post-auth onboarding */}
        <Route path="/role-select" element={<PrivateRoute isAuthenticated={isAuthenticated}><RoleSelect /></PrivateRoute>} />
        <Route path="/onboarding/seeker" element={<PrivateRoute isAuthenticated={isAuthenticated}><SeekerOnboarding /></PrivateRoute>} />
        <Route path="/onboarding/owner" element={<PrivateRoute isAuthenticated={isAuthenticated}><OwnerOnboarding /></PrivateRoute>} />

        {/* Public & App routes with shared Layout */}
        <Route element={<Layout />}>
          {/* Unauthenticated public browsing */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/browse-rooms" element={<BrowseDashboard />} />
          <Route path="/browse-seekers" element={<BrowseSeekers />} />
          <Route path="/room/:id" element={<RoomDetail />} />
          <Route path="/match/:id" element={<MatchDetail />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<PrivacyPolicy />} />

          {/* Authenticated user routes */}
          <Route path="/dashboard" element={<OnboardingGuard isAuthenticated={isAuthenticated} authState={authState} expectedRole="seeker"><SeekerDashboard /></OnboardingGuard>} />
          <Route path="/owner-dashboard" element={<OnboardingGuard isAuthenticated={isAuthenticated} authState={authState} expectedRole="owner"><OwnerDashboard /></OnboardingGuard>} />
          <Route path="/edit-listing/:id" element={<PrivateRoute isAuthenticated={isAuthenticated}><EditListing /></PrivateRoute>} />
          <Route path="/chat" element={<PrivateRoute isAuthenticated={isAuthenticated}><ChatPage /></PrivateRoute>} />
          <Route path="/chat/:roomId" element={<PrivateRoute isAuthenticated={isAuthenticated}><ChatPage /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute isAuthenticated={isAuthenticated}><ProfilePage /></PrivateRoute>} />
          <Route path="/edit-profile" element={<PrivateRoute isAuthenticated={isAuthenticated}><EditProfile /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute isAuthenticated={isAuthenticated}><SettingsPage /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute isAuthenticated={isAuthenticated}><NotificationsPage /></PrivateRoute>} />
        </Route>

        {/* Admin routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="listings" element={<AdminListings />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="verifications" element={<AdminVerifications />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Dev */}
        <Route path="/dev/seed" element={<SeedData />} />

        {/* Redirects */}
        <Route path="/home" element={<Navigate to={getDashboardRoute()} replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return <AppRoutes />;
}
