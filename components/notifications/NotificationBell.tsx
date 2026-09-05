'use client';

import { useState, useEffect } from 'react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/customer/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    await fetch('/api/customer/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true })
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-orange-500"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border bg-white p-3 shadow-lg z-50">
          <div className="flex items-center justify-between border-b pb-2">
            <h4 className="text-sm font-semibold text-gray-800">Notifications</h4>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-orange-500 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto divide-y">
            {notifications.length === 0 ? (
              <p className="py-4 text-center text-xs text-gray-500">No notifications</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`py-2 text-xs ${n.is_read ? 'opacity-60' : 'font-semibold'}`}>
                  <p className="text-gray-900">{n.title}</p>
                  <p className="text-gray-500 font-normal">{n.message}</p>
                  <span className="text-[10px] text-gray-400">{new Date(n.created_at).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
