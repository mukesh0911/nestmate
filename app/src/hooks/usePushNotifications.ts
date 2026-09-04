import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Register service worker on mount
  useEffect(() => {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      setPermission(Notification.permission);

      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          setSwRegistration(reg);
        })
        .catch((err) => {
          console.warn('Service Worker registration error:', err);
        });
    }
  }, []);

  // Request browser notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast.error('Push notifications are not supported in this browser.');
      return false;
    }

    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === 'granted') {
        toast.success('Push notifications enabled!');
        return true;
      } else if (res === 'denied') {
        toast.error('Notification permission denied in browser settings.');
        return false;
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
    }
    return false;
  }, []);

  // Trigger local notification broadcast
  const sendLocalNotification = useCallback(
    (title: string, body: string, url = '/chat') => {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        if (swRegistration) {
          swRegistration.showNotification(title, {
            body,
            icon: '/favicon.svg',
            data: { url },
          });
        } else {
          new Notification(title, { body, icon: '/favicon.svg' });
        }
      }
    },
    [swRegistration]
  );

  return {
    permission,
    requestPermission,
    sendLocalNotification,
    isSupported: typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator,
  };
}
