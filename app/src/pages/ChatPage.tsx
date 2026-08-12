import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { useStorage } from '@/hooks/useStorage';
import type { ChatRoom, Message } from '@/hooks/useChat';
import type { UserProfile } from '@/hooks/useAuth';
import { getDoc, doc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { sanitizePublicProfile } from '@/lib/sanitizeProfile';
import {
  Search, Phone, Send, Smile, Paperclip, Shield, Loader2,
  Home, User as UserIcon, X, CheckCircle2, PhoneCall, Check, CheckCheck, ChevronLeft, MessageCircle
} from 'lucide-react';
import StateEmpty from '@/components/StateEmpty';
import StateLoading from '@/components/StateLoading';

export default function ChatPage() {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const { user, profile: myProfile } = useAuth();
  const {
    subscribeToChatRooms, subscribeToMessages, sendMessage,
    setTyping, markMessagesRead, requestPhoneShare, acceptPhoneShare
  } = useChat();

  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState(roomId || '');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(!!roomId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [searchChat, setSearchChat] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [imageUploading, setImageUploading] = useState(false);
  const { uploadChatImage } = useStorage();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Phone share modal
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneModalMode, setPhoneModalMode] = useState<'request' | 'accept'>('request');
  const [phoneInput, setPhoneInput] = useState('');

  // Keep phone input in sync once own profile (incl. private phone) hydrates
  useEffect(() => {
    if (myProfile?.phone) {
      setPhoneInput((prev) => prev || myProfile.phone);
    }
  }, [myProfile?.phone]);

  // Typing debounce
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingWriteRef = useRef(0);

  // Cache
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [ownerListings, setOwnerListings] = useState<Record<string, string>>({});

  // Per-room unread counts
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const unsubscribersRef = useRef<Record<string, () => void>>({});

  // Real-time chat rooms
  useEffect(() => {
    if (!user?.uid) {
      // Avoid infinite spinner if auth is still resolving or user signed out
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const unsub = subscribeToChatRooms(user.uid, (rooms) => {
      setChatRooms(rooms);
      setIsLoading(false);
      if (!activeRoom && rooms.length > 0 && window.innerWidth > 640) {
        setActiveRoom(rooms[0].id);
      }
    });
    // Safety: never leave the user on a permanent spinner
    const timeout = window.setTimeout(() => setIsLoading(false), 8000);
    return () => {
      unsub();
      window.clearTimeout(timeout);
    };
  }, [user?.uid]);

  // Subscribe to messages for all rooms to track unread counts
  useEffect(() => {
    if (!user?.uid || chatRooms.length === 0) return;
    const currentUnsubs = unsubscribersRef.current;
    // Unsubscribe from rooms no longer in the list
    const roomIds = new Set(chatRooms.map(r => r.id));
    Object.keys(currentUnsubs).forEach(rid => {
      if (!roomIds.has(rid)) {
        currentUnsubs[rid]();
        delete currentUnsubs[rid];
      }
    });
    // Subscribe to new rooms
    chatRooms.forEach(room => {
      if (!currentUnsubs[room.id]) {
        currentUnsubs[room.id] = subscribeToMessages(room.id, (msgs) => {
          // Only count unread messages NOT sent by us
          if (room.id !== activeRoom) {
            const unread = msgs.filter(m => !m.read && m.senderId !== user.uid && m.senderId !== 'system').length;
            setUnreadCounts(prev => ({ ...prev, [room.id]: unread }));
          } else {
            setUnreadCounts(prev => ({ ...prev, [room.id]: 0 }));
          }
        });
      }
    });
    return () => {}; // cleanup handled by roomIds check above
  }, [chatRooms, user?.uid, activeRoom]);

  // Cleanup all unread subscriptions on unmount
  useEffect(() => {
    return () => {
      Object.values(unsubscribersRef.current).forEach(unsub => unsub());
    };
  }, []);

  // Real-time messages
  useEffect(() => {
    if (!activeRoom) return;
    const unsub = subscribeToMessages(activeRoom, setMessages);
    return () => unsub();
  }, [activeRoom]);

  // Clear typing on room change
  useEffect(() => {
    return () => {
      if (activeRoom && user?.uid) {
        setTyping(activeRoom, user.uid, false);
      }
    };
  }, [activeRoom, user?.uid]);

  // Fetch profiles
  useEffect(() => {
    if (!user?.uid || chatRooms.length === 0) return;
    const fetchProfiles = async () => {
      const newProfiles = { ...profiles };
      const newListings = { ...ownerListings };
      let changed = false;
      for (const room of chatRooms) {
        const otherId = room.participants.find(p => p !== user.uid);
        if (otherId && !newProfiles[otherId]) {
          try {
            const snap = await getDoc(doc(db, 'users', otherId));
            if (snap.exists()) {
              // Never keep contact PII from another user's public doc in chat UI state
              const profileData = sanitizePublicProfile({
                uid: otherId,
                ...snap.data(),
              }) as UserProfile;
              newProfiles[otherId] = profileData;
              changed = true;
              if (profileData.role === 'owner') {
                const lq = query(collection(db, 'listings'), where('ownerId', '==', otherId));
                const lsnap = await getDocs(lq);
                if (!lsnap.empty) newListings[otherId] = lsnap.docs[0].id;
              }
            }
          } catch (e) { console.error(e); }
        }
      }
      if (changed) { setProfiles(newProfiles); setOwnerListings(newListings); }
    };
    fetchProfiles();
  }, [chatRooms, user?.uid]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when viewing a room
  useEffect(() => {
    if (activeRoom && user?.uid) {
      markMessagesRead(activeRoom, user.uid);
    }
  }, [activeRoom, messages.length, user?.uid]);

  // Helper: get online status from lastActiveAt
  const getOnlineStatus = (profile: UserProfile | null | undefined): { isOnline: boolean; lastSeen: string } => {
    if (!profile?.lastActiveAt) return { isOnline: false, lastSeen: '' };
    const lastActive = profile.lastActiveAt?.toDate ? profile.lastActiveAt.toDate() : new Date(profile.lastActiveAt);
    const diffMs = Date.now() - lastActive.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    
    if (diffMin < 5) return { isOnline: true, lastSeen: 'Online' };
    if (diffMin < 60) return { isOnline: false, lastSeen: `Active ${diffMin}m ago` };
    if (diffMin < 1440) return { isOnline: false, lastSeen: `Active ${Math.floor(diffMin / 60)}h ago` };
    return { isOnline: false, lastSeen: `Active ${Math.floor(diffMin / 1440)}d ago` };
  };

  // Helper: count unread messages in a room (real, from subscriptions)
  const getUnreadCount = useCallback((room: ChatRoom): number => {
    return unreadCounts[room.id] || 0;
  }, [unreadCounts]);

  // --- Typing handler ---
  const handleInputChange = (value: string) => {
    setInput(value);
    if (!activeRoom || !user?.uid) return;

    // Debounce Firestore writes: max once per 2s
    const now = Date.now();
    if (now - lastTypingWriteRef.current > 2000) {
      setTyping(activeRoom, user.uid, true);
      lastTypingWriteRef.current = now;
    }

    // Clear typing after 3s of inactivity
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      if (activeRoom && user?.uid) setTyping(activeRoom, user.uid, false);
    }, 3000);
  };

  const handleSend = async () => {
    if (!input.trim() || !activeRoom || !user?.uid) return;
    const text = input.trim();
    setInput('');
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    await sendMessage(activeRoom, user.uid, text);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && activeRoom && user?.uid) {
      setImageUploading(true);
      try {
        const url = await uploadChatImage(e.target.files[0], activeRoom);
        await sendMessage(activeRoom, user.uid, '', url);
      } catch (err) { console.error("Failed to upload image", err); }
      finally { setImageUploading(false); }
    }
  };

  // --- Phone sharing ---
  const openPhoneModal = (mode: 'request' | 'accept') => {
    setPhoneModalMode(mode);
    setPhoneInput(myProfile?.phone || phoneInput || '');
    setShowPhoneModal(true);
  };

  const handleRequestPhone = async () => {
    if (!activeRoom || !user?.uid || !myProfile?.name) return;
    const myPhone = phoneInput.trim();
    if (!myPhone) {
      toast.error('Enter your phone number to share');
      return;
    }
    try {
      await requestPhoneShare(activeRoom, user.uid, myProfile.name, myPhone);
      setShowPhoneModal(false);
      toast.success('Phone share request sent!');
    } catch {
      toast.error('Failed to send request');
    }
  };

  const handleAcceptPhone = async () => {
    if (!activeRoom || !user?.uid || !myProfile || !activeChatRoom) return;
    const otherProfile = activeOtherProfile;
    if (!otherProfile) return;
    const myPhone = phoneInput.trim();
    if (!myPhone) {
      toast.error('Enter your phone number to share');
      return;
    }
    const requesterPhone = activeChatRoom.phoneSharing?.requesterPhone || '';
    if (!requesterPhone) {
      toast.error('Requester phone missing. Ask them to request again.');
      return;
    }
    const requesterRole = otherProfile.role;
    try {
      await acceptPhoneShare(
        activeRoom,
        user.uid,
        myProfile.name,
        myPhone,
        requesterPhone,
        requesterRole,
        myProfile.role
      );
      setShowPhoneModal(false);
      toast.success('Phone numbers shared!');
    } catch {
      toast.error('Failed to share number');
    }
  };

  const formatTime = (ts: unknown) => {
    if (!ts) return '';
    const tsObj = ts as { toDate?: () => Date };
    const d = tsObj.toDate ? tsObj.toDate() : new Date(ts as string);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getOtherParticipant = (room: ChatRoom) => {
    const otherId = room.participants.find(p => p !== user?.uid);
    return otherId ? profiles[otherId] : null;
  };

  const getOtherTyping = (room: ChatRoom): boolean => {
    if (!room.typingStatus || !user?.uid) return false;
    const otherId = room.participants.find(p => p !== user.uid);
    return otherId ? !!room.typingStatus[otherId] : false;
  };

  const filteredRooms = chatRooms.filter(r => {
    const p = getOtherParticipant(r);
    const search = searchChat.toLowerCase();
    return p?.name?.toLowerCase().includes(search) || r.lastMessage?.toLowerCase().includes(search);
  });

  const activeChatRoom: ChatRoom | undefined = chatRooms.find(r => r.id === activeRoom) || chatRooms[0];
  const activeOtherProfile = activeChatRoom ? getOtherParticipant(activeChatRoom) : null;
  const activeOtherId = activeChatRoom?.participants.find(p => p !== user?.uid);
  const activeListingId = activeOtherId ? ownerListings[activeOtherId] : null;
  const isOtherTyping = activeChatRoom ? getOtherTyping(activeChatRoom) : false;

  // Phone sharing state for active room
  const phoneSharing = activeChatRoom?.phoneSharing;
  const phonesShared = !!(phoneSharing?.ownerPhone && phoneSharing?.seekerPhone);
  const phoneRequested = !!phoneSharing?.requestedBy;
  const iRequested = phoneSharing?.requestedBy === user?.uid;
  const otherRequested = phoneRequested && !iRequested;

  if (isLoading) {
    return (
      <StateLoading
        label="Loading conversations..."
        className="h-app-mobile md:h-app-desktop -mb-[calc(68px+env(safe-area-inset-bottom,0px))] md:mb-0"
      />
    );
  }

  if (!user?.uid) {
    return (
      <div className="h-app-mobile md:h-app-desktop -mb-[calc(68px+env(safe-area-inset-bottom,0px))] md:mb-0 flex items-center justify-center bg-parchment px-4">
        <StateEmpty
          icon={MessageCircle}
          title="Sign in to view messages"
          description="Connect with matches after logging in"
        />
      </div>
    );
  }

  return (
    <div className="h-app-mobile md:h-app-desktop -mb-[calc(68px+env(safe-area-inset-bottom,0px))] md:mb-0 flex relative overflow-hidden">
      {/* Conversation List */}
      <div className={`w-full sm:w-[320px] border-r border-border bg-white/50 flex-col ${isMobileChatOpen ? 'hidden sm:flex' : 'flex'}`}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-display italic">Messages</h2>
            {chatRooms.length > 0 && (
              <span className="bg-fire text-white text-xs font-bold px-2 py-0.5 rounded-full">{chatRooms.length}</span>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
            <input type="text" value={searchChat} onChange={e => setSearchChat(e.target.value)}
              placeholder="Search conversations..." className="w-full pl-9 pr-4 py-2 bg-cream/50 rounded-xl text-sm outline-none focus:border-fire border border-transparent" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredRooms.length === 0 ? (
            <StateEmpty
              compact
              icon={MessageCircle}
              title="No conversations yet"
              description="Connect with matches to start chatting"
            />
          ) : filteredRooms.map(room => {
            const otherUser = getOtherParticipant(room);
            const typing = getOtherTyping(room);
            return (
              <button key={room.id} onClick={() => { setActiveRoom(room.id); setIsMobileChatOpen(true); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  activeRoom === room.id ? 'bg-fire/5 border border-fire/20' : 'hover:bg-cream/50'
                }`}>
                <div className="relative w-11 h-11 flex-shrink-0">
                  <div className="w-11 h-11 rounded-full bg-cream overflow-hidden border border-border flex items-center justify-center">
                    {otherUser?.avatar ? (
                      <img src={otherUser.avatar} alt={otherUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-ink/40">{otherUser?.name?.charAt(0) || 'U'}</span>
                    )}
                  </div>
                  {/* Online dot */}
                  {otherUser && getOnlineStatus(otherUser).isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{otherUser?.name || 'Loading...'}</p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {room.lastMessageAt && (
                        <span className="text-[10px] text-ink/40">{formatTime(room.lastMessageAt)}</span>
                      )}
                      {getUnreadCount(room) > 0 && (
                        <span className="w-5 h-5 bg-fire text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {getUnreadCount(room) > 9 ? '9+' : getUnreadCount(room)}
                        </span>
                      )}
                    </div>
                  </div>
                  {typing ? (
                    <p className="text-xs text-fire italic flex items-center gap-1">
                      Typing<span className="typing-dots">...</span>
                    </p>
                  ) : (
                    <p className="text-xs text-ink/50 truncate">{room.lastMessage || 'Start a conversation'}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`flex-1 flex-col bg-parchment/50 ${isMobileChatOpen ? 'flex' : 'hidden sm:flex'}`}>
        {activeChatRoom ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 border-b border-border bg-white/50">
              <button onClick={() => setIsMobileChatOpen(false)} className="sm:hidden p-2 -ml-2 rounded-full hover:bg-ink/5">
                <ChevronLeft className="w-5 h-5 text-ink/70" />
              </button>
              <div className="relative w-10 h-10 flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-cream overflow-hidden border border-border flex items-center justify-center">
                  {activeOtherProfile?.avatar ? (
                    <img src={activeOtherProfile.avatar} alt={activeOtherProfile.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-ink/40">{activeOtherProfile?.name?.charAt(0) || 'U'}</span>
                  )}
                </div>
                {activeOtherProfile && getOnlineStatus(activeOtherProfile).isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{activeOtherProfile?.name || 'Loading...'}</h3>
                {isOtherTyping ? (
                  <p className="text-xs text-fire italic flex items-center gap-1">
                    Typing<span className="typing-dots">...</span>
                  </p>
                ) : (() => {
                  const status = getOnlineStatus(activeOtherProfile);
                  return (
                    <p className={`text-xs ${status.isOnline ? 'text-emerald-600 font-medium' : 'text-ink/50'}`}>
                      {status.isOnline ? '🟢 Online' : status.lastSeen || (activeOtherProfile?.role ? `${activeOtherProfile.role}` : 'User')}
                    </p>
                  );
                })()}
              </div>
              <div className="flex gap-1 sm:gap-2">
                {/* Phone share button */}
                {!phonesShared && !phoneRequested && (
                  <button onClick={() => openPhoneModal('request')}
                    className="flex items-center justify-center p-2 sm:px-3 sm:py-1.5 bg-teal/10 text-teal rounded-full sm:rounded-lg hover:bg-teal/20 transition-all text-xs font-bold" title="Share Phone" aria-label="Share phone">
                    <Phone className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline ml-1.5">Share Phone</span>
                  </button>
                )}
                {otherRequested && (
                  <button onClick={() => openPhoneModal('accept')}
                    className="flex items-center justify-center p-2 sm:px-3 sm:py-1.5 bg-teal text-white rounded-full sm:rounded-lg hover:opacity-90 transition-all text-xs font-bold animate-pulse" title="Share My Number Too" aria-label="Share my number too">
                    <Phone className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline ml-1.5">Share My Number Too</span>
                  </button>
                )}
                {phonesShared && (
                  <div className="flex items-center justify-center p-2 sm:px-3 sm:py-1.5 bg-teal/10 text-teal rounded-full sm:rounded-lg text-xs font-bold" title="Numbers Shared" aria-label="Numbers shared">
                    <CheckCircle2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline ml-1.5">Numbers Shared</span>
                  </div>
                )}
                {activeOtherProfile?.role === 'owner' && activeListingId ? (
                  <>
                    <button onClick={() => navigate(`/room/${activeListingId}`)} className="flex items-center justify-center p-2 sm:px-3 sm:py-1.5 bg-fire/10 text-fire rounded-full sm:rounded-lg hover:bg-fire/20 transition-all text-xs font-bold" title="View Flat" aria-label="View flat">
                      <Home className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1.5">View Flat</span>
                    </button>
                    <button onClick={() => navigate(`/match/${activeOtherId}`)} className="flex items-center justify-center p-2 sm:px-3 sm:py-1.5 bg-ink/5 text-ink/80 rounded-full sm:rounded-lg hover:bg-ink/10 transition-all text-xs font-bold" title="View Profile" aria-label="View owner profile">
                      <UserIcon className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1.5">Profile</span>
                    </button>
                  </>
                ) : activeOtherProfile?.role === 'owner' ? (
                  // Owner with no active listing — still show profile link
                  <button onClick={() => navigate(`/match/${activeOtherId}`)} className="flex items-center justify-center p-2 sm:px-3 sm:py-1.5 bg-ink/5 text-ink/80 rounded-full sm:rounded-lg hover:bg-ink/10 transition-all text-xs font-bold" title="View Profile" aria-label="View owner profile">
                    <UserIcon className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1.5">Profile</span>
                  </button>
                ) : activeOtherProfile?.role === 'seeker' ? (
                  <button onClick={() => navigate(`/match/${activeOtherId}`)} className="flex items-center justify-center p-2 sm:px-3 sm:py-1.5 bg-ink/5 text-ink/80 rounded-full sm:rounded-lg hover:bg-ink/10 transition-all text-xs font-bold" title="View Profile" aria-label="View profile">
                    <UserIcon className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1.5">View Profile</span>
                  </button>
                ) : null}
              </div>
            </div>

            {/* Privacy / Phone Numbers Bar */}
            {phonesShared ? (
              <div className="bg-teal/5 border-b border-teal/10 px-3 sm:px-4 py-2 flex items-center justify-center gap-2 sm:gap-4">
                <PhoneCall className="w-3.5 h-3.5 text-teal shrink-0" />
                <span className="text-[10px] sm:text-xs text-teal/80 font-medium truncate">
                  {phoneSharing?.ownerPhone && `Owner: ${phoneSharing.ownerPhone}`}
                  {phoneSharing?.ownerPhone && phoneSharing?.seekerPhone && ' · '}
                  {phoneSharing?.seekerPhone && `Seeker: ${phoneSharing.seekerPhone}`}
                </span>
              </div>
            ) : (
              <div className="bg-fire/5 border-b border-fire/10 px-3 sm:px-4 py-2 flex items-center gap-2 justify-center">
                <Shield className="w-3.5 h-3.5 text-fire shrink-0" />
                <p className="text-[10px] sm:text-xs text-fire/80 truncate">Numbers hidden until both agree to share</p>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => {
                const isMe = msg.senderId === user?.uid;
                const isSystem = msg.isSystem || msg.senderId === 'system';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <div className="bg-ink/5 px-4 py-1.5 rounded-full">
                        <p className="text-xs text-ink/50 text-center">{msg.content}</p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${
                      isMe ? 'bg-fire text-white rounded-br-md' : 'bg-white shadow-sm rounded-bl-md'
                    }`}>
                      {msg.imageUrl && (
                        <div className="mb-2 rounded-lg overflow-hidden">
                          <img src={msg.imageUrl} alt="Chat attachment" className="max-w-full h-auto" />
                        </div>
                      )}
                      {msg.content && <p className="text-sm">{msg.content}</p>}
                      <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                        <span className={`text-[10px] ${isMe ? 'text-white/70' : 'text-ink/40'}`}>
                          {formatTime(msg.createdAt)}
                        </span>
                        {isMe && (
                          msg.read
                            ? <CheckCheck className={`w-3.5 h-3.5 ${isMe ? 'text-blue-200' : 'text-blue-500'}`} />
                            : <Check className={`w-3.5 h-3.5 ${isMe ? 'text-white/50' : 'text-ink/30'}`} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing bubble */}
              {isOtherTyping && (
                <div className="flex justify-start">
                  <div className="bg-white shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-ink/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-ink/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-ink/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              {messages.length === 0 && (
                <StateEmpty
                  compact
                  icon={MessageCircle}
                  title="Say hello"
                  description="Start the conversation with a friendly message."
                />
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-2 sm:p-4 bg-white border-t border-border">
              <div className="flex items-center gap-1 sm:gap-2 max-w-full">
                <button type="button" className="p-2 text-ink/40 hover:text-ink/60 transition-colors shrink-0" aria-label="Emoji (coming soon)" title="Emoji (coming soon)">
                  <Smile className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <label className="p-2 text-ink/40 hover:text-ink/60 cursor-pointer transition-colors shrink-0" aria-label="Attach image">
                  {imageUploading ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" /> : <Paperclip className="w-5 h-5 sm:w-6 sm:h-6" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} disabled={imageUploading} />
                </label>
                <div className="flex-1 min-w-0 bg-cream border border-border/60 rounded-full focus-within:border-fire/50 focus-within:bg-white transition-all flex items-center shadow-sm">
                  <input type="text" value={input}
                    onChange={e => handleInputChange(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Message..."
                    aria-label="Message"
                    className="w-full bg-transparent px-4 py-2.5 sm:py-3 text-[15px] sm:text-base outline-none truncate" />
                </div>
                <button onClick={handleSend} disabled={!input.trim()}
                  aria-label="Send message"
                  className="p-2.5 sm:p-3 bg-fire text-white rounded-full disabled:opacity-30 disabled:scale-95 hover:bg-fire-dark transition-all flex items-center justify-center shadow-md shrink-0">
                  <Send className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-ink/40">
            <p className="text-lg font-display italic mb-2">Select a conversation</p>
            <p className="text-sm">or connect with a match to start chatting</p>
          </div>
        )}
      </div>

      {/* Phone Share Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4" onClick={() => setShowPhoneModal(false)}>
          <div className="bg-white rounded-[22px] shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {phoneModalMode === 'accept' ? 'Share Your Number' : 'Share Phone Number'}
              </h3>
              <button onClick={() => setShowPhoneModal(false)} className="p-1 text-ink/40 hover:text-ink"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-ink/60 mb-4">
              {phoneModalMode === 'accept' ? (
                <>
                  <strong>{activeOtherProfile?.name}</strong> already shared their number. Enter yours to complete mutual sharing.
                </>
              ) : (
                <>
                  Share your phone number with <strong>{activeOtherProfile?.name}</strong>?
                  They will only see your number after they agree to share theirs too.
                </>
              )}
            </p>
            <div className="mb-6">
              <label className="text-xs font-bold text-ink/40 uppercase tracking-widest mb-2 block">Your Number</label>
              <input
                type="tel"
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full px-4 py-2.5 bg-cream/30 border border-border rounded-xl text-sm outline-none focus:border-fire font-medium"
                autoFocus
              />
            </div>
            <button
              onClick={phoneModalMode === 'accept' ? handleAcceptPhone : handleRequestPhone}
              disabled={!phoneInput.trim()}
              className="w-full py-3 bg-fire text-white rounded-xl font-bold text-sm hover:bg-fire-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" />
              {phoneModalMode === 'accept' ? 'Confirm & Share' : 'Request to Share'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
