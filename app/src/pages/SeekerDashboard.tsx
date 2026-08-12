import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { cities, localitiesByCity, flatTypes, furnishingTypes, amenitiesList } from '@/lib/staticData';
import { useAuth } from '@/hooks/useAuth';
import { useMatches, calculateCompatibility, getActiveStatus } from '@/hooks/useMatches';
import { useChat } from '@/hooks/useChat';
import { useConnections, FREE_CONNECT_LIMIT } from '@/hooks/useConnections';
import { useNotifications } from '@/hooks/useNotifications';
import { useUserProfile } from '@/hooks/useUserProfile';
import type { MatchedUser } from '@/hooks/useMatches';
import type { Connection } from '@/hooks/useConnections';
import { toast } from 'sonner';
import { Drawer } from 'vaul';
import { Search, LayoutGrid, List, Crown, Shield, ShieldCheck, Star, MessageCircle, Heart, HeartOff, Bookmark, Home, Loader2, X, Filter, SlidersHorizontal, MoreVertical, Flag, Ban, Check, CheckCircle2, Bell, Sparkles } from 'lucide-react';
import { MapPreview } from '@/components/MapPreview';
import TrustBadge from '@/components/TrustBadge';
import ProfileCompleteness from '@/components/ProfileCompleteness';
import StateEmpty from '@/components/StateEmpty';
import { StateSkeletonGrid } from '@/components/StateLoading';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SeekerDashboard() {
  const navigate = useNavigate();
  const { profile, user, refreshProfile } = useAuth();
  const { filters, updateFilters } = useStore();
  const { findMatches, getProfilesByIds, hasMore } = useMatches();
  const { subscribeToChatRooms, getOrCreateChatRoom } = useChat();
  const { sendRequest, getMyConnections, getMonthlyConnectCount, subscribeToMyConnections, acceptRequest, rejectRequest } = useConnections();
  const { createNotification } = useNotifications();
  const { toggleSavedProfile, addSkippedUser, blockUser, reportUser, saveSearch, deleteSearch } = useUserProfile();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortMode, setSortMode] = useState<'best' | 'newest' | 'budgetAsc' | 'budgetDesc'>('best');
  const [activeTab, setActiveTab] = useState<'all' | 'saved' | 'connections'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [matches, setMatches] = useState<MatchedUser[]>([]);
  const [savedProfiles, setSavedProfiles] = useState<MatchedUser[]>([]);
  const [connectedProfiles, setConnectedProfiles] = useState<MatchedUser[]>([]);
  const [chatCount, setChatCount] = useState(0);
  const [chatRoomMap, setChatRoomMap] = useState<Record<string, string>>({});
  const [myConnections, setMyConnections] = useState<Connection[]>([]);

  const acceptedConnectedUids = useMemo(() => {
    if (!user?.uid) return [];
    return myConnections
      .filter(c => c.status === 'accepted')
      .map(c => c.fromUserId === user.uid ? c.toUserId : c.fromUserId);
  }, [myConnections, user?.uid]);
  const [connectsUsed, setConnectsUsed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [compatModal, setCompatModal] = useState<MatchedUser | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks whether we've already applied the profile's default city once on mount.
  // Without this guard, the effect re-fires every time the user selects "All Cities"
  // (which sets filters.city = ""), immediately overwriting their selection back to
  // the profile city (e.g. Chennai). The flag ensures it only runs on first load.
  const cityInitializedRef = useRef(false);

  // Report & Block State
  const [reportingUser, setReportingUser] = useState<MatchedUser | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const savedProfileIds = useMemo(() => profile?.savedProfileIds || [], [profile?.savedProfileIds]);

  const handleBlockUser = async (targetUid: string, name: string) => {
    if (!user?.uid) return;
    if (!window.confirm(`Are you sure you want to block ${name}? You won't see each other again.`)) return;
    
    try {
      await blockUser(user.uid, targetUid);
      await refreshProfile();
      setMatches(prev => prev.filter(m => m.profile.uid !== targetUid));
      toast.success(`${name} has been blocked.`);
    } catch {
      toast.error('Failed to block user.');
    }
  };

  const handleSubmitReport = async () => {
    if (!user?.uid || !reportingUser || !reportReason) {
      toast.error('Please select a reason for reporting.');
      return;
    }
    setIsSubmittingReport(true);
    try {
      await reportUser({
        reporterId: user.uid,
        targetId: reportingUser.profile.uid || '',
        reason: reportReason,
        description: reportDescription,
      });
      toast.success('Report submitted successfully.');
      setReportingUser(null);
      setReportReason('');
      setReportDescription('');
    } catch {
      toast.error('Failed to submit report.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Auto-set city filter on mount — runs only ONCE per profile load.
  // Using a ref guard prevents this from re-firing when the user explicitly
  // selects "All Cities" (which sets filters.city to ""), which previously
  // caused Chennai to be immediately re-applied, breaking the All Cities filter.
  useEffect(() => {
    if (profile?.city && !cityInitializedRef.current) {
      cityInitializedRef.current = true;
      // Only set the default city if no city is currently selected
      if (!filters.city) {
        updateFilters({ city: profile.city });
      }
    }
  }, [profile?.city]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load matches
  useEffect(() => {
    if (!profile) return;
    setIsLoading(true);
    findMatches(profile, filters.city, filters, false)
      .then(matches => {
        // Filter out blocked users
        const blockedIds = new Set(profile.blockedUserIds || []);
        setMatches(matches.filter(m => !blockedIds.has(m.profile.uid || '')));
      })
      .catch(() => toast.error('Failed to load matches.'))
      .finally(() => setIsLoading(false));
  }, [profile?.uid, profile?.city, filters, findMatches, profile?.blockedUserIds]);

  // Load More Matches
  const handleLoadMore = useCallback(async () => {
    if (!profile || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const moreMatches = await findMatches(profile, filters.city, filters, true);
      const blockedIds = new Set(profile.blockedUserIds || []);
      setMatches(prev => {
        const existingIds = new Set(prev.map(m => m.profile.uid));
        const filtered = moreMatches.filter(m => !existingIds.has(m.profile.uid) && !blockedIds.has(m.profile.uid || ''));
        return [...prev, ...filtered];
      });
    } catch {
      toast.error('Failed to load more matches.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [profile, filters, hasMore, isLoadingMore, findMatches]);

  // Auto-load on scroll
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (
          window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 800 &&
          !isLoading &&
          !isLoadingMore &&
          hasMore &&
          activeTab === 'all'
        ) {
          handleLoadMore();
        }
      }, 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [isLoading, isLoadingMore, hasMore, activeTab, handleLoadMore]);

  // Load missing saved profiles
  useEffect(() => {
    if (!profile || !savedProfileIds.length) {
      setSavedProfiles([]);
      return;
    }
    // Find IDs that are saved but not currently in matches
    const existingUids = new Set(matches.map(m => m.profile.uid));
    const missingUids = savedProfileIds.filter(id => !existingUids.has(id));
    
    if (missingUids.length === 0) {
      setSavedProfiles([]);
      return;
    }

    getProfilesByIds(profile, missingUids)
      .then(setSavedProfiles)
      .catch(() => console.error('Failed to load saved profiles'));
  }, [profile, savedProfileIds, matches, getProfilesByIds]);

  // Subscribe to chat rooms to build uid->roomId map
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToChatRooms(user.uid, (rooms) => {
      setChatCount(rooms.length);
      const map: Record<string, string> = {};
      rooms.forEach(r => {
        const other = r.participants.find(p => p !== user.uid);
        if (other) map[other] = r.id;
      });
      setChatRoomMap(map);
    });
    return unsub;
  }, [user?.uid]);

  // Real-time connections subscription — updates button state instantly without page refresh
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToMyConnections(user.uid, setMyConnections);
    getMonthlyConnectCount(user.uid).then(setConnectsUsed).catch(() => {});
    return unsub;
  }, [user?.uid]);

  // Save / Unsave
  const handleToggleSave = useCallback(async (targetUid: string) => {
    if (!user?.uid || savingId) return;
    setSavingId(targetUid);
    const isSaved = savedProfileIds.includes(targetUid);
    try {
      await toggleSavedProfile(user.uid, targetUid, isSaved);
      await refreshProfile();
      toast.success(isSaved ? 'Removed from saved' : 'Profile saved!');
    } catch {
      toast.error('Could not update saved profiles.');
    } finally {
      setSavingId(null);
    }
  }, [user?.uid, savedProfileIds, savingId, toggleSavedProfile, refreshProfile]);

  // Skip with undo toast
  const handleSkip = useCallback(async (skippedUid: string, skippedName: string) => {
    if (!user?.uid) return;
    // Immediately remove from UI
    setMatches(prev => prev.filter(m => m.profile.uid !== skippedUid));
    let undone = false;
    toast(`Skipped ${skippedName}`, {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          undone = true;
          // Reload matches to restore
          if (profile) findMatches(profile, filters.city, filters, false).then(setMatches);
          toast.success('Undo successful!');
        },
      },
    });
    // Commit to Firestore after 5 seconds unless undone
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(async () => {
      if (!undone) {
        try {
          await addSkippedUser(user.uid, skippedUid);
          await refreshProfile();
        } catch {
          toast.error('Failed to skip user.');
          if (profile) findMatches(profile, filters.city, filters, false).then(setMatches);
        }
      }
    }, 5500);
  }, [user?.uid, profile, filters, addSkippedUser, findMatches, refreshProfile]);

  // Full connection state machine with 4 states
  const getConnectState = useCallback(
    (targetUid: string): 'connect' | 'pending_sent' | 'pending_received' | 'chat' => {
      if (chatRoomMap[targetUid]) return 'chat';
      const conn = myConnections.find(c =>
        (c.fromUserId === user?.uid && c.toUserId === targetUid) ||
        (c.toUserId === user?.uid && c.fromUserId === targetUid)
      );
      if (!conn) return 'connect';
      if (conn.status === 'accepted') return 'chat';
      if (conn.status === 'pending') {
        // I sent the request
        if (conn.fromUserId === user?.uid) return 'pending_sent';
        // They sent me the request — I can accept
        return 'pending_received';
      }
      return 'connect'; // rejected / blocked — allow retry
    },
    [chatRoomMap, myConnections, user?.uid]
  );

  // Handle connect button click — works for all 4 states
  const handleConnect = useCallback(async (targetUid: string, targetName: string) => {
    if (!user?.uid || connectingId) return;

    // Already has a chat room → go to chat
    if (chatRoomMap[targetUid]) {
      navigate(`/chat/${chatRoomMap[targetUid]}`);
      return;
    }

    const conn = myConnections.find(c =>
      (c.fromUserId === user.uid && c.toUserId === targetUid) ||
      (c.toUserId === user.uid && c.fromUserId === targetUid)
    );

    // They sent me a request — Accept it
    if (conn && conn.status === 'pending' && conn.toUserId === user.uid) {
      setConnectingId(targetUid);
      try {
        await acceptRequest(conn.id);
        const roomId = await getOrCreateChatRoom(user.uid, targetUid);
        await createNotification({
          userId: targetUid,
          type: 'connect',
          title: 'Connection Accepted!',
          description: `${profile?.name || 'Someone'} accepted your connect request. Start chatting!`,
          read: false,
          actionUrl: `/chat/${roomId}`,
        });
        navigate(`/chat/${roomId}`);
      } catch {
        toast.error('Failed to accept request.');
      } finally {
        setConnectingId(null);
      }
      return;
    }

    // Already sent a pending request — do nothing (button is disabled)
    if (conn && conn.status === 'pending' && conn.fromUserId === user.uid) return;

    // No connection — send new request
    setConnectingId(targetUid);
    try {
      const connectionId = await sendRequest(user.uid, targetUid);
      await createNotification({
        userId: targetUid,
        type: 'connect',
        title: 'New Connection Request!',
        description: `${profile?.name || 'Someone'} wants to connect with you.`,
        read: false,
        actionUrl: `/owner-dashboard?request=${connectionId}`,
      });
      toast.success(`Connection request sent to ${targetName}!`);
    } catch (err: any) {
      toast.error('Failed to send connection request.');
    } finally {
      setConnectingId(null);
    }
  }, [user?.uid, connectingId, chatRoomMap, myConnections, sendRequest, acceptRequest, getOrCreateChatRoom, createNotification, profile?.name, navigate]);

  // Combine local matches, saved profiles, and connected profiles to create a unified pool
  const allAvailableMatches = useMemo(() => [
    ...matches,
    ...savedProfiles.filter(sp => !matches.some(m => m.profile.uid === sp.profile.uid)),
    ...connectedProfiles.filter(cp => !matches.some(m => m.profile.uid === cp.profile.uid))
  ], [matches, savedProfiles, connectedProfiles]);

  // Client-side filtering + sorting
  const filteredMatches = useMemo(() => {
    return allAvailableMatches
      .filter(m => {
        const p = m.profile;
        if (activeTab === 'saved' && !savedProfileIds.includes(p.uid || '')) return false;
        if (activeTab === 'connections' && !acceptedConnectedUids.includes(p.uid || '')) return false;
        if (activeTab === 'all' && filters.gender && filters.gender !== 'any') {
          if (!p.gender || p.gender.toLowerCase() !== filters.gender.toLowerCase()) return false;
        }
        if (activeTab === 'all' && p.budget && (p.budget < filters.budgetMin || p.budget > filters.budgetMax)) return false;
        if (activeTab === 'all' && filters.localities.length > 0 && p.localities && !p.localities.some((l: string) => filters.localities.includes(l))) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const inLocalities = (p.localities || []).some((l: string) => l.toLowerCase().includes(q));
          const inProfession = (p.profession || '').toLowerCase().includes(q);
          const inName = (p.name || '').toLowerCase().includes(q);
          const inCity = (p.city || '').toLowerCase().includes(q);
          return inName || inProfession || inCity || inLocalities;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortMode === 'newest') return 0; // Firestore already returns by creation order
        if (sortMode === 'budgetAsc') return (a.profile.budget || 0) - (b.profile.budget || 0);
        if (sortMode === 'budgetDesc') return (b.profile.budget || 0) - (a.profile.budget || 0);
        return b.compatibilityScore - a.compatibilityScore; // 'best'
      });
  }, [allAvailableMatches, activeTab, savedProfileIds, acceptedConnectedUids, filters, searchQuery, sortMode]);

  const bestMatch = useMemo(() => activeTab === 'all' ? filteredMatches[0] : null, [activeTab, filteredMatches]);
  const gridMatches = useMemo(() => activeTab === 'all' ? filteredMatches.slice(1) : filteredMatches, [activeTab, filteredMatches]);

  const compatibilityColor = (score: number) => {
    if (score >= 90) return 'bg-teal';
    return 'bg-fire';
  };

  // Compatibility modal breakdown
  const getCompatBreakdown = (match: MatchedUser) => {
    const lifestyle = calculateCompatibility(profile?.quizAnswers || {}, match.profile.quizAnswers || {}, profile?.city, match.profile.city);
    const myBudget = profile?.budget || 0;
    const theirBudget = match.profile.budget || 0;
    const budgetMatch = myBudget && theirBudget
      ? Math.max(0, 100 - Math.round(Math.abs(myBudget - theirBudget) / Math.max(myBudget, theirBudget) * 100))
      : 50;
    const locationMatch = profile?.city === match.profile.city ? 100 : 0;
    return { lifestyle, budgetMatch, locationMatch };
  };

  const getSharedCount = (match: MatchedUser) => {
    if (!profile?.quizAnswers || !match.profile.quizAnswers) return 0;
    return Object.keys(match.profile.quizAnswers).filter(k => match.profile.quizAnswers![k] === profile.quizAnswers![k]).length;
  };

  const getLifestyleTags = (match: MatchedUser) => {
    const tags = [];
    const ans = match.profile.quizAnswers || {};
    const myAns = profile?.quizAnswers || {};
    
    if (ans.sleep_time) {
      const isMatch = ans.sleep_time === myAns.sleep_time;
      const lbl = ans.sleep_time === 'before_10' ? 'Early Bird' : ans.sleep_time === 'after_12' ? 'Night Owl' : 'Flexible';
      tags.push({ label: lbl, match: isMatch });
    }
    if (ans.food_pref) {
      const isMatch = ans.food_pref === myAns.food_pref;
      const lbl = ans.food_pref === 'veg' ? 'Vegetarian' : ans.food_pref === 'vegan' ? 'Vegan' : 'Non-veg';
      tags.push({ label: lbl, match: isMatch });
    }
    if (ans.work_mode) {
      const isMatch = ans.work_mode === myAns.work_mode;
      const lbl = ans.work_mode === 'wfo' ? 'WFO' : ans.work_mode === 'wfh' ? 'WFH' : 'Hybrid';
      tags.push({ label: lbl, match: isMatch });
    }
    if (ans.guests && tags.length < 3) {
      const isMatch = ans.guests === myAns.guests;
      const lbl = ans.guests === 'rarely' ? 'No Guests' : ans.guests === 'very_often' ? 'Frequent' : 'Occasional';
      tags.push({ label: lbl, match: isMatch });
    }
    return tags.slice(0, 3);
  };

  return (
    <div className="min-h-screen bg-parchment overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ─── Desktop Sidebar (hidden on mobile) ─── */}
          <aside className="hidden lg:flex w-[285px] flex-shrink-0 flex-col space-y-5">
            {/* Profile Mini Card */}
            <div className="card-nestmate p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full border-2 border-fire p-0.5">
                    <img src={profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.name}`} alt="" loading="lazy" className="w-full h-full rounded-full" />
                  </div>
                  {profile?.isVerified && (
                    <div className="absolute -top-1 -right-1 bg-teal text-white p-0.5 rounded-full border border-white">
                      <ShieldCheck className="w-3 h-3" />
                    </div>
                  )}
                  {profile?.isPremium && <Crown className="absolute -bottom-1 -right-1 w-4 h-4 text-gold" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-sm truncate">{profile?.name || 'Guest'}</h3>
                    <TrustBadge profile={profile} size="xs" showTooltip />
                  </div>
                  <p className="text-[10px] text-ink/50 truncate">{profile?.profession} · {profile?.city}</p>
                </div>
              </div>
              {/* Compact completeness bar */}
              <ProfileCompleteness profile={profile} compact className="mb-3" />

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-cream/50 rounded-lg p-2">
                  <p className="text-lg font-bold">{matches.length}</p>
                  <p className="text-[10px] text-ink/50">Matches</p>
                </div>
                <div className="bg-cream/50 rounded-lg p-2">
                  <p className="text-lg font-bold">{chatCount}</p>
                  <p className="text-[10px] text-ink/50">Chats</p>
                </div>
                <div className="bg-cream/50 rounded-lg p-2">
                  <p className="text-lg font-bold text-fire">{matches.length > 0 ? `${matches[0].compatibilityScore}%` : '—'}</p>
                  <p className="text-[10px] text-ink/50">Top Match</p>
                </div>
              </div>
              <button onClick={() => navigate('/edit-profile')} className="mt-3 w-full text-xs text-fire border border-fire/20 rounded-lg py-1.5 hover:bg-fire/5 transition-all">Edit Profile</button>
            </div>

            {/* Filters – Desktop Card */}
            <FilterPanel filters={filters} updateFilters={updateFilters} profile={profile} onSaveSearch={saveSearch} />

            {/* Your Preferences */}
            {profile?.quizAnswers && Object.keys(profile.quizAnswers).length > 0 && (
              <div className="card-nestmate p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm">Your Preferences</h4>
                  <button onClick={() => navigate('/onboarding/seeker')} className="text-xs text-fire">Edit</button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {profile.quizAnswers && Object.entries(profile.quizAnswers).slice(0, 5).map(([qId, ansId]: [string, string]) => {
                    const labels: Record<string, string> = { before_10: 'Early Bird', after_12: 'Night Owl', veg: 'Vegetarian', non_veg: 'Non-veg', wfo: 'WFO', wfh: 'WFH' };
                    return <span key={qId} className="badge-teal text-[10px]">{labels[ansId] || ansId}</span>;
                  })}
                </div>
              </div>
            )}

            {/* Saved Alerts */}
            {profile?.savedSearches && profile.savedSearches.length > 0 && (
              <div className="card-nestmate p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2"><Bell className="w-4 h-4 text-fire" /> Saved Alerts</h4>
                </div>
                <div className="space-y-2">
                  {profile.savedSearches.map(alert => (
                    <div key={alert.id} className="bg-cream/50 p-3 rounded-xl border border-border flex flex-col gap-2">
                      <div className="flex items-start justify-between">
                        <button 
                          onClick={() => updateFilters(alert.filters)}
                          className="text-left text-sm font-medium hover:text-fire transition-colors"
                        >
                          {alert.name}
                        </button>
                        <button 
                          onClick={() => {
                            if (user?.uid) deleteSearch(user.uid, alert);
                          }}
                          className="text-ink/30 hover:text-red-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {alert.filters.city && <span className="badge-teal text-[9px]">{alert.filters.city}</span>}
                        {alert.filters.budgetMax && <span className="badge-gold text-[9px]">₹{alert.filters.budgetMax/1000}k</span>}
                        {alert.filters.flatType?.map((ft: string) => <span key={ft} className="bg-ink/5 text-ink/70 px-1.5 py-0.5 rounded text-[9px]">{ft}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unlimited Connects Widget */}
            <div className="card-nestmate p-4 border border-teal/20 bg-teal/5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-xs text-ink flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal" /> Unlimited Connects
                  </h4>
                  <p className="text-[10px] text-ink/60 mt-0.5">NestMate is 100% free for everyone</p>
                </div>
                <span className="text-[10px] font-bold text-teal bg-teal-light px-2 py-0.5 rounded-full border border-teal/20">
                  FREE
                </span>
              </div>
            </div>

            {/* Owner Promo */}
            <div className="card-nestmate p-5 gradient-dark text-white shadow-xl border border-fire/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-fire/20 rounded-xl flex items-center justify-center flex-shrink-0 border border-fire/30">
                  <Home className="w-6 h-6 text-fire" />
                </div>
                <div>
                  <h4 className="font-display italic text-lg mb-1 leading-tight text-white">Got a room to list?</h4>
                  <p className="text-xs text-white/60 mb-4 leading-relaxed">Switch to Owner mode and find the perfect roommate today.</p>
                  <button onClick={() => navigate('/onboarding/owner')} className="px-5 py-2.5 w-full bg-fire hover:bg-fire-dark rounded-xl text-xs font-semibold transition-all">List My Room</button>
                </div>
              </div>
            </div>
          </aside>

          {/* ─── Main Content ─── */}
          <div className="flex-1 min-w-0">
            {/* Tabs Bar */}
            <div className="flex border-b border-ink/10 mb-5 relative overflow-x-auto">
              <button 
                onClick={() => setActiveTab('all')} 
                className={`py-3 px-6 text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === 'all' ? 'text-fire' : 'text-ink/60 hover:text-ink/80'}`}
              >
                All Matches
              </button>
              <button 
                onClick={() => setActiveTab('saved')} 
                className={`py-3 px-6 text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'saved' ? 'text-fire' : 'text-ink/60 hover:text-ink/80'}`}
              >
                Saved Profiles
                {savedProfileIds.length > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'saved' ? 'bg-fire text-white' : 'bg-ink/10 text-ink/60'}`}>
                    {savedProfileIds.length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('connections')} 
                className={`py-3 px-6 text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'connections' ? 'text-fire' : 'text-ink/60 hover:text-ink/80'}`}
              >
                My Connections
                {acceptedConnectedUids.length > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'connections' ? 'bg-emerald-600 text-white' : 'bg-ink/10 text-ink/60'}`}>
                    {acceptedConnectedUids.length}
                  </span>
                )}
              </button>
              {/* Active Tab Indicator */}
              <div 
                className="absolute bottom-0 h-0.5 bg-fire transition-all duration-300 ease-out" 
                style={{ 
                  left: activeTab === 'all' ? '0' : activeTab === 'saved' ? '110px' : '255px', 
                  width: activeTab === 'all' ? '110px' : activeTab === 'saved' ? '145px' : '155px'
                }}
              />
            </div>

            {/* Top Bar (Filters/Search/Sort) */}
            <div className="frosted-glass rounded-2xl p-3 mb-5 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full flex items-center gap-2">
                {/* Mobile Filters Trigger (Vaul Drawer) */}
                <div className="lg:hidden">
                  <Drawer.Root open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                    <Drawer.Trigger asChild>
                      <button className="flex items-center gap-2 px-4 py-2 bg-white/50 border border-border rounded-xl text-sm font-medium text-ink hover:border-fire transition-colors">
                        <Filter className="w-4 h-4 text-fire" />
                        <span className="hidden sm:inline">Filters</span>
                      </button>
                    </Drawer.Trigger>
                    <Drawer.Portal>
                      <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm" />
                      <Drawer.Content className="bg-parchment flex flex-col rounded-t-[20px] max-h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-[100] shadow-2xl">
                        <div className="p-4 bg-white rounded-t-[20px] flex-1 overflow-y-auto">
                          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-ink/10 mb-6" />
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold">Filters</h2>
                            <button onClick={() => setMobileFiltersOpen(false)} className="p-2 bg-ink/5 rounded-full hover:bg-ink/10">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <FilterPanel filters={filters} updateFilters={updateFilters} profile={profile} onSaveSearch={saveSearch} />
                          <div className="mt-6">
                            <button onClick={() => setMobileFiltersOpen(false)} className="w-full py-3 bg-fire text-white rounded-xl font-medium">Apply Filters</button>
                          </div>
                        </div>
                      </Drawer.Content>
                    </Drawer.Portal>
                  </Drawer.Root>
                </div>
                
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by name, profession, locality..."
                    className="w-full pl-9 pr-9 py-2 bg-white/50 rounded-xl text-sm border border-border outline-none focus:border-fire" />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/60">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <select value={sortMode} onChange={e => setSortMode(e.target.value as any)}
                className="bg-cream/50 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-fire flex-shrink-0">
                <option value="best">Best Match</option>
                <option value="newest">Newest First</option>
                <option value="budgetAsc">Budget: Low → High</option>
                <option value="budgetDesc">Budget: High → Low</option>
              </select>
              <div className="hidden sm:flex bg-cream/50 rounded-xl p-0.5 border border-border flex-shrink-0">
                <button type="button" onClick={() => setViewMode('grid')} aria-label="Grid view" className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-fire' : 'text-ink/40'}`}><LayoutGrid className="w-4 h-4" /></button>
                <button type="button" onClick={() => setViewMode('list')} aria-label="List view" className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-fire' : 'text-ink/40'}`}><List className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Skeleton Loading State */}
            {isLoading && <StateSkeletonGrid count={6} />}

            {/* Featured Best Match (Only show in All Matches) */}
            {!isLoading && activeTab === 'all' && bestMatch && (() => {
              const bState = getConnectState(bestMatch.profile.uid || '');
              const activeStatus = getActiveStatus(bestMatch.profile.lastActiveAt);
              return (
                <div onClick={() => navigate(`/match/${bestMatch.profile.uid}`)} className="card-nestmate-hover p-0 overflow-hidden mb-5 cursor-pointer">
                  <div className="flex flex-col sm:flex-row relative">
                    <div className="sm:w-[265px] bg-gradient-to-br from-ink to-navy p-5 flex flex-col items-center justify-center relative overflow-hidden">
                      {(bestMatch.profile as any)._listing?.images?.[0] && (
                        <img src={(bestMatch.profile as any)._listing.images[0]} alt="Flat" className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay" />
                      )}
                      <span className="absolute top-3 left-3 bg-gold/90 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 z-10">
                        <Star className="w-3 h-3" /> Best Match Today
                      </span>
                      {bestMatch.profile.createdAt?.toMillis && (Date.now() - bestMatch.profile.createdAt.toMillis() < 7 * 24 * 60 * 60 * 1000) && (
                        <div className="absolute top-10 left-3 bg-[#F59E0B] text-ink text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-10">
                          NEW
                        </div>
                      )}
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCompatModal(bestMatch); }} className={`absolute top-3 right-3 ${compatibilityColor(bestMatch.compatibilityScore)} text-white text-xs font-bold px-2 py-1 rounded-full hover:opacity-90 transition-opacity`}>
                        {bestMatch.compatibilityScore}%
                      </button>
                      <div className="absolute bottom-3 right-3 flex justify-center pointer-events-none">
                        <div className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm ${getSharedCount(bestMatch) >= 7 ? 'bg-green-100 text-green-700' : getSharedCount(bestMatch) >= 4 ? 'bg-amber-100 text-amber-700' : 'bg-ink/10 text-ink/60'}`}>
                          <Check className="w-3 h-3" />
                          {getSharedCount(bestMatch)}/10 matches
                        </div>
                      </div>
                      <div className="relative mb-3 mt-4">
                        <img src={bestMatch.profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${bestMatch.profile.name}`} alt={bestMatch.profile.name} loading="lazy" className="w-20 h-20 rounded-full border-3 border-white/30" />
                        {activeStatus.status !== 'offline' && (
                          <div className={`absolute bottom-0 right-1 w-2 h-2 rounded-full border border-white shadow-sm ${activeStatus.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`} />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1 mb-1 justify-center sm:justify-start">
                        <p className="text-white font-semibold text-sm">{bestMatch.profile.name}</p>
                        {bestMatch.profile.workEmailVerified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" aria-label="Corporate Verified" />}
                        {bestMatch.profile.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-teal" aria-label="ID Verified" />}
                      </div>
                      <p className={`text-[10px] mb-1 font-medium ${activeStatus.status === 'online' ? 'text-green-400' : 'text-white/70'}`}>
                        {activeStatus.text}
                      </p>
                      <p className="text-white/50 text-xs">{bestMatch.profile.profession}</p>
                    </div>
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{bestMatch.profile.name}{bestMatch.profile.age ? `, ${bestMatch.profile.age}` : ''}</h3>
                          <p className="text-sm text-ink/50 mb-2">{bestMatch.profile.profession} · {bestMatch.profile.city}</p>
                          <div className="flex flex-wrap gap-1">
                            {getLifestyleTags(bestMatch).map((tag, i) => (
                              <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tag.match ? 'bg-teal/10 text-teal' : 'bg-ink/5 text-ink/60'}`}>
                                {tag.label}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleSave(bestMatch.profile.uid || ''); }} disabled={savingId === bestMatch.profile.uid}
                          className={`p-2 rounded-lg transition-all ${savedProfileIds.includes(bestMatch.profile.uid || '') ? 'text-red-500 bg-red-50' : 'text-ink/30 hover:text-red-400'}`}>
                          {savingId === bestMatch.profile.uid ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className={`w-4 h-4 ${savedProfileIds.includes(bestMatch.profile.uid || '') ? 'fill-current' : ''}`} />}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-parchment rounded-xl p-3">
                          <p className="text-xs text-ink/50">Budget</p>
                          <p className="font-bold text-sm">₹{bestMatch.profile.budget?.toLocaleString()}<span className="text-xs font-normal text-ink/50">/mo</span></p>
                        </div>
                        <div className="bg-parchment rounded-xl p-3">
                          <p className="text-xs text-ink/50">Move-in</p>
                          <p className="font-bold text-sm text-teal">{bestMatch.profile.moveInDate || 'Flexible'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSkip(bestMatch.profile.uid || '', bestMatch.profile.name || ''); }} className="flex-1 py-2.5 border border-ink/10 rounded-xl text-sm font-medium text-ink/60 hover:bg-ink/5 transition-all">Skip</button>
                        {bestMatch.listingId && (
                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/room/${bestMatch.listingId}`); }} className="flex-1 py-2.5 bg-ink/5 text-ink/80 rounded-xl text-sm font-medium hover:bg-ink/10 transition-all flex items-center justify-center gap-1.5">
                            <Home className="w-4 h-4" /> View Flat
                          </button>
                        )}
                        <button
                          disabled={bState === 'pending_sent' || connectingId === bestMatch.profile.uid}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleConnect(bestMatch.profile.uid || '', bestMatch.profile.name || ''); }}
                          className={`flex-[1.5] py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                            bState === 'chat' ? 'bg-teal text-white hover:opacity-90' :
                            bState === 'pending_sent' ? 'bg-ink/10 text-ink/40 cursor-not-allowed' :
                            bState === 'pending_received' ? 'bg-teal text-white hover:opacity-90' :
                            'bg-fire text-white hover:bg-fire-dark'
                          }`}
                        >
                          {connectingId === bestMatch.profile.uid ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                          {bState === 'chat' ? 'Chat' : bState === 'pending_sent' ? 'Request Sent' : bState === 'pending_received' ? 'Accept Request' : 'Connect'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Match Grid */}
            {!isLoading && gridMatches.length > 0 && (
              <div className={viewMode === 'grid' ? 'grid sm:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-3'}>
                {gridMatches.map(match => {
                  const p = match.profile;
                  const isSaved = savedProfileIds.includes(p.uid || '');
                  const cState = getConnectState(p.uid || '');
                  const gridActiveStatus = getActiveStatus(p.lastActiveAt);
                  return (
                    <div key={p.uid} onClick={() => navigate(`/match/${p.uid}`)} className={`card-nestmate-hover overflow-hidden cursor-pointer ${viewMode === 'list' ? 'flex' : ''}`}>
                      <div className={`relative ${viewMode === 'list' ? 'w-32 flex-shrink-0' : ''}`}>
                        {p.createdAt?.toMillis && (Date.now() - p.createdAt.toMillis() < 7 * 24 * 60 * 60 * 1000) && (
                          <div className="absolute top-2 left-2 bg-[#F59E0B] text-ink text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-10">
                            NEW
                          </div>
                        )}
                        <div className={`bg-gradient-to-br from-ink/80 to-navy/80 ${viewMode === 'list' ? 'h-full' : 'h-[168px]'} flex items-center justify-center relative overflow-hidden`}>
                          {(p as any)._listing?.images?.[0] && (
                            <img src={(p as any)._listing.images[0]} alt="Flat" className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay" />
                          )}
                          <div className="relative">
                            <img src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} alt={p.name} loading="lazy" className="w-16 h-16 rounded-full border-2 border-white/20" />
                            {gridActiveStatus.status !== 'offline' && (
                              <div className={`absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border border-white shadow-sm ${gridActiveStatus.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`} />
                            )}
                          </div>
                        </div>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCompatModal(match); }} className={`absolute top-2 right-2 ${compatibilityColor(match.compatibilityScore)} text-white text-[10px] font-bold px-2 py-0.5 rounded-full hover:opacity-90`}>
                          {match.compatibilityScore}%
                        </button>
                        <div className="absolute bottom-2 left-2 right-2 flex justify-center pointer-events-none">
                          <div className={`text-[9px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm ${getSharedCount(match) >= 7 ? 'bg-green-100 text-green-700' : getSharedCount(match) >= 4 ? 'bg-amber-100 text-amber-700' : 'bg-ink/10 text-ink/60'}`}>
                            <Check className="w-3 h-3" />
                            {getSharedCount(match)}/10 matches
                          </div>
                        </div>
                      </div>
                      <div className="p-4 flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h4 className="font-semibold text-sm">{p.name}{p.age ? `, ${p.age}` : ''}</h4>
                              {p.workEmailVerified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" aria-label="Corporate Verified" />}
                              {p.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-teal" aria-label="ID Verified" />}
                            </div>
                            <p className={`text-[10px] leading-none mb-1 font-medium ${gridActiveStatus.status === 'online' ? 'text-green-600' : 'text-ink/40'}`}>
                              {gridActiveStatus.text}
                            </p>
                            <p className="text-xs text-ink/50">{p.profession}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleSave(p.uid || ''); }} disabled={savingId === p.uid}
                              className={`p-1.5 rounded-lg transition-all ${isSaved && activeTab === 'all' ? 'text-red-500 bg-red-50' : isSaved && activeTab === 'saved' ? 'text-ink/30 hover:text-red-500 hover:bg-red-50 border border-ink/20 flex items-center gap-1 px-3' : 'text-ink/30 hover:text-red-400'}`}>
                              {savingId === p.uid ? <Loader2 className="w-4 h-4 animate-spin" /> : activeTab === 'saved' ? <><HeartOff className="w-4 h-4" /><span className="text-xs">Unsave</span></> : <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />}
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="p-1.5 text-ink/30 hover:text-ink/60 hover:bg-ink/5 rounded-lg transition-all">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); setReportingUser(match); }} className="text-amber-600 focus:text-amber-600 cursor-pointer">
                                  <Flag className="w-4 h-4 mr-2" /> Report User
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleBlockUser(p.uid || '', p.name); }} className="text-red-600 focus:text-red-600 cursor-pointer">
                                  <Ban className="w-4 h-4 mr-2" /> Block User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {getLifestyleTags(match).map((tag, i) => (
                            <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${tag.match ? 'bg-teal/10 text-teal' : 'bg-ink/5 text-ink/60'}`}>
                              {tag.label}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-ink/60 mb-3"><span className="font-medium text-fire">₹{p.budget?.toLocaleString()}</span>/mo · {p.city}</p>
                        <div className="flex gap-2 mt-3">
                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSkip(p.uid || '', p.name || ''); }} className="flex-1 py-2 border border-ink/10 rounded-lg text-xs font-medium text-ink/60 hover:bg-ink/5">Skip</button>
                          {match.listingId && (
                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/room/${match.listingId}`); }} className="flex-1 py-2 bg-ink/5 text-ink/80 rounded-lg text-xs font-medium hover:bg-ink/10 flex items-center justify-center gap-1">
                              <Home className="w-3 h-3" /> Flat
                            </button>
                          )}
                          <button
                            disabled={cState === 'pending_sent' || connectingId === p.uid}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleConnect(p.uid || '', p.name || ''); }}
                            className={`flex-[1.5] py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                              cState === 'chat' ? 'bg-teal text-white' :
                              cState === 'pending_sent' ? 'bg-ink/10 text-ink/40 cursor-not-allowed' :
                              cState === 'pending_received' ? 'bg-teal text-white' :
                              'bg-fire text-white hover:bg-fire-dark'
                            }`}
                          >
                            {connectingId === p.uid ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                            {cState === 'chat' ? 'Chat' : cState === 'pending_sent' ? 'Sent' : cState === 'pending_received' ? 'Accept' : 'Connect'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Infinite Scroll Load More */}
            {!isLoading && activeTab === 'all' && (
              <div className="mt-8 mb-4 text-center">
                {isLoadingMore ? (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 text-left">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={`skel-${i}`} className="bg-white rounded-2xl overflow-hidden shadow-card">
                        <div className="h-[168px] skeleton-shimmer" />
                        <div className="p-4 space-y-2">
                          <div className="h-4 w-3/4 skeleton-shimmer rounded-lg" />
                          <div className="h-3 w-1/2 skeleton-shimmer rounded-lg" />
                          <div className="h-3 w-2/3 skeleton-shimmer rounded-lg mt-3" />
                          <div className="flex gap-2 mt-3">
                            <div className="flex-1 h-8 skeleton-shimmer rounded-lg" />
                            <div className="flex-1 h-8 skeleton-shimmer rounded-lg" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : hasMore ? (
                  <button onClick={handleLoadMore} className="btn-outline">Show More Matches ↓</button>
                ) : matches.length > 0 ? (
                  <p className="text-ink/50 text-sm font-medium">No more matches</p>
                ) : null}
              </div>
            )}

            {/* Empty States */}
            {!isLoading && filteredMatches.length === 0 && activeTab === 'all' && (
              <StateEmpty
                icon={Search}
                title="No matches found"
                description="Try adjusting your filters or expanding your search"
                action={
                  <button onClick={() => updateFilters({ city: '', budgetMin: 1000, budgetMax: 25000, localities: [], gender: 'any', verifiedOnly: false })} className="btn-outline text-sm">
                    Reset Filters
                  </button>
                }
              />
            )}
            
            {!isLoading && filteredMatches.length === 0 && activeTab === 'saved' && (
              <div className="bg-white/50 rounded-3xl border border-ink/5 shadow-sm">
                <StateEmpty
                  icon={Bookmark}
                  title="No saved profiles yet"
                  description="Heart a profile to save it for later"
                  action={
                    <button onClick={() => setActiveTab('all')} className="btn-fire text-sm px-6">
                      Browse Matches
                    </button>
                  }
                />
              </div>
            )}

            {!isLoading && activeTab === 'all' && profile && (
              <MapPreview currentUser={profile} topMatches={filteredMatches} />
            )}
          </div>
        </div>
      </div>

      {/* Compatibility Modal */}
      {compatModal && (() => {
        const bd = getCompatBreakdown(compatModal);
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setCompatModal(null)}>
            <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" />
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <button onClick={() => setCompatModal(null)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-ink/5 text-ink/40">
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3 mb-5">
                <img src={compatModal.profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${compatModal.profile.name}`} alt="" loading="lazy" className="w-12 h-12 rounded-full" />
                <div>
                  <h3 className="font-semibold">{compatModal.profile.name}</h3>
                  <span className={`${compatibilityColor(compatModal.compatibilityScore)} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>{compatModal.compatibilityScore}% Compatible</span>
                </div>
              </div>
              <div className="space-y-4">
                {[{label: 'Lifestyle Match', value: bd.lifestyle}, {label: 'Budget Overlap', value: bd.budgetMatch}, {label: 'Location Match', value: bd.locationMatch}].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-ink/70">{item.label}</span>
                      <span className="font-bold">{item.value}%</span>
                    </div>
                    <div className="h-2 bg-cream rounded-full overflow-hidden">
                      <div className="h-full bg-fire rounded-full transition-all duration-700" style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
      {/* Report User Modal */}
      <Dialog open={!!reportingUser} onOpenChange={(open) => !open && setReportingUser(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-display italic text-xl">Report User</DialogTitle>
            <DialogDescription>
              Help us understand what's happening with {reportingUser?.profile.name}. Your report is anonymous.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink/70">Reason for reporting</label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Spam or Scammer</SelectItem>
                  <SelectItem value="harassment">Harassment or Abuse</SelectItem>
                  <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                  <SelectItem value="fake">Fake Profile</SelectItem>
                  <SelectItem value="other">Other Reason</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink/70">Additional details (optional)</label>
              <Textarea 
                placeholder="Please describe the issue..." 
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setReportingUser(null)} disabled={isSubmittingReport}>
              Cancel
            </Button>
            <Button 
              className="bg-fire hover:bg-fire-dark text-white" 
              onClick={handleSubmitReport} 
              disabled={isSubmittingReport || !reportReason}
            >
              {isSubmittingReport ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Flag className="w-4 h-4 mr-2" />}
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── FilterPanel Component (Desktop & Mobile Content) ───
function FilterPanel({ filters, updateFilters, profile, onSaveSearch }: { filters: any, updateFilters: any, profile: any, onSaveSearch: any }) {
  const safeMin = typeof filters.budgetMin === 'number' && !isNaN(filters.budgetMin) ? filters.budgetMin : 1000;
  const safeMax = typeof filters.budgetMax === 'number' && !isNaN(filters.budgetMax) ? filters.budgetMax : 25000;
  
  const [localBudget, setLocalBudget] = useState([safeMin, safeMax]);
  const [isSavingAlert, setIsSavingAlert] = useState(false);

  // Sync local state if global filters change externally (e.g. Reset)
  useEffect(() => {
    setLocalBudget([safeMin, safeMax]);
  }, [safeMin, safeMax]);

  const handleSaveAlert = async () => {
    if (!profile?.uid) return;
    setIsSavingAlert(true);
    try {
      const name = `${filters.city || 'Anywhere'} under ₹${(filters.budgetMax/1000).toFixed(0)}k`;
      await onSaveSearch(profile.uid, {
        id: Date.now().toString(),
        name,
        filters,
        createdAt: new Date().toISOString()
      });
      toast.success('Search alert saved!');
    } catch {
      toast.error('Failed to save alert');
    } finally {
      setIsSavingAlert(false);
    }
  };

  return (
    <div className="card-nestmate p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-sm">Filters</h4>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSaveAlert}
            disabled={isSavingAlert}
            className="text-xs text-teal font-medium hover:underline flex items-center gap-1"
          >
            {isSavingAlert ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
            Save Alert
          </button>
          <button onClick={() => {
            updateFilters({ city: '', budgetMin: 1000, budgetMax: 25000, localities: [], gender: 'any', verifiedOnly: false, flatType: [], furnishing: [], amenities: [] });
            setLocalBudget([1000, 25000]);
          }} className="text-xs text-fire font-medium hover:underline">Reset</button>
        </div>
      </div>
      <div className="space-y-6">
        <div>
          <label className="text-xs text-ink/50 mb-1.5 block">City</label>
          <select value={filters.city} onChange={e => updateFilters({ city: e.target.value })} className="w-full text-sm bg-cream/50 border border-border rounded-lg px-3 py-2 outline-none focus:border-fire">
            <option value="">All Cities</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        
        {/* Custom Dual-Thumb Budget Slider */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="text-xs text-ink/50">Budget</label>
            <span className="text-xs font-semibold text-ink">₹{localBudget[0].toLocaleString()} - ₹{localBudget[1].toLocaleString()}</span>
          </div>
          <div className="relative h-2 w-full bg-ink/10 rounded-full mt-2">
            {/* Active Range Track */}
            <div 
              className="absolute h-full bg-fire rounded-full" 
              style={{ 
                left: `${((localBudget[0] - 1000) / 49000) * 100}%`, 
                right: `${100 - ((localBudget[1] - 1000) / 49000) * 100}%` 
              }} 
            />
            
            {/* Min Input */}
            <input 
              type="range" 
              min={1000} 
              max={50000} 
              step={500} 
              value={localBudget[0]} 
              onChange={e => {
                const val = Math.min(parseInt(e.target.value), localBudget[1] - 500);
                setLocalBudget([val, localBudget[1]]);
              }}
              onMouseUp={() => updateFilters({ budgetMin: localBudget[0] })}
              onTouchEnd={() => updateFilters({ budgetMin: localBudget[0] })}
              className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-fire [&::-webkit-slider-thumb]:shadow-md"
              style={{ zIndex: localBudget[0] > 25000 ? 5 : 3 }}
            />
            
            {/* Max Input */}
            <input 
              type="range" 
              min={1000} 
              max={50000} 
              step={500} 
              value={localBudget[1]} 
              onChange={e => {
                const val = Math.max(parseInt(e.target.value), localBudget[0] + 500);
                setLocalBudget([localBudget[0], val]);
              }}
              onMouseUp={() => updateFilters({ budgetMax: localBudget[1] })}
              onTouchEnd={() => updateFilters({ budgetMax: localBudget[1] })}
              className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-fire [&::-webkit-slider-thumb]:shadow-md"
              style={{ zIndex: 4 }}
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-ink/50 mb-1.5 block">Localities</label>
          <select
            value=""
            onChange={e => { if (e.target.value) updateFilters({ localities: [...filters.localities, e.target.value] }); }}
            className="w-full text-sm bg-cream/50 border border-border rounded-lg px-3 py-2 outline-none focus:border-fire"
          >
            <option value="">Add locality...</option>
            {(filters.city ? localitiesByCity[filters.city] || [] : Object.values(localitiesByCity).flat())
              .filter(l => !filters.localities.includes(l))
              .map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          {filters.localities.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {filters.localities.map((l: string) => (
                <span key={l} className="badge-fire text-[10px]">{l} <button onClick={() => updateFilters({ localities: filters.localities.filter((x: string) => x !== l) })}>×</button></span>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="text-xs text-ink/50 mb-1.5 block">Gender</label>
          <div className="flex gap-1">
            {['any', 'female', 'male'].map(g => (
              <button key={g} onClick={() => updateFilters({ gender: g })} className={`flex-1 py-1.5 rounded-lg text-xs capitalize transition-all ${filters.gender === g ? 'bg-fire text-white' : 'bg-cream/50 text-ink/60 hover:bg-fire/10'}`}>{g}</button>
            ))}
          </div>
        </div>


      </div>
    </div>
  );
}
