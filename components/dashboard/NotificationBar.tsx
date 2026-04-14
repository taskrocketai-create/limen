"use client";

import { useState } from "react";
import Link from "next/link";
import type { NotificationType } from "@/types/database";

interface Notification {
  id: string;
  listing_id: string | null;
  type: NotificationType;
  message: string;
  read: boolean;
  created_at: string;
}

interface NotificationBarProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

const NOTIFICATION_ICON: Record<NotificationType, string> = {
  intake_submitted: "📋",
  ai_ready: "✦",
  mls_submitted: "✓",
};

export default function NotificationBar({
  notifications,
  onMarkRead,
  onMarkAllRead,
}: NotificationBarProps) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center gap-2 px-3 py-2 rounded-md font-sans text-sm text-stone hover:text-ink hover:bg-stone/10 transition-colors"
        aria-label="Notifications"
      >
        <span className="text-base">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-gilt text-ink text-[10px] font-bold flex items-center justify-center px-1">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-stone/20 rounded-lg shadow-lg z-20 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone/10">
              <h3 className="font-display text-base text-ink">Notifications</h3>
              {unread > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="font-sans text-xs text-gilt hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-stone/10">
              {notifications.length === 0 ? (
                <p className="font-sans text-sm text-stone text-center py-8">
                  No notifications
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex gap-3 p-4 hover:bg-parchment transition-colors ${!n.read ? "bg-gilt/5" : ""}`}
                  >
                    <span className="text-sm mt-0.5 flex-shrink-0">
                      {NOTIFICATION_ICON[n.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm text-ink leading-snug">
                        {n.message}
                      </p>
                      {n.listing_id && (
                        <Link
                          href={`/listings/${n.listing_id}`}
                          className="font-sans text-xs text-gilt hover:underline mt-1 block"
                          onClick={() => {
                            onMarkRead(n.id);
                            setOpen(false);
                          }}
                        >
                          View listing →
                        </Link>
                      )}
                    </div>
                    {!n.read && (
                      <button
                        onClick={() => onMarkRead(n.id)}
                        className="flex-shrink-0 w-2 h-2 rounded-full bg-gilt mt-2"
                        aria-label="Mark as read"
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
