import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { Bell, MessageCircle, UserPlus, Home, FileText, Shield, Settings, CheckCheck, Trash2 } from 'lucide-react';

const iconMap: Record<string, { icon: any; color: string }> = {
  match: { icon: Bell, color: 'bg-navy/10 text-navy' },
  message: { icon: MessageCircle, color: 'bg-fire/10 text-fire' },
  connect: { icon: UserPlus, color: 'bg-navy/10 text-navy' },
  room: { icon: Home, color: 'bg-teal/10 text-teal' },
  agreement: { icon: FileText, color: 'bg-gold/10 text-gold' },
  verification: { icon: Shield, color: 'bg-teal/10 text-teal' },
  system: { icon: Settings, color: 'bg-ink/10 text-ink' },
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscribeToNotifications, markAsRead, markAllRead, deleteNotification, requestPermission } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<string>(
    () => ('Notification' in window ? Notification.permission : 'default')
  );

  const handleEnablePush = async () => {
    const granted = await requestPermission();
    setPermissionStatus(granted ? 'granted' : 'denied');
  };

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToNotifications(user.uid, setNotifications);
    return () => unsub();
  }, [user?.uid]);

  const handleMarkAllRead = async () => {
    if (!user?.uid) return;
    await markAllRead(user.uid);
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
  };

  const handleClick = async (notif: Notification) => {
    if (!notif.read) await markAsRead(notif.id);
    if (notif.actionUrl) navigate(notif.actionUrl);
  };

  const today = new Date().toLocaleDateString();

  const todayNotifs = notifications.filter(
    n => n.createdAt?.toDate?.()?.toLocaleDateString() === today
  );
  const olderNotifs = notifications.filter(
    n => n.createdAt?.toDate?.()?.toLocaleDateString() !== today
  );

  return (
    <div className="min-h-screen bg-parchment">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display italic">Notifications</h1>
          {notifications.some(n => !n.read) && (
            <button onClick={handleMarkAllRead} className="text-sm text-fire flex items-center gap-1.5">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>

        {permissionStatus === 'default' && (
          <div className="bg-teal/10 border border-teal/20 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-teal" />
              </div>
              <div>
                <p className="text-sm font-semibold text-teal-dark">Never miss a match!</p>
                <p className="text-xs text-teal-dark/70">Enable push notifications to know when someone connects.</p>
              </div>
            </div>
            <button 
              onClick={handleEnablePush}
              className="px-4 py-2 bg-teal text-white text-xs font-bold rounded-xl hover:bg-teal-dark transition-colors"
            >
              Enable
            </button>
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-16 h-16 text-ink/20 mx-auto mb-4" />
            <h3 className="text-xl font-display italic mb-2">All caught up!</h3>
            <p className="text-sm text-ink/50">You have no new notifications</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayNotifs.length > 0 && (
              <div>
                <p className="text-xs font-medium text-ink/40 px-1 mb-2">Today</p>
                <div className="space-y-2">
                  {todayNotifs.map(notif => {
                    const config = iconMap[notif.type] || iconMap.system;
                    const Icon = config.icon;
                    return (
                      <div
                        key={notif.id}
                        className={`w-full flex items-start gap-4 p-4 rounded-2xl transition-all text-left cursor-pointer ${
                          !notif.read ? 'bg-fire/5 border border-fire/10' : 'bg-white hover:bg-cream/30'
                        }`}
                      >
                        <button onClick={() => handleClick(notif)} className="flex items-start gap-4 flex-1 text-left">
                          <div className={`w-10 h-10 ${config.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium mb-0.5">{notif.title}</p>
                            <p className="text-xs text-ink/50">{notif.description}</p>
                            <p className="text-[10px] text-ink/30 mt-1">
                              {notif.createdAt?.toDate?.()?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) || ''}
                            </p>
                          </div>
                        </button>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notif.read && <span className="w-2 h-2 bg-fire rounded-full" />}
                          <button onClick={() => handleDelete(notif.id)} className="p-1 text-ink/20 hover:text-red-400 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {olderNotifs.length > 0 && (
              <div>
                <p className="text-xs font-medium text-ink/40 px-1 mb-2">Earlier</p>
                <div className="space-y-2">
                  {olderNotifs.map(notif => {
                    const config = iconMap[notif.type] || iconMap.system;
                    const Icon = config.icon;
                    return (
                      <div
                        key={notif.id}
                        className={`w-full flex items-start gap-4 p-4 rounded-2xl transition-all text-left cursor-pointer ${
                          !notif.read ? 'bg-fire/5 border border-fire/10' : 'bg-white hover:bg-cream/30'
                        }`}
                      >
                        <button onClick={() => handleClick(notif)} className="flex items-start gap-4 flex-1 text-left">
                          <div className={`w-10 h-10 ${config.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium mb-0.5">{notif.title}</p>
                            <p className="text-xs text-ink/50">{notif.description}</p>
                            <p className="text-[10px] text-ink/30 mt-1">
                              {notif.createdAt?.toDate?.()?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || ''}
                            </p>
                          </div>
                        </button>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notif.read && <span className="w-2 h-2 bg-fire rounded-full" />}
                          <button onClick={() => handleDelete(notif.id)} className="p-1 text-ink/20 hover:text-red-400 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
