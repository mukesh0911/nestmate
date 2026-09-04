import { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { computeMarketplaceMetrics } from '@/lib/analytics';
import type { AnalyticsEventDoc } from '@/lib/analytics';
import {
    Search, Eye, Heart, MessageCircle, Phone, Home,
    Loader2, BarChart3, AlertTriangle
} from 'lucide-react';

/**
 * Sprint 2D — Admin Marketplace Insights.
 *
 * Reads real product analytics events from `analyticsEvents` (admin-only
 * collection per Firestore rules) and renders truthful funnel metrics via
 * the pure computeMarketplaceMetrics() function. NO fabricated numbers:
 * if there is no data, the UI shows an explicit empty state.
 */

const WINDOW_DAYS = 30;

export default function AdminMarketplace() {
    const [events, setEvents] = useState<AnalyticsEventDoc[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                // Rules allow admin reads only; a non-admin will get permission-denied here.
                const q = query(
                    collection(db, 'analyticsEvents'),
                    orderBy('at', 'desc'),
                    limit(5000)
                );
                const snap = await getDocs(q);
                if (!cancelled) setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as AnalyticsEventDoc)));
            } catch (e: any) {
                if (!cancelled) setError(e?.code === 'permission-denied'
                    ? 'Permission denied — your account may not have admin access to analytics.'
                    : 'Failed to load analytics events.');
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const m = computeMarketplaceMetrics(events, Date.now(), WINDOW_DAYS);

    const cards = [
        { label: 'Searches', value: m.searches, icon: Search, hint: `${m.zeroResultSearches} returned no results` },
        { label: 'Listing Views', value: m.listingViews, icon: Eye, hint: 'unique view events' },
        { label: 'Interest Sent', value: m.interestSent, icon: Heart, hint: 'connect requests' },
        { label: 'Interest Accepted', value: m.interestAccepted, icon: MessageCircle, hint: `${m.acceptRate}% accept rate` },
        { label: 'Chats Started', value: m.chatsStarted, icon: MessageCircle, hint: 'rooms opened' },
        { label: 'Contacts Shared', value: m.contactsShared, icon: Phone, hint: 'mutual consent' },
        { label: 'Listings Created', value: m.listingsCreated, icon: Home, hint: 'supply side' },
        { label: 'Availability Confirmed', value: m.availabilityConfirmed, icon: BarChart3, hint: 'freshness actions' },
    ];

    return (
        <div className="p-6 max-w-6xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-ink">Marketplace Insights</h1>
                <p className="text-sm text-ink/50 mt-1">
                    Real event data from the last {WINDOW_DAYS} days. Zero-result searches and
                    drop-off points are shown truthfully — nothing here is estimated or fabricated.
                </p>
            </div>

            {isLoading && (
                <div className="flex items-center gap-2 text-ink/60 py-12 justify-center">
                    <Loader2 className="w-5 h-5 animate-spin" /> Loading events…
                </div>
            )}

            {!isLoading && error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-red-800 text-sm">{error}</p>
                        <p className="text-xs text-red-700/70 mt-1">Firestore rules restrict analyticsEvents to admins.</p>
                    </div>
                </div>
            )}

            {!isLoading && !error && events.length === 0 && (
                <div className="bg-white border border-border rounded-xl p-10 text-center">
                    <BarChart3 className="w-10 h-10 text-ink/20 mx-auto mb-3" />
                    <p className="font-semibold text-ink">No analytics events yet</p>
                    <p className="text-sm text-ink/50 mt-1">
                        Events appear as users search, view listings, connect, chat and share contacts.
                    </p>
                </div>
            )}

            {!isLoading && !error && events.length > 0 && (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {cards.map(c => {
                            const Icon = c.icon;
                            return (
                                <div key={c.label} className="bg-white rounded-xl border border-border p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Icon className="w-4 h-4 text-fire" />
                                        <span className="text-xs font-semibold text-ink/60 uppercase tracking-wide">{c.label}</span>
                                    </div>
                                    <p className="text-2xl font-bold text-ink">{c.value.toLocaleString()}</p>
                                    <p className="text-[11px] text-ink/40 mt-1">{c.hint}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Funnel */}
                    <div className="bg-white rounded-xl border border-border p-5 mb-8">
                        <h2 className="font-semibold text-ink mb-4">Conversion Funnel ({WINDOW_DAYS}d)</h2>
                        <div className="space-y-3">
                            {[
                                { label: 'Search performed', v: m.searches },
                                { label: 'Listing viewed', v: m.listingViews },
                                { label: 'Interest sent', v: m.interestSent },
                                { label: 'Interest accepted', v: m.interestAccepted },
                                { label: 'Chat started', v: m.chatsStarted },
                                { label: 'Contact shared', v: m.contactsShared },
                            ].map(step => {
                                const pct = m.searches > 0 ? Math.round((step.v / m.searches) * 100) : 0;
                                return (
                                    <div key={step.label}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-ink/70 font-medium">{step.label}</span>
                                            <span className="font-bold text-ink">{step.v.toLocaleString()} · {pct}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-fire rounded-full transition-all"
                                                style={{ width: `${Math.min(100, pct)}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-[11px] text-ink/40 mt-3">
                            Percentages are relative to searches in the window. Small-sample caution:
                            early-stage numbers are directional only.
                        </p>
                    </div>

                    {/* Top cities */}
                    {m.topCities.length > 0 && (
                        <div className="bg-white rounded-xl border border-border p-5">
                            <h2 className="font-semibold text-ink mb-3">Top Cities by Searches</h2>
                            <div className="space-y-2">
                                {m.topCities.map(([city, count]: [string, number]) => (
                                    <div key={city} className="flex items-center justify-between text-sm">
                                        <span className="text-ink/70">{city}</span>
                                        <span className="font-bold">{count}</span>
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