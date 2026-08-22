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
  TrendingUp, MessageCircle, Edit3, Eye, Users, Settings, MapPin,
  Shield, Check, X, Pause, Play, Trash2, AlertTriangle, CheckCircle2, Plus,
  FileText, ArrowRight, User, Mail, Star, ChevronRight, Lightbulb
} from 'lucide-react';
import StateLoading from '@/components/StateLoading';
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
          applicants.push({ connection: conn, profile: { uid: snap.id, ...snap.data() } as UserProfile });
        }
      }
      setPendingApplicants(applicants);
    });
    return () => unsub();
  }, [user?.uid]);

  // Load accepted connections
  useEffect(() => {
    if (!user?.uid) return;
    getMyConnections(user.uid, 'accepted').then(async conns => {
      const list: PendingApplicant[] = [];
      for (const conn of conns) {
        const otherId = conn.fromUserId === user.uid ? conn.toUserId : conn.fromUserId;
        const snap = await getDoc(doc(db, 'users', otherId));
        if (snap.exists()) {
          list.push({ connection: conn, profile: { uid: snap.id, ...snap.data() } as UserProfile });
        }
      }
      setAcceptedConnections(list);
    }).catch(() => {});
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

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const displayWeeklyViews = daysOfWeek.map(dayName => {
    const found = weeklyViews.find(v => v.day.toLowerCase().startsWith(dayName.toLowerCase().slice(0, 3)));
    return { day: dayName, views: found ? found.views : 0 };
  });

  return (
    <PageShell maxWidth="max-w-[1600px]" className="bg-brand-bg">

      {/* ========================================================================= */}
      {/* 1. DESKTOP VIEW (Visible on lg screens and up: hidden lg:flex) */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex flex-row gap-8 w-full">
        {/* BEGIN: Left Column (Desktop) */}
        <div className="flex-grow flex flex-col gap-6 max-w-5xl">
          {/* Listing Selector Bar */}
          {allListings.length > 0 && (
            <div className="flex flex-row items-center justify-between gap-4 bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Select Property</label>
                  {hasDuplicateProperties && (
                    <button
                      onClick={handleCleanDuplicates}
                      className="text-xs font-bold text-red-500 hover:text-red-600 underline transition-colors"
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
                          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                            isSelected
                              ? 'border-brand-orange bg-brand-orange text-white shadow-sm font-bold pr-8'
                              : 'border-slate-200 bg-white hover:border-brand-orange/40 text-slate-700 pr-8'
                          }`}
                        >
                          <span>{l.title ? (l.title.length > 22 ? `${l.title.substring(0, 22)}...` : l.title) : `${l.locality} (${l.flatType})`}</span>
                          {isDuplicateName && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                              #{index + 1}
                            </span>
                          )}
                        </button>
                        {allListings.length > 1 && (
                          <button
                            onClick={(e) => handleDeleteSpecificListing(e, l.id)}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center text-[10px] transition-all ${
                              isSelected ? 'bg-white/30 text-white hover:bg-white/50' : 'bg-slate-200 text-slate-600 hover:bg-red-500 hover:text-white'
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

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-brand-teal font-medium bg-brand-tealLight/50 px-3 py-1.5 rounded-full border border-brand-teal/20">
                  Unlimited Listings (Free)
                </span>
                <button
                  onClick={() => navigate('/onboarding/owner')}
                  className="px-4 py-2.5 bg-brand-orange text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-all flex items-center gap-1.5 shadow-sm shadow-orange-500/20"
                >
                  <Plus className="w-4 h-4" /> Add Property
                </button>
              </div>
            </div>
          )}

          {/* Desktop Hero Banner */}
          {myListing ? (
            <div className="relative rounded-3xl overflow-hidden shadow-sm border border-slate-100 group">
              <div className="absolute inset-0">
                {myListing.images && myListing.images.length > 0 ? (
                  <img src={myListing.images[0]} alt="Listing cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-brand-navy" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/80 to-brand-navy/30" />
              </div>
              
              <div className="relative p-8 pt-20 text-white flex flex-col justify-end min-h-[340px]">
                <div className="absolute top-5 right-5 flex flex-wrap justify-end gap-2 z-10">
                  <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg backdrop-blur-md ${
                    myListing.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    <span className={`w-2 h-2 rounded-full animate-pulse ${myListing.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    {myListing.status === 'active' ? 'LIVE' : 'PAUSED'}
                  </span>
                  <button onClick={handleToggleStatus} className="p-2.5 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-all border border-white/10 text-white" title={myListing.status === 'active' ? 'Pause Listing' : 'Resume Listing'}>
                    {myListing.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button onClick={() => navigate(`/edit-listing/${myListing.id}`)} className="p-2.5 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-all border border-white/10 text-white" title="Edit Listing">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setShowDeleteConfirm(true)} className="p-2.5 bg-red-500/40 backdrop-blur-md rounded-full hover:bg-red-500/60 transition-all border border-red-500/50 text-white" title="Delete Listing">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mb-6">
                  <h2 className="text-4xl font-serif font-bold mb-2 leading-tight drop-shadow-md">{myListing.title}</h2>
                  <p className="text-base text-slate-200 flex items-center gap-1.5 drop-shadow">
                    <MapPin className="w-4 h-4 text-brand-orange shrink-0" /> {myListing.locality}, {myListing.city}
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm">
                    <p className="text-2xl font-bold">{pendingApplicants.length}</p>
                    <p className="text-[11px] text-slate-300 font-medium uppercase tracking-wider">Applicants</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm">
                    <p className="text-2xl font-bold">{myListing.views || 0}</p>
                    <p className="text-[11px] text-slate-300 font-medium uppercase tracking-wider">Views</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm">
                    <p className="text-2xl font-bold">{chatCount}</p>
                    <p className="text-[11px] text-slate-300 font-medium uppercase tracking-wider">Chats</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm">
                    <p className="text-2xl font-bold">{totalWeeklyViews}</p>
                    <p className="text-[11px] text-slate-300 font-medium uppercase tracking-wider">This Week</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-sm">
                  <div className="flex flex-col">
                    <p className="text-[10px] text-slate-300 font-medium uppercase tracking-wider mb-0.5">Rent</p>
                    <p className="font-bold text-xl text-white truncate">₹{myListing.totalRent?.toLocaleString() || (myListing as any).monthlyRent?.toLocaleString() || '—'}</p>
                  </div>
                  <div className="flex flex-col border-l border-white/20 pl-3">
                    <p className="text-[10px] text-slate-300 font-medium uppercase tracking-wider mb-0.5">Deposit</p>
                    <p className="font-bold text-xl text-brand-orange truncate">₹{myListing.deposit?.toLocaleString() || '—'}</p>
                  </div>
                  <div className="flex flex-col border-l border-white/20 pl-3">
                    <p className="text-[10px] text-slate-300 font-medium uppercase tracking-wider mb-0.5">Type</p>
                    <p className="font-bold text-xl text-brand-tealLight truncate">{myListing.flatType}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <section
              className="bg-brand-navy rounded-3xl relative overflow-hidden flex flex-col items-center justify-center text-center p-12 min-h-[360px] shadow-sm text-white"
              style={{
                backgroundImage: 'linear-gradient(rgba(26, 35, 58, 0.7), rgba(26, 35, 58, 0.7)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuBsQUA9QfqJ5_EhVOmV_3MNyJsHJRxcXz53agqOSoREbJWJuddao9qhrnUWYR2sni8gQnLmQ2UbjPfU9NxESk4ibTRDj5jC9XX-otGv5dn2J9_6NdY3lxiqor8wLlNlU5nXTVq3UE3V97LuOB2o7dTgz45GO7B310Rg5RRpj44ygnTM-tUWb-TLPwUL_lI52YL2oCv3wZI7XNjYknK9fdFCCu4Dx1-krJG-Kruxv5L-EHqI5XCC15bplchWcfEiMS7JeA")',
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
              }}
            >
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-10 right-20 w-32 h-32 rounded-full border-4 border-white/20"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[150%] bg-gradient-to-tr from-white/5 to-transparent rounded-full blur-3xl"></div>
              </div>
              <div className="relative z-10 flex flex-row items-center gap-8 w-full max-w-5xl">
                <div className="w-full flex flex-col text-center items-center justify-center">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6 border border-white/20">
                    <i className="fa-regular fa-file-lines text-xl text-brand-orange"></i>
                  </div>
                  <h1 className="text-4xl text-white font-bold mb-4 tracking-tight font-serif">No listing yet</h1>
                  <p className="text-slate-300 mb-8 text-base leading-relaxed max-w-md mx-auto text-center">
                    Create your first listing to start finding great roommates and manage your property with ease.
                  </p>
                  <button
                    onClick={() => navigate('/onboarding/owner')}
                    className="bg-brand-orange hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-semibold flex items-center gap-3 transition-all transform hover:scale-[1.02] shadow-lg shadow-orange-500/30 text-base"
                  >
                    Create Listing
                    <i className="fa-solid fa-arrow-right text-sm"></i>
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Pending Requests (Desktop) */}
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col justify-between min-h-[280px] relative">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 text-slate-900 font-serif font-bold text-xl">
                <i className="fa-regular fa-user"></i>
                Pending Requests ({pendingApplicants.length})
              </div>
              <button onClick={() => navigate('/notifications')} className="text-brand-orange font-medium hover:underline text-sm">View all</button>
            </div>

            {pendingApplicants.length > 0 ? (
              <div className="w-full space-y-4">
                {pendingApplicants.map(applicant => {
                  const p = applicant.profile;
                  const isHighlighted = highlightedRequestId === applicant.connection.id;
                  return (
                    <div
                      key={applicant.connection.id}
                      id={`request-${applicant.connection.id}`}
                      className={`flex flex-row items-center justify-between gap-4 p-5 rounded-2xl border transition-all ${
                        isHighlighted
                          ? 'bg-brand-orangeLight/30 border-brand-orange/40 shadow-sm'
                          : 'bg-slate-50/70 border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <img src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} alt={p.name} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm shrink-0" />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-base">{p.name}</h4>
                            {isHighlighted && (
                              <span className="text-[10px] font-bold bg-brand-orange text-white px-2 py-0.5 rounded-full">New!</span>
                            )}
                            {p.workEmailVerified && <CheckCircle2 className="w-4 h-4 text-blue-500" title="Corporate Verified" />}
                            {(p.verificationLevel ?? 0) > 0 && <Shield className="w-4 h-4 text-brand-teal" title="ID Verified" />}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{p.profession || 'Roommate Seeker'} · Budget: ₹{p.budget?.toLocaleString() || 'Flexible'}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Move-in: {p.moveInDate || 'Flexible'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <button
                          onClick={() => navigate(`/match/${p.uid || applicant.connection.fromUserId}`)}
                          className="p-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition-all text-xs font-semibold flex items-center gap-1"
                          title="View Profile"
                        >
                          <User className="w-4 h-4" /> Profile
                        </button>
                        <button onClick={() => handleReject(applicant)} className="p-2.5 border border-red-200 rounded-xl text-red-500 hover:bg-red-50 transition-all" title="Reject">
                          <X className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleAccept(applicant)} className="px-4 py-2.5 bg-brand-orange text-white rounded-xl font-semibold hover:bg-orange-600 transition-all text-xs flex items-center gap-1.5 shadow-sm shadow-orange-500/20" title="Accept & Chat">
                          <Check className="w-4 h-4" /> Accept
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center text-center my-auto py-6">
                <div className="w-20 h-20 bg-brand-orangeLight/50 rounded-full flex items-center justify-center mb-5 relative">
                  <i className="fa-regular fa-envelope text-3xl text-brand-orange"></i>
                  <i className="fa-solid fa-star text-[8px] text-brand-orange/40 absolute top-2 right-2"></i>
                  <i className="fa-solid fa-star text-[10px] text-brand-orange/40 absolute bottom-4 -left-2"></i>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2 font-serif">No pending requests</h2>
                <p className="text-slate-500 text-sm">
                  {myListing ? 'Your listing is live. Roommate requests will appear here.' : 'Create a listing to start receiving roommate requests.'}
                </p>
              </div>
            )}
          </section>

          {/* My Connections (Desktop) */}
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col justify-between min-h-[280px] relative">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 text-slate-900 font-serif font-bold text-xl">
                <i className="fa-regular fa-user"></i>
                My Connections ({acceptedConnections.length})
              </div>
              <button onClick={() => navigate('/chat')} className="text-brand-teal font-medium hover:underline text-sm">View all</button>
            </div>

            {acceptedConnections.length > 0 ? (
              <div className="w-full space-y-4">
                {acceptedConnections.map(conn => {
                  const p = conn.profile;
                  return (
                    <div
                      key={conn.connection.id}
                      className="flex flex-row items-center justify-between gap-4 p-5 rounded-2xl border border-brand-tealLight bg-brand-tealLight/20 transition-all"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <img src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} alt={p.name} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-base">{p.name}</h4>
                            <span className="text-[10px] font-bold bg-brand-teal text-white px-2 py-0.5 rounded-full">Connected ✓</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{p.profession || 'Roommate'} · {p.city || 'Chennai'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <button
                          onClick={() => navigate(`/match/${p.uid || conn.connection.fromUserId}`)}
                          className="px-3.5 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all flex items-center gap-1.5"
                        >
                          <User className="w-4 h-4" /> Profile
                        </button>
                        <button
                          onClick={async () => {
                            if (!user?.uid) return;
                            const targetId = p.uid || conn.connection.fromUserId;
                            const roomId = await getOrCreateChatRoom(user.uid, targetId);
                            navigate(`/chat/${roomId}`);
                          }}
                          className="px-4 py-2 bg-brand-orange text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition-all flex items-center gap-1.5 shadow-sm shadow-orange-500/20"
                        >
                          <MessageCircle className="w-4 h-4" /> Message
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center text-center my-auto py-6">
                <div className="w-20 h-20 bg-brand-tealLight/50 rounded-full flex items-center justify-center mb-5 relative">
                  <i className="fa-solid fa-user-group text-3xl text-brand-teal"></i>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2 font-serif">No accepted connections yet</h2>
                <p className="text-slate-500 text-sm">Accept incoming requests to connect with your future roommates.</p>
              </div>
            )}
          </section>
        </div>
        {/* END: Left Column (Desktop) */}

        {/* BEGIN: Right Sidebar (Desktop) */}
        <div className="w-[380px] shrink-0 flex flex-col gap-6">
          {/* Weekly Views Analytics (Desktop) */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-slate-900 text-lg font-serif">Weekly Views</h3>
              <span className="text-slate-500 text-sm">{totalWeeklyViews} total</span>
            </div>

            {totalWeeklyViews > 0 ? (
              <div className="h-32 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={displayWeeklyViews} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                      formatter={(v: number) => [v, 'Views']}
                    />
                    <Bar dataKey="views" radius={[6, 6, 0, 0]}>
                      {displayWeeklyViews.map((_, i) => (
                        <Cell key={i} fill={i === displayWeeklyViews.length - 1 ? '#f05a28' : '#ffebd9'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center mb-8">
                <div className="relative mb-4">
                  <div className="w-16 h-16 bg-brand-orangeLight/50 rounded-2xl flex items-center justify-center">
                    <i className="fa-solid fa-arrow-trend-up text-2xl text-brand-orange"></i>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center border border-slate-50 text-brand-orange">
                    <i className="fa-solid fa-eye text-sm"></i>
                  </div>
                </div>
                <h4 className="font-bold text-slate-900 text-lg mb-1 font-serif">No views yet</h4>
                <p className="text-slate-500 text-sm">Create a listing to see analytics and insights.</p>
              </div>
            )}

            <div className="flex justify-between items-end border-t border-slate-100 pt-4 px-2">
              {displayWeeklyViews.map(d => (
                <div key={d.day} className="flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-400">{d.day}</span>
                  <span className="text-sm text-slate-600 font-medium">{d.views}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Actions (Desktop) */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 text-lg mb-4 font-serif">Quick Actions</h3>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/chat')}
                className="flex items-center p-3 rounded-2xl hover:bg-slate-50 transition group border border-slate-50 w-full text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mr-4 group-hover:bg-orange-100 transition shrink-0">
                  <i className="fa-regular fa-comment text-brand-orange text-lg"></i>
                </div>
                <div className="flex-grow">
                  <h4 className="font-bold text-slate-900 text-sm">Messages</h4>
                  <p className="text-slate-500 text-xs">View all conversations</p>
                </div>
                {chatCount > 0 && (
                  <span className="bg-brand-orange text-white text-xs font-bold px-2 py-0.5 rounded-full mr-2">
                    {chatCount}
                  </span>
                )}
                <i className="fa-solid fa-chevron-right text-slate-400 text-sm group-hover:translate-x-0.5 transition-transform"></i>
              </button>

              {myListing && (
                <button
                  onClick={() => navigate(`/edit-listing/${myListing.id}`)}
                  className="flex items-center p-3 rounded-2xl hover:bg-slate-50 transition group border border-slate-50 w-full text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mr-4 group-hover:bg-teal-100 transition shrink-0">
                    <i className="fa-regular fa-pen-to-square text-brand-teal text-lg"></i>
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-bold text-slate-900 text-sm">Edit Listing</h4>
                    <p className="text-slate-500 text-xs">Update photos &amp; details</p>
                  </div>
                  <i className="fa-solid fa-chevron-right text-slate-400 text-sm group-hover:translate-x-0.5 transition-transform"></i>
                </button>
              )}

              <button
                onClick={() => navigate('/settings')}
                className="flex items-center p-3 rounded-2xl hover:bg-slate-50 transition group border border-slate-50 w-full text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mr-4 group-hover:bg-slate-200 transition shrink-0">
                  <i className="fa-solid fa-gear text-slate-600 text-lg"></i>
                </div>
                <div className="flex-grow">
                  <h4 className="font-bold text-slate-900 text-sm">Settings</h4>
                  <p className="text-slate-500 text-xs">Account &amp; preferences</p>
                </div>
                <i className="fa-solid fa-chevron-right text-slate-400 text-sm group-hover:translate-x-0.5 transition-transform"></i>
              </button>
            </div>
          </section>

          {/* Quick Tip (Desktop) */}
          <section className="bg-brand-navy rounded-3xl p-6 shadow-sm border border-slate-100 text-white">
            <div className="flex items-center gap-2 mb-3">
              <i className="fa-regular fa-lightbulb text-brand-orange text-lg"></i>
              <h3 className="font-bold text-lg font-serif">Quick Tip</h3>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Replying to applicants quickly improves your listing's visibility and helps you find the right roommate faster.
            </p>
          </section>
        </div>
        {/* END: Right Sidebar (Desktop) */}
      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE VIEW (Visible ONLY on mobile/tablet screens: lg:hidden) */}
      {/* ========================================================================= */}
      <div className="flex lg:hidden flex-col gap-4 w-full">
        {/* Listing Selector Bar (Mobile) */}
        {allListings.length > 0 && (
          <div className="flex flex-col items-start justify-between gap-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="w-full">
              <div className="flex items-center justify-between gap-2 mb-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Select Property</label>
                {hasDuplicateProperties && (
                  <button
                    onClick={handleCleanDuplicates}
                    className="text-xs font-bold text-red-500 hover:text-red-600 underline transition-colors"
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
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'border-[#ff5a36] bg-[#ff5a36] text-white shadow-sm font-bold pr-7'
                            : 'border-gray-200 bg-white hover:border-[#ff5a36]/40 text-gray-700 pr-7'
                        }`}
                      >
                        <span>{l.title ? (l.title.length > 18 ? `${l.title.substring(0, 18)}...` : l.title) : `${l.locality} (${l.flatType})`}</span>
                        {isDuplicateName && (
                          <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                            #{index + 1}
                          </span>
                        )}
                      </button>
                      {allListings.length > 1 && (
                        <button
                          onClick={(e) => handleDeleteSpecificListing(e, l.id)}
                          className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                            isSelected ? 'bg-white/30 text-white' : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between w-full pt-2 border-t border-gray-100">
              <span className="text-[11px] text-teal-600 font-medium bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
                Free Unlimited
              </span>
              <button
                onClick={() => navigate('/onboarding/owner')}
                className="px-3.5 py-1.5 bg-[#ff5a36] text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-all flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Add Property
              </button>
            </div>
          </div>
        )}

        {/* Hero Section (Mobile) */}
        {myListing ? (
          <div className="relative rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-[#161c2d]">
            <div className="absolute inset-0">
              {myListing.images && myListing.images.length > 0 ? (
                <img src={myListing.images[0]} alt="Listing cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#161c2d]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#161c2d] via-[#161c2d]/85 to-[#161c2d]/40" />
            </div>
            
            <div className="relative p-5 pt-14 text-white flex flex-col justify-end min-h-[300px]">
              <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-md backdrop-blur-md ${
                  myListing.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${myListing.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  {myListing.status === 'active' ? 'LIVE' : 'PAUSED'}
                </span>
                <button onClick={handleToggleStatus} className="p-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white">
                  {myListing.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => navigate(`/edit-listing/${myListing.id}`)} className="p-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mb-4">
                <h2 className="text-2xl font-serif font-bold mb-1 leading-tight drop-shadow">{myListing.title}</h2>
                <p className="text-xs text-gray-200 flex items-center gap-1 drop-shadow">
                  <MapPin className="w-3.5 h-3.5 text-[#ff5a36] shrink-0" /> {myListing.locality}, {myListing.city}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold">{pendingApplicants.length}</p>
                  <p className="text-[9px] text-gray-300 font-medium uppercase">Requests</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold">{myListing.views || 0}</p>
                  <p className="text-[9px] text-gray-300 font-medium uppercase">Views</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold">{chatCount}</p>
                  <p className="text-[9px] text-gray-300 font-medium uppercase">Chats</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold">{totalWeeklyViews}</p>
                  <p className="text-[9px] text-gray-300 font-medium uppercase">Week</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <section className="relative bg-[#161c2d] rounded-2xl p-6 text-white overflow-hidden shadow-sm">
            <div className="relative z-10 w-full">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                <svg fill="none" height="20" stroke="#ffb020" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </div>
              <h1 className="text-2xl font-serif font-bold mb-2">No listing yet</h1>
              <p className="text-gray-300 text-sm mb-6 leading-relaxed">Create your first listing to start finding great roommates.</p>
              <button
                onClick={() => navigate('/onboarding/owner')}
                className="bg-[#ff5a36] text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-orange-600 transition-colors"
              >
                Create Listing
                <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </section>
        )}

        {/* Pending Requests Card (Mobile) */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#ffe5df] rounded-xl flex items-center justify-center text-[#ff5a36]">
                <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h2 className="font-serif font-bold text-lg text-[#1a1f36]">Pending Requests ({pendingApplicants.length})</h2>
            </div>
            <button
              onClick={() => navigate('/notifications')}
              className="text-[#ff5a36] text-sm font-medium flex items-center gap-1 hover:underline"
            >
              View all
              <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="14" xmlns="http://www.w3.org/2000/svg">
                <path d="m9 18 6-6-6-6"></path>
              </svg>
            </button>
          </div>

          {pendingApplicants.length > 0 ? (
            <div className="w-full space-y-3">
              {pendingApplicants.map(applicant => {
                const p = applicant.profile;
                const isHighlighted = highlightedRequestId === applicant.connection.id;
                return (
                  <div
                    key={applicant.connection.id}
                    id={`request-${applicant.connection.id}`}
                    className={`flex flex-col gap-3 p-3.5 rounded-xl border transition-all ${
                      isHighlighted
                        ? 'bg-[#ffe5df]/30 border-[#ff5a36]/40 shadow-sm'
                        : 'bg-gray-50/70 border-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} alt={p.name} className="w-11 h-11 rounded-full object-cover border border-white shadow-sm shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-[#1a1f36] text-sm truncate">{p.name}</h4>
                          {p.workEmailVerified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" title="Corporate Verified" />}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{p.profession || 'Roommate Seeker'} · ₹{p.budget?.toLocaleString() || 'Flex'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end">
                      <button
                        onClick={() => navigate(`/match/${p.uid || applicant.connection.fromUserId}`)}
                        className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-600 text-xs font-semibold"
                      >
                        Profile
                      </button>
                      <button onClick={() => handleReject(applicant)} className="p-1.5 border border-red-200 rounded-lg text-red-500">
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleAccept(applicant)} className="px-3 py-1.5 bg-[#ff5a36] text-white rounded-lg font-semibold text-xs flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Accept
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-20 h-20 bg-[#ffe5df]/50 rounded-full flex items-center justify-center mb-4 relative">
                <svg className="absolute -top-2 right-0 text-[#ff5a36]/40 w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path>
                </svg>
                <svg className="absolute top-4 -left-4 text-[#ff5a36]/20 w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path>
                </svg>
                <svg fill="none" height="32" stroke="#ff5a36" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg">
                  <rect height="16" rx="2" width="20" x="2" y="4"></rect>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </svg>
              </div>
              <h3 className="font-serif font-bold text-[#1a1f36] mb-1">No pending requests</h3>
              <p className="text-sm text-gray-500">Create a listing to start receiving roommate requests.</p>
            </div>
          )}
        </section>

        {/* My Connections Card (Mobile) */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h2 className="font-serif font-bold text-lg text-[#1a1f36]">My Connections ({acceptedConnections.length})</h2>
            </div>
            <button
              onClick={() => navigate('/chat')}
              className="text-green-600 text-sm font-medium flex items-center gap-1 hover:underline"
            >
              View all
              <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="14" xmlns="http://www.w3.org/2000/svg">
                <path d="m9 18 6-6-6-6"></path>
              </svg>
            </button>
          </div>

          {acceptedConnections.length > 0 ? (
            <div className="w-full space-y-3">
              {acceptedConnections.map(conn => {
                const p = conn.profile;
                return (
                  <div
                    key={conn.connection.id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-teal-100 bg-teal-50/30"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} alt={p.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                      <div className="min-w-0">
                        <h4 className="font-bold text-[#1a1f36] text-xs truncate">{p.name}</h4>
                        <p className="text-[11px] text-gray-500 truncate">{p.profession || 'Roommate'}</p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (!user?.uid) return;
                        const targetId = p.uid || conn.connection.fromUserId;
                        const roomId = await getOrCreateChatRoom(user.uid, targetId);
                        navigate(`/chat/${roomId}`);
                      }}
                      className="px-3 py-1.5 bg-[#ff5a36] text-white rounded-lg text-xs font-bold shrink-0"
                    >
                      Message
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4 relative">
                <svg className="absolute -top-2 right-0 text-green-200 w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path>
                </svg>
                <svg className="absolute top-4 -left-4 text-green-100 w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path>
                </svg>
                <svg fill="none" height="32" stroke="#059669" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3 className="font-serif font-bold text-[#1a1f36] mb-1">No accepted connections yet</h3>
              <p className="text-sm text-gray-500">Accept incoming requests to connect.</p>
            </div>
          )}
        </section>

        {/* Weekly Views Analytics Card (Mobile) */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                  <rect height="18" rx="2" width="18" x="3" y="3"></rect>
                  <path d="M7 15v-4"></path>
                  <path d="M12 15v-6"></path>
                  <path d="M17 15v-2"></path>
                </svg>
              </div>
              <h2 className="font-serif font-bold text-lg text-[#1a1f36]">Weekly Views</h2>
            </div>
            <span className="text-sm text-gray-500">{totalWeeklyViews} total</span>
          </div>

          <p className="text-sm text-center text-gray-500 mb-6">Create a listing to see analytics and insights.</p>

          <div className="flex justify-between items-end border-t border-gray-50 pt-4 px-2">
            {displayWeeklyViews.map((d, index) => (
              <div key={d.day} className="contents">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs text-gray-500">{d.day}</span>
                  <span className="text-sm font-medium text-[#1a1f36]">{d.views}</span>
                </div>
                {index < displayWeeklyViews.length - 1 && (
                  <div className="w-px h-6 bg-gray-200"></div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions List (Mobile) */}
        <section>
          <h2 className="font-serif font-bold text-lg text-[#1a1f36] mb-3 px-1">Quick Actions</h2>
          <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex flex-col gap-1">
            <button
              onClick={() => navigate('/chat')}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors w-full text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#ffe5df] rounded-xl flex items-center justify-center text-[#ff5a36] shrink-0">
                  <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                    <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-[#1a1f36] text-[15px]">Messages</h3>
                  <p className="text-xs text-gray-500 mt-0.5">View all conversations</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {chatCount > 0 && (
                  <span className="bg-[#ff5a36] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {chatCount}
                  </span>
                )}
                <svg className="text-gray-400" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
                  <path d="m9 18 6-6-6-6"></path>
                </svg>
              </div>
            </button>

            {myListing && (
              <>
                <div className="h-px bg-gray-100 mx-4"></div>
                <button
                  onClick={() => navigate(`/edit-listing/${myListing.id}`)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors w-full text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 shrink-0">
                      <Edit3 className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1a1f36] text-[15px]">Edit Listing</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Update photos &amp; details</p>
                    </div>
                  </div>
                  <svg className="text-gray-400" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
                    <path d="m9 18 6-6-6-6"></path>
                  </svg>
                </button>
              </>
            )}

            <div className="h-px bg-gray-100 mx-4"></div>

            <button
              onClick={() => navigate('/settings')}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors w-full text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 shrink-0">
                  <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-[#1a1f36] text-[15px]">Settings</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Account &amp; preferences</p>
                </div>
              </div>
              <svg className="text-gray-400" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
                <path d="m9 18 6-6-6-6"></path>
              </svg>
            </button>
          </div>
        </section>

        {/* Quick Tip Banner (Mobile) */}
        <section className="bg-[#161c2d] rounded-2xl p-5 text-white flex items-center justify-between overflow-hidden relative shadow-md">
          <div className="relative z-10 w-full">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <svg fill="none" height="16" stroke="#ff5a36" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </div>
              <h3 className="font-serif font-bold text-lg">Quick Tip</h3>
            </div>
            <p className="text-[13px] text-gray-300 leading-tight mb-2">Reply to applicants quickly to maintain a good response rate.</p>
            <p className="text-[13px] font-semibold text-white">Fast responses get 3x more applicants!</p>
          </div>
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-xl border border-slate-100">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-xl font-serif font-bold text-center mb-2 text-slate-900">Delete Listing?</h2>
            <p className="text-slate-500 text-sm text-center mb-6">
              This action cannot be undone. All data associated with this listing will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all text-sm">
                Cancel
              </button>
              <button onClick={handleDeleteListing} className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-all text-sm shadow-sm shadow-red-500/20">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
