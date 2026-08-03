import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useStorage } from '@/hooks/useStorage';
import {
  Bell, Lock, Eye, Moon, Globe, Camera, Loader2, AlertTriangle, ChevronRight, Download, Trash2, ShieldCheck,
} from 'lucide-react';
import {
  collection, query, where, getDocs, deleteDoc, doc, getDoc,
} from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { toast } from 'sonner';
import PageShell from '@/components/PageShell';

interface SettingsState {
  profilePublic: boolean;
  showLastSeen: boolean;
  discoverable: boolean;
  darkMode: boolean;
  pushMatches: boolean;
  pushMessages: boolean;
  pushRequests: boolean;
  emailUpdates: boolean;
  language: string;
}

const defaultSettings: SettingsState = {
  profilePublic: true,
  showLastSeen: true,
  discoverable: true,
  darkMode: false,
  pushMatches: true,
  pushMessages: true,
  pushRequests: true,
  emailUpdates: false,
  language: 'en',
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, profile, logout, refreshProfile } = useAuth();
  const { updateProfile } = useUserProfile();
  const { uploadProfilePicture } = useStorage();

  const [activeTab, setActiveTab] = useState<'account' | 'privacy' | 'notifications' | 'appearance'>('account');
  const [toggles, setToggles] = useState<SettingsState>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Download data state
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (profile?.settings) {
      setToggles(prev => ({ ...prev, ...profile.settings }));
    }
  }, [profile?.settings]);

  const toggle = async (key: keyof SettingsState) => {
    const updated = { ...toggles, [key]: !toggles[key] };
    setToggles(updated);
    if (key === 'darkMode') {
      if (updated.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    if (user?.uid) {
      setSaving(true);
      try {
        await updateProfile(user.uid, { settings: updated } as any);
      } catch (err) {
        console.error('Failed to save settings:', err);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0] && user?.uid) {
      setAvatarUploading(true);
      try {
        const url = await uploadProfilePicture(e.target.files[0], user.uid);
        await updateProfile(user.uid, { avatar: url } as any);
        await refreshProfile(user.uid);
      } catch (err) {
        console.error('Failed to upload avatar:', err);
      } finally {
        setAvatarUploading(false);
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // ─── DELETE ACCOUNT ──────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (!user?.uid || deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      const uid = user.uid;

      // 1. Delete user's listings
      const listingsQ = query(collection(db, 'listings'), where('ownerId', '==', uid));
      const listingsSnap = await getDocs(listingsQ);
      await Promise.all(listingsSnap.docs.map(d => deleteDoc(d.ref)));

      // 2. Delete user's connections (both directions)
      const [connFrom, connTo] = await Promise.all([
        getDocs(query(collection(db, 'connections'), where('fromUserId', '==', uid))),
        getDocs(query(collection(db, 'connections'), where('toUserId', '==', uid))),
      ]);
      await Promise.all([...connFrom.docs, ...connTo.docs].map(d => deleteDoc(d.ref)));

      // 3. Delete user's notifications
      const notifsSnap = await getDocs(query(collection(db, 'notifications'), where('userId', '==', uid)));
      await Promise.all(notifsSnap.docs.map(d => deleteDoc(d.ref)));

      // 4. Delete chat rooms (where participant)
      const roomsSnap = await getDocs(query(collection(db, 'chatRooms'), where('participants', 'array-contains', uid)));
      await Promise.all(roomsSnap.docs.map(d => deleteDoc(d.ref)));

      // 5. Delete user profile + private contact data
      await deleteDoc(doc(db, 'users', uid));
      try {
        await deleteDoc(doc(db, 'privateUserData', uid));
      } catch {
        // May not exist for legacy accounts
      }

      // 6. Delete Firebase Auth user
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
      }

      navigate('/');
    } catch (err: any) {
      console.error('Delete account failed:', err);
      // If re-auth required, prompt user to re-login first
      if (err.code === 'auth/requires-recent-login') {
        alert('For security, please log out and log back in before deleting your account.');
      }
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // ─── DOWNLOAD MY DATA ────────────────────────────────────────
  const handleDownloadData = async () => {
    if (!user?.uid) return;
    setDownloading(true);
    try {
      const uid = user.uid;
      const data: Record<string, any> = {};

      // Gather user profile + private contact fields
      const profileSnap = await getDoc(doc(db, 'users', uid));
      data.profile = profileSnap.exists() ? profileSnap.data() : null;
      try {
        const privateSnap = await getDoc(doc(db, 'privateUserData', uid));
        data.privateContact = privateSnap.exists() ? privateSnap.data() : null;
      } catch {
        data.privateContact = null;
      }

      // Listings
      const listingsSnap = await getDocs(query(collection(db, 'listings'), where('ownerId', '==', uid)));
      data.listings = listingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Connections
      const [c1, c2] = await Promise.all([
        getDocs(query(collection(db, 'connections'), where('fromUserId', '==', uid))),
        getDocs(query(collection(db, 'connections'), where('toUserId', '==', uid))),
      ]);
      data.connections = [...c1.docs, ...c2.docs].map(d => ({ id: d.id, ...d.data() }));

      // Notifications
      const notifsSnap = await getDocs(query(collection(db, 'notifications'), where('userId', '==', uid)));
      data.notifications = notifsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Format + download
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nestmate-data-${uid.slice(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const ToggleSwitch = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`relative w-11 h-6 rounded-full transition-all ${active ? 'bg-fire' : 'bg-ink/20'}`}
      aria-label={active ? 'On' : 'Off'}
    >
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${active ? 'left-6' : 'left-1'}`} />
    </button>
  );

  return (
    <PageShell
      maxWidth="max-w-3xl"
      title="Settings"
      actions={saving ? <span className="text-xs text-fire animate-pulse">Saving...</span> : undefined}
    >
        {/* Tabs */}
        <div className="flex gap-1 bg-cream/50 rounded-xl p-1 mb-6 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {([
            { key: 'account', label: 'Account', icon: Lock },
            { key: 'privacy', label: 'Privacy', icon: Eye },
            { key: 'notifications', label: 'Notifications', icon: Bell },
            { key: 'appearance', label: 'Appearance', icon: Moon },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center ${
                activeTab === tab.key ? 'bg-white shadow-sm text-fire' : 'text-ink/50 hover:text-ink'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="space-y-4 animate-fade-up">
            <div className="card-nestmate p-5">
              <h3 className="font-semibold mb-4">Account Information</h3>
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-fire/20 to-navy/20 flex items-center justify-center text-3xl font-display italic text-ink/40 overflow-hidden border-4 border-white shadow-sm">
                    {profile?.avatar || user?.photoURL ? (
                      <img src={profile?.avatar || user?.photoURL || ''} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      (profile?.name || user?.displayName ? (profile?.name || user?.displayName)![0].toUpperCase() : '?')
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-fire rounded-full flex items-center justify-center cursor-pointer shadow-md hover:bg-fire-dark transition-colors">
                    {avatarUploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} disabled={avatarUploading} />
                  </label>
                  {profile?.isVerified && (
                    <div className="absolute -top-1 -right-1 bg-teal text-white p-1 rounded-full border-2 border-white shadow-sm">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  <p className="font-medium">{profile?.name || user?.displayName || 'Guest User'}</p>
                  {profile?.isVerified && <ShieldCheck className="w-4 h-4 text-teal" />}
                </div>
                <p className="text-xs text-ink/50 capitalize">{profile?.role}</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label-floating">Phone Number</label>
                  <input type="text" value={profile?.phone ? '+91 ' + profile.phone.slice(-10) : user?.phoneNumber || ''} disabled className="flex-1 input-nestmate bg-cream/30 w-full" />
                </div>
                <div>
                  <label className="label-floating">Email Address</label>
                  <input type="email" value={profile?.email || user?.email || ''} disabled className="input-nestmate bg-cream/30 w-full" />
                </div>
                <div>
                  <label className="label-floating">Name</label>
                  <input type="text" value={profile?.name || ''} disabled className="input-nestmate bg-cream/30 w-full" />
                  <p className="text-xs text-ink/40 mt-1">Edit your name on the <button onClick={() => navigate('/edit-profile')} className="text-fire underline">Profile page</button></p>
                </div>
              </div>
            </div>

            {/* Switch Role */}
            <div className="card-nestmate p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">Switch Role</h3>
                  <p className="text-xs text-ink/50 mt-1">Current Role: <span className="font-medium capitalize">{profile?.role}</span></p>
                </div>
                <button
                  onClick={async () => {
                    if (window.confirm('Switching will change your dashboard. Are you sure?')) {
                      if (user?.uid && profile) {
                        setSaving(true);
                        const newRole = profile.role === 'seeker' ? 'owner' : 'seeker';
                        await updateProfile(user.uid, { role: newRole } as any);
                        window.location.href = '/';
                      }
                    }
                  }}
                  className="px-4 py-2 border-2 border-border rounded-xl text-xs font-medium hover:border-ink/20 transition-all"
                >
                  Switch to {profile?.role === 'seeker' ? 'Owner' : 'Seeker'}
                </button>
              </div>
            </div>

            {/* Verification Status */}
            <div className={`card-nestmate p-5 border-2 transition-all ${profile?.isVerified ? 'border-teal/20 bg-teal/5' : 'border-border'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${profile?.isVerified ? 'bg-teal text-white' : 'bg-ink/5 text-ink/30'}`}>
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Identity Verification</h3>
                    <p className="text-xs text-ink/50">{profile?.isVerified ? 'Your account is verified' : 'Get a blue shield for your profile'}</p>
                  </div>
                </div>
                {profile?.isVerified ? (
                  <span className="px-3 py-1 bg-teal/10 text-teal rounded-full text-[10px] font-bold uppercase tracking-wider">Verified</span>
                ) : (
                  <button 
                    onClick={() => {
                      navigate('/edit-profile');
                      toast.info('Please upload your ID or document to request verification.');
                    }}
                    className="px-4 py-1.5 bg-ink text-white rounded-lg text-xs font-semibold hover:bg-ink/80 transition-all"
                  >
                    Get Verified
                  </button>
                )}
              </div>
              {!profile?.isVerified && (
                <p className="text-[11px] text-ink/40 leading-relaxed">
                  Verified users get <span className="text-fire font-medium">3x more matches</span> and appear at the top of search results. We'll verify your government ID and phone number.
                </p>
              )}
            </div>

            <div className="card-nestmate p-5">
              <h3 className="font-semibold mb-4">Connected Accounts</h3>
              <div className="flex items-center justify-between p-3 bg-cream/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  <span className="text-sm">Google</span>
                </div>
                <span className="text-xs text-teal font-medium">{user?.providerData?.some(p => p.providerId === 'google.com') ? 'Connected' : 'Not connected'}</span>
              </div>
            </div>

            <button onClick={handleLogout} className="w-full py-3 border-2 border-fire/20 text-fire rounded-xl text-sm font-medium hover:bg-fire/5 transition-all">
              Logout
            </button>

            {/* Download My Data */}
            <div className="card-nestmate p-5">
              <h3 className="font-semibold mb-2">Your Data</h3>
              <p className="text-sm text-ink/60 mb-4">Download all your NestMate data as a JSON file (profile, listings, connections, notifications).</p>
              <button
                onClick={handleDownloadData}
                disabled={downloading}
                className="w-full py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-cream/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {downloading ? 'Preparing export...' : 'Download My Data'}
              </button>
            </div>

            {/* Danger Zone */}
            <div className="card-nestmate border-2 border-red-100 p-5">
              <h3 className="font-semibold text-red-500 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Danger Zone
              </h3>
              <p className="text-sm text-ink/60 mb-4">Once you delete your account, all your data will be permanently removed. This cannot be undone.</p>
              <button
                onClick={() => { setDeleteConfirmText(''); setShowDeleteModal(true); }}
                className="w-full py-2.5 border-2 border-red-200 text-red-500 rounded-xl text-sm font-medium hover:bg-red-50 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete Account
              </button>
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <div className="space-y-4 animate-fade-up">
            <div className="card-nestmate p-5">
              <h3 className="font-semibold mb-4">Profile Visibility</h3>
              <div className="space-y-4">
                {[
                  { key: 'profilePublic' as const, label: 'Public Profile', desc: 'Anyone can see your profile' },
                  { key: 'showLastSeen' as const, label: 'Show Last Seen', desc: 'Others can see when you were last active' },
                  { key: 'discoverable' as const, label: 'Discoverable in Search', desc: 'Appear in search results and match feeds' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-ink/50">{item.desc}</p>
                    </div>
                    <ToggleSwitch active={toggles[item.key]} onClick={() => toggle(item.key)} />
                  </div>
                ))}
              </div>
            </div>
            <div className="card-nestmate p-5">
              <h3 className="font-semibold mb-2">Data</h3>
              <button
                onClick={handleDownloadData}
                disabled={downloading}
                className="w-full text-left p-3 rounded-xl hover:bg-cream/50 transition-all text-sm flex items-center justify-between disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-ink/40" />}
                  Download my data
                </span>
                <ChevronRight className="w-4 h-4 text-ink/30" />
              </button>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-4 animate-fade-up">
            <div className="card-nestmate p-5">
              <h3 className="font-semibold mb-4">Push Notifications</h3>
              <div className="space-y-4">
                {[
                  { key: 'pushMatches' as const, label: 'New Matches', desc: 'When a compatible match is found' },
                  { key: 'pushMessages' as const, label: 'Messages', desc: 'When you receive a new message' },
                  { key: 'pushRequests' as const, label: 'Connect Requests', desc: 'When someone wants to connect' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-ink/50">{item.desc}</p>
                    </div>
                    <ToggleSwitch active={toggles[item.key]} onClick={() => toggle(item.key)} />
                  </div>
                ))}
              </div>
            </div>
            <div className="card-nestmate p-5">
              <h3 className="font-semibold mb-4">Email Notifications</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Updates & Newsletters</p>
                  <p className="text-xs text-ink/50">Product updates and tips</p>
                </div>
                <ToggleSwitch active={toggles.emailUpdates} onClick={() => toggle('emailUpdates')} />
              </div>
            </div>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <div className="space-y-4 animate-fade-up">
            <div className="card-nestmate p-5">
              <h3 className="font-semibold mb-4">Theme</h3>
              <div className="flex gap-3">
                <button onClick={() => !toggles.darkMode || toggle('darkMode')} className={`flex-1 p-4 rounded-xl border-2 transition-all ${!toggles.darkMode ? 'border-fire bg-fire/5' : 'border-border'}`}>
                  <div className="w-8 h-8 bg-parchment rounded-full border border-border mx-auto mb-2" />
                  <p className="text-sm font-medium text-center">Light</p>
                </button>
                <button onClick={() => toggles.darkMode || toggle('darkMode')} className={`flex-1 p-4 rounded-xl border-2 transition-all ${toggles.darkMode ? 'border-fire bg-fire/5' : 'border-border'}`}>
                  <div className="w-8 h-8 bg-ink rounded-full mx-auto mb-2" />
                  <p className="text-sm font-medium text-center">Dark</p>
                </button>
              </div>
              <p className="text-xs text-ink/40 mt-3 text-center">Theme preference is saved to your account.</p>
            </div>
            <div className="card-nestmate p-5">
              <h3 className="font-semibold mb-4">Language</h3>
              <select
                className="input-nestmate w-full bg-white dark:bg-zinc-800"
                value={toggles.language || 'en'}
                onChange={async (e) => {
                  const lang = e.target.value;
                  const updated = { ...toggles, language: lang };
                  setToggles(updated);
                  if (user?.uid) {
                    setSaving(true);
                    try {
                      await updateProfile(user.uid, { settings: updated } as any);
                      toast.success('Language updated successfully');
                    } catch (err) {
                      console.error('Failed to save settings:', err);
                    } finally {
                      setSaving(false);
                    }
                  }
                }}
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="ta">Tamil</option>
                <option value="te">Telugu</option>
              </select>
            </div>
          </div>
        )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-xl font-display font-medium text-center mb-2">Delete Account</h2>
            <p className="text-sm text-ink/60 text-center mb-5">
              This will permanently delete your profile, listings, messages, and all associated data. <strong>This cannot be undone.</strong>
            </p>
            <p className="text-xs text-ink/60 mb-2 font-medium">Type <strong>DELETE</strong> to confirm:</p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value.toUpperCase())}
              placeholder="DELETE"
              className="input-nestmate w-full mb-4 font-mono text-center text-red-600 border-red-200 focus:border-red-400"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 btn-outline" disabled={deleting}>
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
