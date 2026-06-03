import { Bell } from 'lucide-react';
import type { VendorNotification } from '../types';

interface NotificationCenterProps {
  notifications: Partial<VendorNotification>[];
  unreadCount: number;
}

export function NotificationCenter({ notifications, unreadCount }: NotificationCenterProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-700">Notifications</span>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700">
          {unreadCount} Unread
        </span>
      </div>
      <div className="space-y-2">
        {notifications.slice(0, 3).map((notification) => (
          <div key={notification.id} className="rounded-xl bg-slate-50 px-3 py-2">
            <div className="text-xs font-bold text-slate-900">{notification.title}</div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {notification.status || 'unread'}
            </div>
          </div>
        ))}
        {notifications.length === 0 && <div className="text-xs font-medium text-slate-500">No notifications yet.</div>}
      </div>
    </div>
  );
}
