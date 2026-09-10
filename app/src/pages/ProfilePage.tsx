import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useStore } from '@/store/useStore';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useReviews } from '@/hooks/useReviews';
import { useMatches } from '@/hooks/useMatches';
import { useConnections } from '@/hooks/useConnections';
import { useChat } from '@/hooks/useChat';
import { useListings } from '@/hooks/useListings';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Crown, Shield, Star, Settings, Bell, Lock, HelpCircle, LogOut, SwitchCamera,
  ChevronRight, TrendingUp, MessageSquare, Heart, Eye, CheckCircle2, Linkedin, Instagram,
  FileText, ShieldCheck, Users, Sliders, Building2
} from 'lucide-react';
import TrustBadge from '@/components/TrustBadge';
import ProfileCompleteness from '@/components/ProfileCompleteness';
import StateEmpty from '@/components/StateEmpty';
import PageShell from '@/components/PageShell';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, logout, refreshProfile } = useAuth();
  const { currentRole, setCurrentRole } = useStore();
  const { setRole } = useUserProfile();
  const { reviews, getReviewsForUser } = useReviews();
  const { findMatches } = useMatches();
  const { getMyConnections } = useConnections();
  const { chatRooms, getOrCreateChatRoom } = useChat();
  const { getMyListings } = useListings();

  const [topMatchScore, setTopMatchScore] = useState<number>(0);
  const [connectsCount, setConnectsCount] = useState<number>(0);
  const [ownerListings, setOwnerListings] = useState<any[]>([]);
  const [acceptedConnections, setAcceptedConnections] = useState<{ connection: any; profile: any }[]>([]);

  // Derive the effective role from Firebase profile or Zustand store
  const effectiveRole = profile?.role || currentRole || 'seeker';

  useEffect(() => {
    if (user?.uid) {
      getReviewsForUser(user.uid);
      getMyConnections(user.uid).then(conns => {
        if (conns) setConnectsCount(conns.length);
      });
      getMyConnections(user.uid, 'accepted').then(async conns => {
        const list = [];
        for (const conn of conns) {
          const otherId = conn.fromUserId === user.uid ? conn.toUserId : conn.fromUserId;
          const snap = await getDoc(doc(db, 'users', otherId));
          if (snap.exists()) {
            list.push({ connection: conn, profile: { uid: snap.id, ...snap.data() } });
          }
        }
        setAcceptedConnections(list);
      }).catch(() => { });
      if (profile && effectiveRole === 'seeker') {
        findMatches(profile, profile.city).then(matches => {
          if (matches && matches.length > 0) {
            const top = Math.max(...matches.map(m => m.compatibilityScore || 0));
            setTopMatchScore(top);
          }
        });
      }
      if (effectiveRole === 'owner') {
        getMyListings(user.uid).then(listings => {
          setOwnerListings(listings || []);
        }).catch(() => {});
      }
    }
  }, [user?.uid, profile, effectiveRole, getMyConnections, getMyListings]);

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSwitchRole = async () => {
    const newRole = effectiveRole === 'seeker' ? 'owner' : 'seeker';
    setCurrentRole(newRole);
    if (user?.uid) {
      await setRole(user.uid, newRole);
      // BUG-4 FIX: wait for profile to update before navigating so App.tsx
      // onSnapshot sees the new role and doesn't bounce back to the old dashboard.
      await refreshProfile(user.uid);
    }
    navigate(newRole === 'seeker' ? '/dashboard' : '/owner-dashboard');
  };

  return (
    <PageShell maxWidth="max-w-4xl">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column */}
        <div className="w-full lg:w-[355px] space-y-5">
          {/* Profile Card */}
          <div className="card-nestmate overflow-hidden">
            <div className="h-24 gradient-fire relative">
              <button onClick={() => navigate('/settings')} className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur rounded-lg text-white hover:bg-white/30 transition-all" aria-label="Open settings">
                <Settings className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 pb-5">
              <div className="relative -mt-10 mb-3">
                <div className="w-20 h-20 rounded-full border-4 border-white p-0.5 bg-parchment">
                  {profile?.avatar || user?.photoURL ? (
                    <img
                      src={profile?.avatar || user?.photoURL || undefined}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-fire/10 flex items-center justify-center text-xl font-bold text-fire">
                      {(profile?.name || user?.displayName || 'G').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {profile?.isPremium && (
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-gold rounded-full flex items-center justify-center border-2 border-white">
                    <Crown className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="type-h3">{profile?.name || user?.displayName || 'Guest User'}</h2>
                <TrustBadge profile={profile} authProviders={user?.providerData?.map(p => p.providerId)} size="md" showLabel showTooltip />
              </div>
              <p className="text-sm text-ink/50 mb-3">{profile?.profession} · {profile?.city}</p>
              <div className="flex gap-2 mb-4 flex-wrap items-center">
                {profile?.workEmailVerified && <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Corporate Verified</span>}
                {profile?.isVerified && <span className="badge-teal text-[10px]"><Shield className="w-3 h-3 mr-1" />Verified Member</span>}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                {effectiveRole === 'owner' ? (
                  <>
                    <div className="bg-cream/50 rounded-lg p-2 cursor-pointer hover:bg-cream transition-colors" onClick={() => navigate('/owner-dashboard?tab=listings')}>
                      <p className="text-lg font-bold text-ink">{ownerListings.length}</p>
                      <p className="text-[10px] text-ink/50">Properties</p>
                    </div>
                    <div className="bg-cream/50 rounded-lg p-2 cursor-pointer hover:bg-cream transition-colors" onClick={() => navigate('/owner-dashboard?tab=applicants')}>
                      <p className="text-lg font-bold text-ink">{connectsCount || 0}</p>
                      <p className="text-[10px] text-ink/50">Applicants</p>
                    </div>
                    <div className="bg-cream/50 rounded-lg p-2 cursor-pointer hover:bg-cream transition-colors" onClick={() => navigate('/chat')}>
                      <p className="text-lg font-bold text-ink">{chatRooms?.length || 0}</p>
                      <p className="text-[10px] text-ink/50">Chats</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-cream/50 rounded-lg p-2">
                      <p className="text-lg font-bold text-ink">{connectsCount || profile?.connectsUsed || 0}</p>
                      <p className="text-[10px] text-ink/50">Connects</p>
                    </div>
                    <div className="bg-cream/50 rounded-lg p-2 cursor-pointer hover:bg-cream transition-colors" onClick={() => navigate('/chat')}>
                      <p className="text-lg font-bold text-ink">{chatRooms?.length || 0}</p>
                      <p className="text-[10px] text-ink/50">Chats</p>
                    </div>
                    <div className="bg-cream/50 rounded-lg p-2">
                      <p className="text-lg font-bold text-fire">{topMatchScore > 0 ? `${topMatchScore}%` : '—'}</p>
                      <p className="text-[10px] text-ink/50">Top Match</p>
                    </div>
                  </>
                )}
              </div>
              <button onClick={() => navigate('/edit-profile')} className="w-full py-2.5 border border-ink/10 rounded-xl text-sm font-medium text-ink/70 hover:bg-cream/50 transition-all cursor-pointer">
                Edit Profile
              </button>
            </div>
          </div>

          {/* Profile Completeness Meter */}
          <ProfileCompleteness profile={profile} />

          {/* Preferences / Hosting Details */}
          <div className="card-nestmate p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm">
                {effectiveRole === 'owner' ? 'Hosting Details' : 'Preferences'}
              </h4>
              <button
                onClick={() => navigate(effectiveRole === 'owner' ? '/owner-dashboard?tab=listings' : '/preferences')}
                className="text-xs text-fire font-semibold hover:underline cursor-pointer"
              >
                {effectiveRole === 'owner' ? 'Manage' : 'Edit'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {effectiveRole === 'owner' ? (
                [
                  { label: 'Role', value: 'Property Owner' },
                  { label: 'City', value: profile?.city || 'Bengaluru' },
                  { label: 'Properties', value: `${ownerListings.length} Listed` },
                  { label: 'Status', value: profile?.isVerified ? 'Verified Owner' : 'Pending Verification' },
                ].map(p => (
                  <div key={p.label} className="bg-cream/50 rounded-lg p-2.5">
                    <p className="text-[10px] text-ink/40">{p.label}</p>
                    <p className="text-sm font-medium truncate">{p.value}</p>
                  </div>
                ))
              ) : (
                [
                  { label: 'Budget', value: profile?.budget ? `₹${profile.budget.toLocaleString()}/mo` : 'Flexible' },
                  { label: 'Role', value: 'Roommate Seeker' },
                  { label: 'City', value: profile?.city || 'Bengaluru' },
                  { label: 'Move-in', value: profile?.moveInDate ? new Date(profile.moveInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Flexible' },
                ].map(p => (
                  <div key={p.label} className="bg-cream/50 rounded-lg p-2.5">
                    <p className="text-[10px] text-ink/40">{p.label}</p>
                    <p className="text-sm font-medium truncate">{p.value}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Trust & Socials */}
          {(profile?.socialLinks?.linkedin || profile?.socialLinks?.instagram || profile?.workEmailVerified) && (
            <div className="card-nestmate p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm">Trust & Socials</h4>
                <button onClick={() => navigate('/edit-profile')} className="text-xs text-fire cursor-pointer">Edit</button>
              </div>
              <div className="space-y-3">
                {profile.socialLinks?.linkedin && (
                  <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2.5 bg-[#0077B5]/10 rounded-xl text-[#0077B5] hover:bg-[#0077B5]/20 transition-colors">
                    <Linkedin className="w-4 h-4" />
                    <span className="text-sm font-medium">LinkedIn Profile</span>
                  </a>
                )}
                {profile.socialLinks?.instagram && (
                  <a href={profile.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2.5 bg-[#E1306C]/10 rounded-xl text-[#E1306C] hover:bg-[#E1306C]/20 transition-colors">
                    <Instagram className="w-4 h-4" />
                    <span className="text-sm font-medium">Instagram Profile</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Account Menu */}
          <div className="card-nestmate p-3">
            <button onClick={handleSwitchRole} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-cream/50 transition-all text-left cursor-pointer">
              <SwitchCamera className="w-4 h-4 text-ink/60" />
              <span className="text-sm flex-1">Switch to {effectiveRole === 'seeker' ? 'Owner' : 'Seeker'} Mode</span>
              <ChevronRight className="w-4 h-4 text-ink/30" />
            </button>
            {effectiveRole === 'seeker' ? (
              <button onClick={() => navigate('/preferences')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-cream/50 transition-all text-left cursor-pointer">
                <Sliders className="w-4 h-4 text-ink/60" />
                <span className="text-sm flex-1">Roommate Preferences</span>
                <ChevronRight className="w-4 h-4 text-ink/30" />
              </button>
            ) : (
              <button onClick={() => navigate('/owner-dashboard?tab=listings')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-cream/50 transition-all text-left cursor-pointer">
                <Building2 className="w-4 h-4 text-ink/60" />
                <span className="text-sm flex-1">My Properties & Listings</span>
                <ChevronRight className="w-4 h-4 text-ink/30" />
              </button>
            )}
            <button onClick={() => navigate('/safety')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-cream/50 transition-all text-left cursor-pointer">
              <ShieldCheck className="w-4 h-4 text-ink/60" />
              <span className="text-sm flex-1">Safety & Verification Center</span>
              <ChevronRight className="w-4 h-4 text-ink/30" />
            </button>
            <button onClick={() => navigate('/settings')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-cream/50 transition-all text-left cursor-pointer">
              <Lock className="w-4 h-4 text-ink/60" />
              <span className="text-sm flex-1">Privacy Settings</span>
              <ChevronRight className="w-4 h-4 text-ink/30" />
            </button>
            <button onClick={() => navigate('/notifications')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-cream/50 transition-all text-left cursor-pointer">
              <Bell className="w-4 h-4 text-ink/60" />
              <span className="text-sm flex-1">Notifications</span>
              <ChevronRight className="w-4 h-4 text-ink/30" />
            </button>
            <button onClick={() => navigate('/help')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-cream/50 transition-all text-left cursor-pointer">
              <HelpCircle className="w-4 h-4 text-ink/60" />
              <span className="text-sm flex-1">Help & Support</span>
              <ChevronRight className="w-4 h-4 text-ink/30" />
            </button>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 transition-all text-left text-red-500 cursor-pointer">
              <LogOut className="w-4 h-4" />
              <span className="text-sm flex-1">Logout</span>
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex-1 space-y-5">
          {/* Trust & Verification Banner */}
          {!profile?.isVerified ? (
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 relative overflow-hidden text-white shadow-sm border border-slate-700/50">
              <div className="absolute top-0 right-0 w-36 h-36 bg-brand-orange/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <div className="relative">
                <span className="bg-brand-orange/20 text-brand-orange text-[10px] font-bold px-2.5 py-1 rounded-full mb-3 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Trust & Verification
                </span>
                <h3 className="type-h3 text-white mb-2">Fast-Track Your Trust Score</h3>
                <p className="text-sm text-slate-300 mb-4 max-w-md leading-relaxed">
                  Verified members get 3x higher response rates, instant applicant contact reveals, and trusted community standing.
                </p>
                <button
                  onClick={() => navigate(effectiveRole === 'owner' ? '/owner-dashboard?tab=listings' : '/trust')}
                  className="bg-brand-orange text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-brand-orange/90 transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {effectiveRole === 'owner' ? 'Verify Property & ID' : 'Get Verified Badge'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-950/40 rounded-2xl p-6 relative overflow-hidden text-white shadow-sm border border-emerald-800/40">
              <div className="flex items-center gap-2 mb-2 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="font-bold text-base">Verified Community Member</h3>
              </div>
              <p className="text-sm text-slate-300 max-w-md">
                Your identity is verified. You have maximum search visibility and full access to verified chats.
              </p>
            </div>
          )}

          {/* My Connections / Friends */}
          <div className="card-nestmate p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-base flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-teal" /> My Connections ({acceptedConnections.length})
              </h4>
              {acceptedConnections.length > 0 && (
                <button onClick={() => navigate('/chat')} className="text-xs text-fire font-semibold hover:underline">View All Chats</button>
              )}
            </div>
            {acceptedConnections.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {acceptedConnections.map(conn => {
                  const p = conn.profile;
                  return (
                    <div key={conn.connection.id} className="p-3 bg-cream/40 rounded-xl border border-border flex items-center gap-3">
                      {p.avatar ? (
                        <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full border border-border object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full border border-border bg-fire/10 flex items-center justify-center text-sm font-bold text-fire">{(p.name || 'U').charAt(0).toUpperCase()}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{p.name}</p>
                        <p className="text-xs text-ink/50 truncate">{p.profession || 'Member'} · {p.city}</p>
                      </div>
                      <button
                        onClick={async () => {
                          const targetId = p.uid || conn.connection.fromUserId;
                          const roomId = await getOrCreateChatRoom(user!.uid, targetId);
                          navigate(`/chat/${roomId}`);
                        }}
                        className="p-2 bg-fire text-white rounded-lg hover:bg-fire-dark transition-all"
                        title="Message"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <StateEmpty
                compact
                icon={Users}
                title="No connections yet"
                description="Connect with flatmates or property owners on NestMate"
              />
            )}
          </div>

          {/* Activity Feed */}
          <div className="card-nestmate p-5">
            <h4 className="font-semibold mb-4">Recent Activity</h4>
            <StateEmpty
              compact
              icon={TrendingUp}
              title="No activity yet"
              description="Your activity will appear here as you use NestMate"
            />
          </div>

          {/* Reviews Section */}
          <div className="card-nestmate p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Your Reviews</h4>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-gold text-gold" />
                <span className="text-sm font-bold">{averageRating}</span>
                <span className="text-xs text-ink/40">({reviews.length} reviews)</span>
              </div>
            </div>

            {reviews.length > 0 ? (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {reviews.map(review => (
                  <div key={review.id} className="bg-cream/30 p-4 rounded-xl border border-border">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {review.reviewerAvatar ? (
                          <img
                            src={review.reviewerAvatar}
                            alt={review.reviewerName}
                            className="w-8 h-8 rounded-full bg-cream border border-border object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-cream border border-border flex items-center justify-center text-xs font-bold text-ink/60">
                            {(review.reviewerName || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold">{review.reviewerName}</p>
                          <p className="text-[10px] text-ink/40">
                            {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : 'Just now'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`w-3 h-3 ${star <= review.rating ? 'fill-gold text-gold' : 'text-border'}`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.text && <p className="text-sm text-ink/80 mt-2">{review.text}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <StateEmpty
                compact
                icon={Star}
                title="No reviews yet"
                description="Reviews from roommates will show up here"
              />
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
