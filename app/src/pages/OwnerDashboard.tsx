import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useListings } from '@/hooks/useListings';
import { useConnections } from '@/hooks/useConnections';
import { useChat } from '@/hooks/useChat';
import { useNotifications } from '@/hooks/useNotifications';
import type { Listing } from '@/hooks/useListings';
import type { Connection } from '@/hooks/useConnections';
import type { UserProfile } from '@/hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  TrendingUp, MessageCircle, Edit3, Zap, Eye, Users, Settings, MapPin,
  Shield, Check, X, Crown, Pause, Play, Trash2, AlertTriangle, CheckCircle2, Plus, UserCheck
} from 'lucide-react';
import StateLoading from '@/components/StateLoading';
import StateEmpty from '@/components/StateEmpty';
import PageShell from '@/components/PageShell';

interface PendingApplicant {
  connection: Connection;
  profile: UserProfile;
}

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { getMyListings, updateListing, deleteListing, getWeeklyViews } = useListings();
  const { subscribeToIncoming, getMyConnections, acceptRequest, rejectRequest } = useConnections();
  const { subscribeToChatRooms, getOrCreateChatRoom } = useChat();
  const { createNotification } = useNotifications();

  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [myListing, setMyListing] = useState<Listing | null>(null);
  const [pendingApplicants, setPendingApplicants] = useState<PendingApplicant[]>([]);
  const [acceptedConnections, setAcceptedConnections] = useState<PendingApplicant[]>([]);
  const [chatCount, setChatCount] = useState(0);
  const [weeklyViews, setWeeklyViews] = useState<{ day: string; views: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Deep-link support: /owner-dashboard?request={connectionId}
  const [searchParams] = useSearchParams();
  const highlightedRequestId = searchParams.get('request');

  // Auto-scroll to highlighted request when landing from a notification deep-link
  useEffect(() => {
    if (!highlightedRequestId || pendingApplicants.length === 0) return;
    const el = document.getElementById(`request-${highlightedRequestId}`);
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400);
    }
  }, [highlightedRequestId, pendingApplicants]);

  // Load listings
  useEffect(() => {
    if (!user?.uid) return;
    getMyListings(user.uid)
      .then(async listings => {
        setAllListings(listings);
        const listing = listings[0] || null;
        setMyListing(listing);
        // Load weekly views for real chart
        if (listing?.id) {
          const views = await getWeeklyViews(listing.id);
          setWeeklyViews(views);
        }
      })
      .catch(err => console.error('Failed to load listings:', err))
      .finally(() => setIsLoading(false));
  }, [user?.uid]);

  // Real-time chat count
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToChatRooms(user.uid, rooms => {
      setChatCount(rooms.length);
    });
    return () => unsub();
  }, [user?.uid]);

  // Real-time incoming connection requests
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToIncoming(user.uid, async connections => {
      const applicants: PendingApplicant[] = [];
      for (const conn of connections) {
        const snap = await getDoc(doc(db, 'users', conn.fromUserId));
        if (snap.exists()) {
          applicants.push({ connection: conn, profile: snap.data() as UserProfile });
        }
      }
      setPendingApplicants(applicants);
    });
    return () => unsub();
  }, [user?.uid]);

  const handleAccept = async (applicant: PendingApplicant) => {
    if (!user?.uid) return;
    await acceptRequest(applicant.connection.id);
    const roomId = await getOrCreateChatRoom(user.uid, applicant.connection.fromUserId);
    await createNotification({
      userId: applicant.connection.fromUserId,
      type: 'connect',
      title: 'Connection Accepted!',
      description: `${profile?.name || 'A user'} accepted your connect request. Start chatting!`,
      read: false,
      actionUrl: `/chat/${roomId}`,
    });
    navigate(`/chat/${roomId}`);
  };

  const handleReject = async (applicant: PendingApplicant) => {
    await rejectRequest(applicant.connection.id);
  };

  const handleSelectListing = async (listing: Listing) => {
    setMyListing(listing);
    if (listing?.id) {
      const views = await getWeeklyViews(listing.id);
      setWeeklyViews(views);
    } else {
      setWeeklyViews([]);
    }
  };

  const handleToggleStatus = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!myListing) return;
    const newStatus: 'active' | 'paused' = myListing.status === 'active' ? 'paused' : 'active';
    try {
      await updateListing(myListing.id, { status: newStatus });
      const updatedListing = { ...myListing, status: newStatus };
      setMyListing(updatedListing);
      setAllListings(prev => prev.map(l => l.id === myListing.id ? updatedListing : l));
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const handleDeleteListing = async () => {
    if (!myListing) return;
    await deleteListing(myListing.id);
    const remaining = allListings.filter(l => l.id !== myListing.id);
    setAllListings(remaining);
    setMyListing(remaining[0] || null);
    setShowDeleteConfirm(false);
  };

  const handleDeleteSpecificListing = async (e: React.MouseEvent, listingId: string) => {
    e.stopPropagation();
    try {
      await deleteListing(listingId);
      const remaining = allListings.filter(l => l.id !== listingId);
      setAllListings(remaining);
      if (myListing?.id === listingId) {
        setMyListing(remaining[0] || null);
      }
    } catch (err) {
      console.error('Failed to delete listing', err);
    }
  };

  const handleCleanDuplicates = async () => {
    if (allListings.length <= 1) return;
    const seen = new Set<string>();
    const toKeep: Listing[] = [];
    const toDeleteIds: string[] = [];

    allListings.forEach(l => {
      const key = `${l.locality.toLowerCase().trim()}_${l.flatType.toLowerCase().trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        toKeep.push(l);
      } else {
        toDeleteIds.push(l.id);
      }
    });

    if (toDeleteIds.length === 0) return;

    for (const id of toDeleteIds) {
      await deleteListing(id);
    }

    setAllListings(toKeep);
    setMyListing(toKeep[0] || null);
  };

  if (isLoading) return <StateLoading label="Loading dashboard..." fullScreen />;

  const totalWeeklyViews = weeklyViews.reduce((s, d) => s + d.views, 0);

  const hasDuplicateProperties = allListings.some(l => 
    allListings.filter(x => x.locality.toLowerCase().trim() === l.locality.toLowerCase().trim() && x.flatType === l.flatType).length > 1
  );

  return (
    <PageShell maxWidth="max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Listing Selector & Limit check */}
            {allListings.length > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-white/40 backdrop-blur-md border border-border p-4 rounded-2xl shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-[10px] font-bold text-ink/40 uppercase tracking-widest block">Select Property</label>
                    {hasDuplicateProperties && (
                      <button
                        onClick={handleCleanDuplicates}
                        className="text-[10px] font-bold text-red-500 hover:text-red-600 underline transition-colors"
                        title="Delete duplicate listings created during testing"
                      >
                        Remove Duplicates
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allListings.map((l, index) => {
                      const isDuplicateName = allListings.filter(x => x.locality === l.locality && x.flatType === l.flatType).length > 1;
                      const isSelected = myListing?.id === l.id;
                      return (
                        <div key={l.id} className="relative group">
                          <button
                            onClick={() => handleSelectListing(l)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? 'border-fire bg-fire text-white shadow-sm shadow-fire/20 font-bold pr-7'
                                : 'border-border bg-white hover:border-fire/30 text-ink/70 pr-7'
                            }`}
                          >
                            <span>{l.title ? (l.title.length > 22 ? `${l.title.substring(0, 22)}...` : l.title) : `${l.locality} (${l.flatType})`}</span>
                            {isDuplicateName && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-white/20 text-white' : 'bg-ink/10 text-ink/60'}`}>
                                #{index + 1}
                              </span>
                            )}
                          </button>
                          {allListings.length > 1 && (
                            <button
                              onClick={(e) => handleDeleteSpecificListing(e, l.id)}
                              className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center text-[10px] transition-all ${
                                isSelected ? 'bg-white/30 text-white hover:bg-white/50' : 'bg-ink/10 text-ink/50 hover:bg-red-500 hover:text-white'
                              }`}
                              title="Delete this listing"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-auto sm:ml-0 self-stretch sm:self-auto justify-between sm:justify-start">
                  <span className="text-xs text-teal font-medium bg-teal-light px-2.5 py-1 rounded-full border border-teal/20">
                    Unlimited Listings (Free)
                  </span>
                  <button
                    onClick={() => navigate('/onboarding/owner')}
                    className="px-4 py-2.5 bg-fire text-white text-xs font-bold rounded-xl hover:bg-fire-dark transition-all flex items-center gap-1.5 shadow-md shadow-fire/10 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Property
                  </button>
                </div>
              </div>
            )}

            {/* Listing Hero */}
            {myListing ? (
              <div className="relative rounded-2xl overflow-hidden mb-6 shadow-xl border border-border group">
                {/* Background Image with Gradient Overlay */}
                <div className="absolute inset-0">
                  {myListing.images && myListing.images.length > 0 ? (
                    <img src={myListing.images[0]} alt="Listing cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-navy" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-navy/30" />
                </div>
                
                {/* Content */}
                <div className="relative p-4 sm:p-6 pt-16 sm:pt-20 text-white flex flex-col justify-end min-h-[280px] sm:min-h-[340px]">
                  {/* Top Action Buttons */}
                  <div className="absolute top-4 right-4 flex flex-wrap justify-end gap-2 z-10">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md ${
                      myListing.status === 'active' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    }`}>
                      <span className={`w-2 h-2 rounded-full animate-pulse ${myListing.status === 'active' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                      {myListing.status === 'active' ? 'LIVE' : 'PAUSED'}
                    </span>
                    <button onClick={handleToggleStatus} className="p-2 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-all border border-white/10 text-white" title={myListing.status === 'active' ? 'Pause Listing' : 'Resume Listing'} aria-label={myListing.status === 'active' ? 'Pause listing' : 'Resume listing'}>
                      {myListing.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button onClick={() => navigate(`/edit-listing/${myListing.id}`)} className="p-2 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-all border border-white/10 text-white" title="Edit Listing" aria-label="Edit listing">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setShowDeleteConfirm(true)} className="p-2 bg-red-500/40 backdrop-blur-md rounded-full hover:bg-red-500/60 transition-all border border-red-500/50 text-white" title="Delete Listing" aria-label="Delete listing">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title & Location */}
                  <div className="mb-6">
                    <h2 className="text-2xl sm:text-3xl font-display font-bold italic mb-2 leading-tight drop-shadow-md line-clamp-2">{myListing.title}</h2>
                    <p className="text-sm text-white/80 flex items-center gap-1.5 drop-shadow">
                      <MapPin className="w-4 h-4 shrink-0" /> {myListing.locality}, {myListing.city}
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center shadow-lg">
                      <p className="text-xl sm:text-2xl font-bold">{pendingApplicants.length}</p>
                      <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider">Applicants</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center shadow-lg">
                      <p className="text-xl sm:text-2xl font-bold">{myListing.views || 0}</p>
                      <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider">Views</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center shadow-lg">
                      <p className="text-xl sm:text-2xl font-bold">{chatCount}</p>
                      <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider">Chats</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center shadow-lg">
                      <p className="text-xl sm:text-2xl font-bold">{totalWeeklyViews}</p>
                      <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider">This Week</p>
                    </div>
                  </div>

                  {/* Info Bar */}
                  <div className="grid grid-cols-3 gap-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 sm:p-4 shadow-lg">
                    <div className="flex flex-col">
                      <p className="text-[9px] sm:text-[10px] text-white/60 font-medium uppercase tracking-wider mb-0.5">Rent</p>
                      <p className="font-bold text-sm sm:text-lg leading-none truncate">₹{myListing.totalRent?.toLocaleString() || (myListing as any).monthlyRent?.toLocaleString() || '—'}</p>
                    </div>
                    <div className="flex flex-col border-l border-white/20 pl-2 sm:pl-3">
                      <p className="text-[9px] sm:text-[10px] text-white/60 font-medium uppercase tracking-wider mb-0.5">Deposit</p>
                      <p className="font-bold text-sm sm:text-lg leading-none text-fire truncate">₹{myListing.deposit?.toLocaleString() || '—'}</p>
                    </div>
                    <div className="flex flex-col border-l border-white/20 pl-2 sm:pl-3">
                      <p className="text-[9px] sm:text-[10px] text-white/60 font-medium uppercase tracking-wider mb-0.5">Type</p>
                      <p className="font-bold text-sm sm:text-lg leading-none text-teal-400 truncate">{myListing.flatType}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="gradient-dark rounded-2xl p-8 mb-6 text-white text-center">
                <Zap className="w-10 h-10 mx-auto mb-3 text-gold" />
                <h2 className="text-xl font-display italic mb-2">No listing yet</h2>
                <p className="text-sm text-white/60 mb-4">Create your first listing to start finding roommates</p>
                <button onClick={() => navigate('/onboarding/owner')} className="btn-fire text-sm">Create Listing</button>
              </div>
            )}

            {/* Pending Applicants */}
            <div className="card-nestmate p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold">Pending Requests ({pendingApplicants.length})</h3>
              </div>
              <div className="space-y-3">
                {pendingApplicants.map(applicant => {
                  const p = applicant.profile;
                  const isHighlighted = highlightedRequestId === applicant.connection.id;
                  return (
                    <div
                      key={applicant.connection.id}
                      id={`request-${applicant.connection.id}`}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                        isHighlighted
                          ? 'bg-fire/5 border-fire/30 shadow-sm shadow-fire/10 ring-1 ring-fire/20'
                          : 'bg-navy/5 border-navy/10'
                      }`}
                    >
                      <img src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} alt={p.name} className="w-12 h-12 rounded-full" />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-sm">{p.name}</h4>
                          {isHighlighted && (
                            <span className="text-[10px] font-bold bg-fire text-white px-2 py-0.5 rounded-full">New!</span>
                          )}
                          {p.workEmailVerified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" aria-label="Corporate Verified" />}
                          {(p.verificationLevel ?? 0) > 0 && <Shield className="w-3.5 h-3.5 text-teal" aria-label="ID Verified" />}
                        </div>
                        <p className="text-xs text-ink/50">{p.profession} · Budget: ₹{p.budget?.toLocaleString()}</p>
                        <span className="text-[10px] text-ink/40">Move-in: {p.moveInDate || 'Flexible'}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleReject(applicant)} className="p-2 border border-red-200 rounded-lg text-red-400 hover:bg-red-50 transition-all" title="Reject" aria-label={`Reject ${p.name}`}>
                          <X className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleAccept(applicant)} className="p-2 bg-fire rounded-lg text-white hover:bg-fire-dark transition-all" title="Accept & Chat" aria-label={`Accept ${p.name} and open chat`}>
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {pendingApplicants.length === 0 && (
                <StateEmpty
                  compact
                  icon={Users}
                  title="No pending requests"
                  description={
                    myListing
                      ? 'Your listing is live. Applicants will appear here.'
                      : 'Create a listing to start receiving roommate requests.'
                  }
                />
              )}
            </div>

            {/* Accepted Connections / Friends */}
            <div className="card-nestmate p-5 mt-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <UserCheck className="w-4.5 h-4.5 text-teal" />
                  My Connections ({acceptedConnections.length})
                </h3>
              </div>
              {acceptedConnections.length > 0 ? (
                <div className="space-y-3">
                  {acceptedConnections.map(conn => {
                    const p = conn.profile;
                    return (
                      <div
                        key={conn.connection.id}
                        className="flex items-center gap-4 p-4 rounded-xl border border-teal/20 bg-teal/5 transition-all"
                      >
                        <img src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} alt={p.name} className="w-12 h-12 rounded-full border border-teal/30 object-cover" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm">{p.name}</h4>
                            <span className="text-[10px] font-bold bg-teal text-white px-2 py-0.5 rounded-full">Connected ✓</span>
                          </div>
                          <p className="text-xs text-ink/50">{p.profession} · {p.city}</p>
                        </div>
                        <button
                          onClick={async () => {
                            const targetId = p.uid || conn.connection.fromUserId;
                            const roomId = await getOrCreateChatRoom(user.uid, targetId);
                            navigate(`/chat/${roomId}`);
                          }}
                          className="px-4 py-2 bg-fire text-white rounded-xl text-xs font-bold hover:bg-fire-dark transition-all flex items-center gap-1.5"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> Message
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-ink/40 text-center py-4">No accepted connections yet. Accept incoming requests to connect.</p>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="w-full lg:w-[360px] space-y-5">
            {/* Real Weekly Views Chart */}
            <div className="card-nestmate p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-sm">Weekly Views</h4>
                <span className="text-xs text-ink/40">{totalWeeklyViews} total</span>
              </div>
              {weeklyViews.length > 0 ? (
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyViews} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                        formatter={(v: number) => [v, 'Views']}
                      />
                      <Bar dataKey="views" radius={[4, 4, 0, 0]}>
                        {weeklyViews.map((_, i) => (
                          <Cell key={i} fill={i === weeklyViews.length - 1 ? '#E85C41' : '#E85C4133'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-28 flex items-center justify-center">
                  {myListing ? (
                    <p className="text-xs text-ink/40 text-center">No views recorded yet.<br />Views will appear as people browse your listing.</p>
                  ) : (
                    <p className="text-xs text-ink/40">Create a listing to see analytics</p>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="card-nestmate p-5">
              <h4 className="font-semibold text-sm mb-4">Quick Actions</h4>
              <div className="space-y-2">
                <button onClick={() => navigate('/chat')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-cream/50 hover:bg-fire/5 transition-all text-left">
                  <div className="w-9 h-9 bg-fire/10 rounded-lg flex items-center justify-center"><MessageCircle className="w-4 h-4 text-fire" /></div>
                  <div><p className="text-sm font-medium">Messages</p><p className="text-[10px] text-ink/50">View all conversations</p></div>
                  {chatCount > 0 && <span className="ml-auto text-xs font-bold text-fire">{chatCount}</span>}
                </button>

                {myListing && (
                  <button onClick={() => navigate(`/edit-listing/${myListing.id}`)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-cream/50 hover:bg-fire/5 transition-all text-left">
                    <div className="w-9 h-9 bg-teal/10 rounded-lg flex items-center justify-center"><Edit3 className="w-4 h-4 text-teal" /></div>
                    <div><p className="text-sm font-medium">Edit Listing</p><p className="text-[10px] text-ink/50">Update photos & details</p></div>
                  </button>
                )}
                <button onClick={() => navigate('/settings')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-cream/50 hover:bg-fire/5 transition-all text-left">
                  <div className="w-9 h-9 bg-ink/5 rounded-lg flex items-center justify-center"><Settings className="w-4 h-4 text-ink/40" /></div>
                  <div><p className="text-sm font-medium">Settings</p><p className="text-[10px] text-ink/50">Account & preferences</p></div>
                </button>
              </div>
            </div>

            {/* Tip */}
            <div className="gradient-dark rounded-2xl p-5 text-white">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-fire/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-fire" />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Quick Tip</p>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Reply to applicants quickly to maintain a good response rate. Fast responses get 3x more applicants!
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-xl font-display font-medium text-center mb-2">Delete Listing?</h2>
            <p className="text-ink/60 text-sm text-center mb-6">
              This action cannot be undone. All data associated with this listing will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 btn-outline">Cancel</button>
              <button onClick={handleDeleteListing} className="flex-1 btn-fire bg-red-500 hover:bg-red-600 border-none">Delete</button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
