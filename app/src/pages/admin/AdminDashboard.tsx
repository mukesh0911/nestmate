import { useState, useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { Link } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Home, MessageSquare, TrendingUp, ArrowUpRight, ArrowDownRight, Flag, ShieldCheck, Loader2 } from 'lucide-react';

interface Metrics {
  totalUsers: number;
  signupsToday: number;
  signupsYesterday: number;
  activeListings: number;
  totalListings: number;
  totalChats: number;
  topCities: { city: string; count: number }[];
  dailySignups: { date: string; count: number }[];
  seekers: number;
  owners: number;
}

export default function AdminDashboard() {
  const { getMetrics } = useAdmin();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMetrics().then(m => { setMetrics(m); setLoading(false); }).catch(() => setLoading(false));
  }, [getMetrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-fire animate-spin" />
      </div>
    );
  }

  if (!metrics) {
    return <p className="text-center text-gray-500 py-12">Failed to load metrics.</p>;
  }

  const signupTrend = metrics.signupsYesterday > 0
    ? Math.round(((metrics.signupsToday - metrics.signupsYesterday) / metrics.signupsYesterday) * 100)
    : metrics.signupsToday > 0 ? 100 : 0;

  const cards = [
    {
      label: 'New Signups Today', value: metrics.signupsToday,
      trend: signupTrend, icon: TrendingUp, color: 'bg-fire/10 text-fire',
    },
    {
      label: 'Total Users', value: metrics.totalUsers,
      sub: `${metrics.seekers} seekers · ${metrics.owners} owners`,
      icon: Users, color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Active Listings', value: metrics.activeListings,
      sub: `${metrics.totalListings} total`,
      icon: Home, color: 'bg-teal-50 text-teal-600',
    },
    {
      label: 'Chat Rooms', value: metrics.totalChats,
      icon: MessageSquare, color: 'bg-navy/10 text-navy',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
                {'trend' in card && card.trend !== undefined && (
                  <span className={`flex items-center gap-0.5 text-xs font-bold ${card.trend >= 0 ? 'text-teal-600' : 'text-red-500'}`}>
                    {card.trend >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {Math.abs(card.trend)}%
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{card.label}</p>
              {'sub' in card && card.sub && <p className="text-[10px] text-gray-400 mt-0.5">{card.sub}</p>}
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Signups */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Daily Signups (30 days)</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.dailySignups}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #e5e7eb' }} />
                <Line type="monotone" dataKey="count" stroke="#E5501A" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Signups by City */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Cities</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.topCities}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="city" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #e5e7eb' }} />
                <Bar dataKey="count" fill="#1E3A5F" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/admin/reports" className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-fire/30 transition-all group">
          <Flag className="w-5 h-5 text-red-400 mb-2" />
          <p className="text-sm font-semibold text-gray-700 group-hover:text-fire transition-colors">View Reports</p>
          <p className="text-xs text-gray-400">Review pending reports</p>
        </Link>
        <Link to="/admin/verifications" className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-fire/30 transition-all group">
          <ShieldCheck className="w-5 h-5 text-teal-500 mb-2" />
          <p className="text-sm font-semibold text-gray-700 group-hover:text-fire transition-colors">Verifications</p>
          <p className="text-xs text-gray-400">Review pending verifications</p>
        </Link>
        <Link to="/admin/users" className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-fire/30 transition-all group">
          <Users className="w-5 h-5 text-blue-500 mb-2" />
          <p className="text-sm font-semibold text-gray-700 group-hover:text-fire transition-colors">Manage Users</p>
          <p className="text-xs text-gray-400">{metrics.totalUsers} registered users</p>
        </Link>
      </div>
    </div>
  );
}
