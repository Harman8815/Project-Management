"use client";

import Header from "@/components/Header";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/ui";
import { toast } from "@/components/ui/toast";
import {
  useGetAuthUserQuery,
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/state/api";
import { CheckCheck, Circle, Filter, X, Bell, BellDot } from "lucide-react";
import React, { useState } from "react";

const NOTIFICATION_TYPES = [
  "ALL",
  "ASSIGNMENT",
  "STATUS_CHANGE",
  "COMMENT",
  "MENTION",
  "TASK_DUE_SOON",
  "TASK_OVERDUE",
  "PROJECT_UPDATED",
  "SPRINT_STARTED",
  "SPRINT_ENDING",
] as const;

export default function NotificationsPage() {
  const { data: currentUser, isLoading: userLoading } = useGetAuthUserQuery({});
  const userId = currentUser?.userDetails?.userId;
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useGetNotificationsQuery(
    { userId: userId ?? 0, unreadOnly, type: typeFilter === "ALL" ? undefined : typeFilter },
    {
      skip: !userId,
      selectFromResult: ({ data, ...rest }) => ({
        data: data ? { data: [...data.data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), meta: data.meta } : data,
        ...rest,
      }),
    },
  );

  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();

  const handleMarkRead = async (id: number) => {
    await markRead(id).unwrap();
    toast.success("Notification marked as read");
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;
    await markAllRead(userId).unwrap();
    toast.success("All notifications marked as read");
  };

  const clearFilters = () => {
    setUnreadOnly(false);
    setTypeFilter("ALL");
  };

  if (userLoading || !userId) {
    return (
      <main className="p-8">
        <CardSkeleton count={3} />
      </main>
    );
  }

  if (isError) {
    return (
      <main className="p-8">
        <ErrorState message="Notifications are unavailable" onRetry={() => refetch()} />
      </main>
    );
  }

  const notifications = data?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasActiveFilters = unreadOnly || typeFilter !== "ALL";

  return (
    <main className="space-y-6 p-8">
      <div className="flex items-center justify-between gap-4">
        <Header name="Notifications" />
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 rounded border px-3 py-2 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filters
          </button>
          {hasActiveFilters && (
            <button
              className="rounded border border-gray-300 p-1 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
              onClick={clearFilters}
              title="Clear filters"
            >
              <X size={14} />
            </button>
          )}
          <button
            className="flex items-center gap-2 rounded border px-3 py-2 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={handleMarkAllRead}
            disabled={markingAll}
          >
            <CheckCheck size={16} />
            Mark all read
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={unreadOnly}
                  onChange={(e) => setUnreadOnly(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                />
                Unread only
              </label>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium dark:text-white">Type:</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded border border-gray-300 bg-white p-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {NOTIFICATION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t === "ALL" ? "All types" : t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            {hasActiveFilters && (
              <div className="pt-1">
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isLoading && <CardSkeleton count={5} />}

      {!isLoading && notifications.length === 0 && (
        <EmptyState
          icon={<Bell size={48} className="text-gray-300" />}
          message={hasActiveFilters ? "No notifications match your filters." : "You are all caught up."}
        />
      )}

      {!isLoading && notifications.length > 0 && (
        <section className="divide-y rounded border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className={`flex items-start gap-3 p-4 ${notification.read ? "opacity-60" : ""}`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {notification.read ? (
                  <Circle className="text-gray-300" size={12} />
                ) : (
                  <BellDot className="fill-blue-500 text-blue-500" size={14} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="font-semibold dark:text-white">
                    {notification.title}
                    {notification.type && (
                      <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        {notification.type.replace(/_/g, " ")}
                      </span>
                    )}
                  </h2>
                  {!notification.read && (
                    <button
                      className="text-xs font-medium text-blue-600"
                      onClick={() => handleMarkRead(notification.id)}
                    >
                      Mark read
                    </button>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{notification.message}</p>
                <p className="mt-2 text-xs text-gray-400">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
