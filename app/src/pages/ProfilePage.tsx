import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useStore } from '@/store/useStore';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useReviews } from '@/hooks/useReviews';
import { useMatches } from '@/hooks/useMatches';
import { useConnections } from '@/hooks/useConnections';
import { useChat } from '@/hooks/useChat';
import { Crown, Shield, Star, Settings, Bell, Lock, HelpCircle, LogOut, SwitchCamera, ChevronRight, TrendingUp, MessageSquare, Heart, Eye, CheckCircle2, Linkedin, Instagram, FileText, ShieldCheck } from 'lucide-react';
import TrustBadge from '@/components/TrustBadge';
import ProfileCompleteness from '@/components/ProfileCompleteness';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const { currentRole, setCurrentRole } = useStore();
  const { setRole } = useUserProfile();
  const { reviews, getReviewsForUser } = useReviews();
  const { findMatches } = useMatches();
  const { getMyConnections } = useConnections();
  const { chatRooms } = useChat();

  const [topMatchScore, setTopMatchScore] = useState<number>(0);
  const [connectsCount, setConnectsCount] = useState<number>(0);

  // Derive the effective role from Firebase profile or Zustand store
  const effectiveRole = profile?.role || currentRole || 'seeker';

  useEffect(() => {
    if (user?.uid) {
      getReviewsForUser(user.uid);
      getMyConnections(user.uid).then(conns => {
        if (conns) setConnectsCount(conns.length);
      });
      if (profile) {
        findMatches(profile, profile.city || 'Chennai').then(matches => {
          if (matches && matches.length > 0) {
            const top = Math.max(...matches.map(m => m.compatibilityScore || 0));
            setTopMatchScore(top);
          }
        });
      }
    }
  }, [user?.uid, profile]);

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
    }
    navigate(newRole === 'seeker' ? '/dashboard' : '/owner-dashboard');
  };

  return (
    <div className="min-h-screen bg-parchment">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column */}
          <div className="w-full lg:w-[355px] space-y-5">
            {/* Profile Card */}
            <div className="card-nestmate overflow-hidden">
              <div className="h-24 gradient-fire relative">
                <button onClick={() => navigate('/settings')} className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur rounded-lg text-white hover:bg-white/30 transition-all">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
              <div className="px-5 pb-5">
                <div className="relative -mt-10 mb-3">
                  <div className="w-20 h-20 rounded-full border-4 border-white p-0.5 bg-parchment">
                    <img
                      src={profile?.avatar || user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.name || user?.displayName || 'guest'}`}
                      alt=""
                      className="w-full h-full rounded-full"
                    />
                  </div>
                  {profile?.isPremium && (
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-gold rounded-full flex items-center justify-center border-2 border-white">
                      <Crown className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-display italic">{profile?.name || user?.displayName || 'Guest User'}</h2>
                  <TrustBadge profile={profile} size="md" showLabel showTooltip />
                </div>
                <p className="text-sm text-ink/50 mb-3">{profile?.profession} · {profile?.city}</p>
                <div className="flex gap-2 mb-4 flex-wrap items-center">
                  {profile?.workEmailVerified && <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Corporate Verified</span>}
                  {profile?.isVerified && <span className="badge-teal text-[10px]"><Shield className="w-3 h-3 mr-1" />Verified Member</span>}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  <div className="bg-cream/50 rounded-lg p-2">
                    <p className="text-lg font-bold">{connectsCount || profile?.connectsUsed || 0}</p>
                    <p className="text-[10px] text-ink/50">Connects</p>
                  </div>
                  <div className="bg-cream/50 rounded-lg p-2">
                    <p className="text-lg font-bold">{chatRooms?.length || 0}</p>
                    <p className="text-[10px] text-ink/50">Chats</p>
                  </div>
                  <div className="bg-cream/50 rounded-lg p-2">
                    <p className="text-lg font-bold text-fire">{topMatchScore > 0 ? `${topMatchScore}%` : '95%'}</p>
                    <p className="text-[10px] text-ink/50">Top Match</p>
                  </div>
                </div>
                <button onClick={() => navigate('/settings')} className="w-full py-2.5 border border-ink/10 rounded-xl text-sm font-medium text-ink/70 hover:bg-cream/50 transition-all">
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Profile Completeness Meter */}
            <ProfileCompleteness profile={profile} />

            {/* Preferences */}
            <div className="card-nestmate p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm">Preferences</h4>
                <button onClick={() => navigate('/settings')} className="text-xs text-fire">Edit</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Budget', value: `₹${(profile?.budget || 0).toLocaleString()}` },
                  { label: 'Role', value: effectiveRole === 'seeker' ? 'Seeker' : 'Owner' },
                  { label: 'City', value: profile?.city || '—' },
                  { label: 'Move-in', value: profile?.moveInDate ? new Date(profile.moveInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—' },
                ].map(p => (
                  <div key={p.label} className="bg-cream/50 rounded-lg p-2.5">
                    <p className="text-[10px] text-ink/40">{p.label}</p>
                    <p className="text-sm font-medium">{p.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust & Socials */}
            {(profile?.socialLinks?.linkedin || profile?.socialLinks?.instagram || profile?.workEmailVerified) && (
              <div className="card-nestmate p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm">Trust & Socials</h4>
                  <button onClick={() => navigate('/settings')} className="text-xs text-fire">Edit</button>
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
              <button onClick={handleSwitchRole} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-cream/50 transition-all text-left">
                <SwitchCamera className="w-4 h-4 text-ink/60" />
                <span className="text-sm flex-1">Switch to {effectiveRole === 'seeker' ? 'Owner' : 'Seeker'} Mode</span>
                <ChevronRight className="w-4 h-4 text-ink/30" />
              </button>
              <button onClick={() => navigate('/settings')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-cream/50 transition-all text-left">
                <Lock className="w-4 h-4 text-ink/60" />
                <span className="text-sm flex-1">Privacy Settings</span>
                <ChevronRight className="w-4 h-4 text-ink/30" />
              </button>
              <button onClick={() => navigate('/notifications')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-cream/50 transition-all text-left">
                <Bell className="w-4 h-4 text-ink/60" />
                <span className="text-sm flex-1">Notifications</span>
                <ChevronRight className="w-4 h-4 text-ink/30" />
              </button>

              <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-cream/50 transition-all text-left">
                <HelpCircle className="w-4 h-4 text-ink/60" />
                <span className="text-sm flex-1">Help & Support</span>
                <ChevronRight className="w-4 h-4 text-ink/30" />
              </button>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 transition-all text-left text-red-500">
                <LogOut className="w-4 h-4" />
                <span className="text-sm flex-1">Logout</span>
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex-1 space-y-5">
            {/* Premium Banner */}
            {!profile?.isPremium && (
              <div className="gradient-dark rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <span className="badge-gold text-[10px] mb-3 inline-block">NestMate Premium</span>
                  <h3 className="text-xl font-display italic text-white mb-2">Unlock unlimited connections</h3>
                  <p className="text-sm text-white/60 mb-4">Get priority placement, see who viewed your profile, and send unlimited connect requests.</p>
                  <button onClick={() => navigate('/pricing')} className="bg-gold text-ink font-medium px-5 py-2.5 rounded-xl text-sm hover:bg-gold-dark transition-all">
                    Upgrade — ₹299/month
                  </button>
                </div>
              </div>
            )}

            {/* Activity Feed */}
            <div className="card-nestmate p-5">
              <h4 className="font-semibold mb-4">Recent Activity</h4>
              <div className="text-center py-10">
                <TrendingUp className="w-12 h-12 text-ink/20 mx-auto mb-3" />
                <p className="text-sm text-ink/50">Your activity will appear here as you use NestMate</p>
              </div>
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
                          <img 
                            src={review.reviewerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.reviewerName}`} 
                            alt={review.reviewerName}
                            className="w-8 h-8 rounded-full bg-cream border border-border object-cover"
                          />
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
                <div className="text-center py-6">
                  <Star className="w-8 h-8 text-ink/20 mx-auto mb-2" />
                  <p className="text-sm text-ink/50">No reviews yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
