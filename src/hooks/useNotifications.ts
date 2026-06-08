import { useState, useCallback, useEffect } from 'react';

export interface Notification {
  id: string;
  timestamp: string;
  status: string;
  latency: number;
  message: string;
  read: boolean;
}

const STORAGE_KEY = 'network_notifications';
const MAX_NOTIFICATIONS = 100;
const DEDUP_WINDOW_MS = 60_000; // 60 seconds

function loadNotifications(): Notification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveNotifications(notifications: Notification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)));
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(loadNotifications);

  // Sync to localStorage whenever notifications change
  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  const addNotification = useCallback((status: string, latency: number, message: string) => {
    setNotifications(prev => {
      // Dedup: don't add if same status was notified within DEDUP_WINDOW_MS
      const now = Date.now();
      const recent = prev.find(
        n => n.status === status && (now - new Date(n.timestamp).getTime()) < DEDUP_WINDOW_MS
      );
      if (recent) return prev;

      const newNotif: Notification = {
        id: `${now}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
        status,
        latency,
        message,
        read: false,
      };

      return [newNotif, ...prev].slice(0, MAX_NOTIFICATIONS);
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, addNotification, markAllRead, clearAll, unreadCount };
}
