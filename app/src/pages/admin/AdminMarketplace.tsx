import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { computeMarketplaceMetrics } from '@/lib/analytics';
import type { AnalyticsEventDoc } from '@/lib/analytics';
import {
  Search, Eye, Heart, MessageCircle, Phone, Home,
  Loader2, BarChart3, AlertTriangle, RefreshCw, Calendar, Sparkles
} from 'lucide-react';

export default function AdminMarketplace() {
  const [events, setEvents] = useState<AnalyticsEventDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [windowDays, setWindowDays] = useState<number>(30);

  const fetchAnalytics = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, 'analyticsEvents'),
        orderBy('at', 'desc'),
        limit(5000)
      );
      const snap = await getDocs(q);
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as AnalyticsEventDoc)));
    } catch (e: any) {
      setError(e?.code === 'permission-denied'
        ? 'Permission denied — your account may not have admin access to analytics.'
        : 'Failed to load analytics events.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const m = computeMarketplaceMetrics(events, Date.now(), windowDays);

  const cards = [
    { label: 'Total Searches', value: m.searches, icon: Search, hint: `${m.zeroResultSearches} zero-result searches` },
    { label: 'Listing Views', value: m.listingViews, icon: Eye, hint: 'Unique room discovery views' },
    { label: 'Interest Sent', value: m.interestSent, icon: Heart, hint: 'Connection / room requests' },
    { label: 'Interest Accepted', value: m.interestAccepted, icon: MessageCircle, hint: `${m.acceptRate}% acceptance rate` },
    { label: 'Chats Started', value: m.chatsStarted, icon: MessageCircle, hint: 'Active peer chat rooms' },
    { label: 'Contacts Shared', value: m.contactsShared, icon: Phone, hint: 'Mutual consent unlocks' },
    { label: 'Listings Created', value: m.listingsCreated, icon: Home, hint: 'Supply inventory added' },
    { label: 'Availability Confirmed', value: m.availabilityConfirmed, icon: BarChart3, hint: 'Owner freshness checks' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Marketplace Insights & Funnel</h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
              Real Events
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Truthful product analytics across searching, viewing, connect requests, and contact exchange.
          </p>
        </div>

        {/* Time window selector & refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
            {[7, 14, 30, 90].map(days => (
              <button
                key={days}
                onClick={() => setWindowDays(days)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  windowDays === days
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}>
                {days}d
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={isRefreshing}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            title="Refresh events">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-28 gap-3">
          <Loader2 className="w-8 h-8 text-fire animate-spin" />
          <p className="text-xs font-medium text-slate-400">Aggregating marketplace event streams...</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-900 text-sm">{error}</p>
            <p className="text-xs text-red-700/80 mt-1">
              Verify your admin email is registered in Firestore rules under the <code>admins</code> collection.
            </p>
          </div>
        </div>
      )}

      {!isLoading && !error && events.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-800 text-base">No analytics events recorded yet</p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Events appear automatically as users browse listings, initiate roommate matches, chat, and share contact info.
          </p>
        </div>
      )}

      {!isLoading && !error && events.length > 0 && (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map(c => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-orange-50 text-fire flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide truncate">{c.label}</span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">{c.value.toLocaleString()}</p>
                  <p className="text-[11px] text-slate-400 mt-1 truncate">{c.hint}</p>
                </div>
              );
            })}
          </div>

          {/* Conversion Funnel */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Conversion Funnel ({windowDays} Days Window)</h3>
                <p className="text-xs text-slate-400">Progression from discovery search to mutual contact sharing</p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {m.acceptRate}% Accept Rate
              </span>
            </div>

            <div className="space-y-3.5 pt-2">
              {[
                { label: 'Search Performed', v: m.searches },
                { label: 'Listing Viewed', v: m.listingViews },
                { label: 'Interest Sent', v: m.interestSent },
                { label: 'Interest Accepted', v: m.interestAccepted },
                { label: 'Chat Started', v: m.chatsStarted },
                { label: 'Contact Shared', v: m.contactsShared },
              ].map(step => {
                const pct = m.searches > 0 ? Math.min(100, Math.round((step.v / m.searches) * 100)) : 0;
                return (
                  <div key={step.label} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-700 font-semibold">{step.label}</span>
                      <span className="font-mono font-bold text-slate-900">
                        {step.v.toLocaleString()} <span className="text-slate-400 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-fire rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              * Ratios are normalized relative to total searches within the chosen {windowDays}-day window.
            </p>
          </div>

          {/* Top Cities by Search Interest */}
          {m.topCities.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Top Cities by Search Intent</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {m.topCities.map(([city, count]: [string, number]) => (
                  <div key={city} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-xs font-semibold text-slate-700">{city}</span>
                    <span className="text-xs font-mono font-bold text-fire">{count} searches</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}