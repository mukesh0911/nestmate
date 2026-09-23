import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { Bell, MessageCircle, UserPlus, Home, FileText, Shield, Settings, CheckCheck, Trash2 } from 'lucide-react';
import PageShell from '@/components/PageShell';
import StateEmpty from '@/components/StateEmpty';

const iconMap: Record<string, { icon: any; color: string }> = {
  match: { icon: Bell, color: 'bg-[#FFF2EB] text-[#E5501A]' },
  message: { icon: MessageCircle, color: 'bg-[#FFF2EB] text-[#E5501A]' },
  connect: { icon: UserPlus, color: 'bg-emerald-50 text-emerald-700' },
  room: { icon: Home, color: 'bg-teal-50 text-teal-700' },
  agreement: { icon: FileText, color: 'bg-amber-50 text-amber-700' },
  verification: { icon: Shield, color: 'bg-emerald-50 text-emerald-700' },
  system: { icon: Settings, color: 'bg-gray-100 text-gray-700' },
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
    <PageShell
      maxWidth="max-w-3xl"
      title="Notifications"
      subtitle="Stay updated on high compatibility matches, inquiries, and verified messages."
      actions={
        notifications.some(n => !n.read) ? (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-[#E5501A] hover:text-[#D0400B] font-semibold flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FFF2EB] border border-[#E5501A]/20 transition-all shadow-2xs cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" /> Mark all as read
          </button>
        ) : undefined
      }
    >
      {permissionStatus === 'default' && (
        <div className="bg-white border border-emerald-200/80 rounded-3xl p-5 sm:p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="font-serif font-medium text-base text-[#1A1A2E]">Never miss an inquiry or match!</p>
              <p className="text-xs text-gray-500 mt-0.5">Enable browser notifications to receive immediate alerts when a roommate connects.</p>
            </div>
          </div>
          <button 
            onClick={handleEnablePush}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-full transition-all shadow-xs shadow-emerald-600/20 shrink-0 self-start sm:self-auto cursor-pointer"
          >
            Enable Alerts
          </button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="py-12">
          <StateEmpty
            icon={Bell}
            title="All caught up!"
            description="You have no new notifications right now."
            className="bg-white rounded-3xl max-w-xl mx-auto border border-gray-100 p-8 shadow-xs"
          />
        </div>
      ) : (
        <div className="space-y-6">
          {todayNotifs.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-3">Today</p>
              <div className="space-y-3">
                {todayNotifs.map(notif => {
                  const config = iconMap[notif.type] || iconMap.system;
                  const Icon = config.icon;
                  return (
                    <div
                      key={notif.id}
                      data-testid="notification-item"
                      className={`w-full flex items-start gap-4 p-4 sm:p-5 rounded-3xl transition-all text-left ${
                        !notif.read ? 'bg-[#FFF2EB]/80 border border-[#E5501A]/20 shadow-2xs' : 'bg-white border border-gray-100 shadow-2xs hover:border-gray-200'
                      }`}
                    >
                      <button onClick={() => handleClick(notif)} className="flex items-start gap-4 flex-1 text-left cursor-pointer">
                        <div className={`w-11 h-11 ${config.color} rounded-2xl flex items-center justify-center shrink-0 shadow-2xs`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-serif font-medium text-sm text-[#1A1A2E] mb-0.5">{notif.title}</p>
                          <p className="text-xs text-gray-600 leading-relaxed font-sans">{notif.description}</p>
                          <p className="text-[10px] text-gray-400 font-medium mt-1.5">
                            {notif.createdAt?.toDate?.()?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) || ''}
                          </p>
                        </div>
                      </button>
                      <div className="flex items-center gap-1.5 shrink-0 pt-1">
                        {!notif.read && <span className="w-2.5 h-2.5 bg-[#E5501A] rounded-full" aria-label="Unread" />}
                        <button
                          onClick={() => handleDelete(notif.id)}
                          className="p-2 text-gray-300 hover:text-red-500 transition-colors rounded-full hover:bg-red-50 cursor-pointer"
                          aria-label="Delete notification"
                        >
                          <Trash2 className="w-4 h-4" />
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
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-3">Earlier</p>
              <div className="space-y-3">
                {olderNotifs.map(notif => {
                  const config = iconMap[notif.type] || iconMap.system;
                  const Icon = config.icon;
                  return (
                    <div
                      key={notif.id}
                      data-testid="notification-item"
                      className={`w-full flex items-start gap-4 p-4 sm:p-5 rounded-3xl transition-all text-left ${
                        !notif.read ? 'bg-[#FFF2EB]/80 border border-[#E5501A]/20 shadow-2xs' : 'bg-white border border-gray-100 shadow-2xs hover:border-gray-200'
                      }`}
                    >
                      <button onClick={() => handleClick(notif)} className="flex items-start gap-4 flex-1 text-left cursor-pointer">
                        <div className={`w-11 h-11 ${config.color} rounded-2xl flex items-center justify-center shrink-0 shadow-2xs`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-serif font-medium text-sm text-[#1A1A2E] mb-0.5">{notif.title}</p>
                          <p className="text-xs text-gray-600 leading-relaxed font-sans">{notif.description}</p>
                          <p className="text-[10px] text-gray-400 font-medium mt-1.5">
                            {notif.createdAt?.toDate?.()?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || ''}
                          </p>
                        </div>
                      </button>
                      <div className="flex items-center gap-1.5 shrink-0 pt-1">
                        {!notif.read && <span className="w-2.5 h-2.5 bg-[#E5501A] rounded-full" aria-label="Unread" />}
                        <button
                          onClick={() => handleDelete(notif.id)}
                          className="p-2 text-gray-300 hover:text-red-500 transition-colors rounded-full hover:bg-red-50 cursor-pointer"
                          aria-label="Delete notification"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </PageShell>
  );
}
