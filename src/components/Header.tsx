import NotificationPanel from './NotificationPanel';
import type { Notification } from '../hooks/useNotifications';

interface HeaderProps {
  connected: boolean;
  notifications: Notification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onClearAll: () => void;
}

export default function Header({ connected, notifications, unreadCount, onMarkAllRead, onClearAll }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-dark-900/80 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-text-primary tracking-tight leading-none">
              NetWatch
            </h1>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-medium mt-0.5">
              QoS Monitor
            </p>
          </div>
        </div>

        {/* Right side: Status + Notifications */}
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/3">
            <div
              className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]' : 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]'} animate-pulse`}
            />
            <span className="text-xs font-medium text-text-secondary">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Notification Bell */}
          <NotificationPanel
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAllRead={onMarkAllRead}
            onClearAll={onClearAll}
          />
        </div>
      </div>
    </header>
  );
}
