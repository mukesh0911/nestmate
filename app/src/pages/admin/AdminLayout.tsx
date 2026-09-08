import { Outlet, useLocation, useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Home, Flag, ShieldCheck,
  Bell, Settings, LogOut, Menu, X, Loader2, BarChart3
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/listings', label: 'Listings', icon: Home },
  { path: '/admin/marketplace', label: 'Marketplace', icon: BarChart3 },
  { path: '/admin/reports', label: 'Reports', icon: Flag },
  { path: '/admin/verifications', label: 'Verifications', icon: ShieldCheck },
  { path: '/admin/notifications', label: 'Notifications', icon: Bell },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout, isLoading: authLoading } = useAuth();
  const { isAdmin, checking } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Gate: loading
  if (checking || authLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-fire animate-spin" />
          <p className="text-sm text-white/50">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Gate: not logged in -> redirect to /login immediately
  if (!user) {
    return <Navigate to="/login?redirect=/admin" replace />;
  }

  // Gate: not admin -> redirect away from admin backoffice immediately
  if (isAdmin === false) {
    return <Navigate to={profile?.role === 'owner' ? '/owner-dashboard' : '/dashboard'} replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex bg-[#F1F5F9]">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-[240px] bg-[#1E3A5F] flex-col shrink-0 sticky top-0 h-screen">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-fire flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.88-2.88 7.19-5 9.88C9.92 16.21 7 11.85 7 9z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            </div>
            <div>
              <span className="text-white font-semibold text-sm">NestMate</span>
              <span className="ml-1.5 text-[10px] bg-fire/20 text-fire px-1.5 py-0.5 rounded font-bold uppercase">Admin</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = isActive(item.path, item.exact);
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? 'bg-fire text-white shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}>
                <Icon className="w-4.5 h-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-bold">
              {profile?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile?.name || 'Admin'}</p>
              <p className="text-[10px] text-white/40 truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-white/50 hover:text-red-400 hover:bg-white/5 transition-all">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[260px] bg-[#1E3A5F] flex flex-col z-10 shadow-2xl">
            <div className="px-5 py-4 flex items-center justify-between border-b border-white/10">
              <span className="text-white font-semibold text-sm">NestMate Admin</span>
              <button onClick={() => setSidebarOpen(false)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                const active = isActive(item.path, item.exact);
                return (
                  <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? 'bg-fire text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}>
                    <Icon className="w-4.5 h-4.5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="px-3 py-4 border-t border-white/10">
              <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white/50 hover:text-red-400">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 sm:px-6 h-14 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-semibold text-gray-700 capitalize">
              {NAV_ITEMS.find(n => isActive(n.path, n.exact))?.label || 'Admin'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-xs text-gray-400 hover:text-fire transition-colors">← Back to App</Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
