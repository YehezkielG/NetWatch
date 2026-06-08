import { useState, useRef, useEffect } from 'react';
import type { Notification } from '../hooks/useNotifications';
import { formatDate, formatLatency } from '../utils/format';

interface NotificationPanelProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onClearAll: () => void;
}

export default function NotificationPanel({
  notifications,
  unreadCount,
  onMarkAllRead,
  onClearAll,
}: NotificationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      onMarkAllRead();
    }
  };

  const statusEmoji: Record<string, string> = {
    'timeout': '❌',
    'bad': '🔴',
    'potential-bad': '🟠',
    'good': '🟡',
    'excellent': '🟢',
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        id="notification-bell"
        onClick={handleOpen}
        className="relative p-2 rounded-xl transition-all duration-200 hover:bg-white/5 cursor-pointer"
        aria-label="Notifications"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-h-[480px] glass-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 animate-slide-down">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
            <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto max-h-[400px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-40">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-sm">No notifications yet</span>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-5 py-3.5 border-b border-white/3 transition-colors hover:bg-white/3 ${!notif.read ? 'bg-cyan-500/5' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-base mt-0.5">{statusEmoji[notif.status] ?? '⚪'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary leading-snug">{notif.message}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-text-muted font-mono">
                          {formatLatency(notif.latency)}
                        </span>
                        <span className="text-xs text-text-muted">·</span>
                        <span className="text-xs text-text-muted">
                          {formatDate(notif.timestamp)}
                        </span>
                      </div>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
