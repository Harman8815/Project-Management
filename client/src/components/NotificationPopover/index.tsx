"use client";

import { useGetAuthUserQuery, useGetNotificationsQuery, useMarkNotificationReadMutation, useGetUnreadNotificationCountQuery } from "@/state/api";
import { CardSkeleton } from "@/components/ui";
import { Bell } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

export default function NotificationPopover() {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { data: currentUser, isLoading: userLoading } = useGetAuthUserQuery({});
  const userId = currentUser?.userDetails?.userId;

  const { data: notificationsData, isLoading: notifLoading, refetch } = useGetNotificationsQuery(
    { userId: userId ?? 0, unreadOnly: false },
    { skip: !userId },
  );
  const [markRead] = useMarkNotificationReadMutation();
  const { data: unreadData, refetch: refetchCount } = useGetUnreadNotificationCountQuery(userId ?? 0, {
    skip: !userId,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = unreadData?.count ?? 0;
  const notifications = notificationsData?.data ?? [];

  const handleMarkRead = async (id: number) => {
    await markRead(id).unwrap();
    void refetch();
    void refetchCount();
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full text-xs font-bold text-white ${
              unreadCount > 99 ? "bg-red-500 px-1" : "bg-red-500"
            }`}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
          <div className="p-3">
            <h3 className="text-sm font-semibold dark:text-white">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifLoading ? (
              <CardSkeleton count={3} />
            ) : notifications.length === 0 ? (
              <p className="p-3 text-sm text-gray-500 dark:text-gray-400">No notifications</p>
            ) : (
              notifications.slice(0, 5).map((n) => (
                <div
                  key={n.id}
                  className={`border-b border-gray-200 p-3 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 ${
                    !n.read ? "bg-blue-50 dark:bg-gray-700/50" : ""
                  }`}
                >
                  <div className="flex justify-between">
                    <p className="font-medium dark:text-white">{n.title}</p>
                    {!n.read && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="text-xs text-blue-600"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-gray-600 dark:text-gray-300">{n.message}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
          {notifications.length > 0 && (
            <a
              href="/notifications"
              className="block p-3 text-center text-sm font-medium text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              View all notifications
            </a>
          )}
        </div>
      )}
    </div>
  );
}
