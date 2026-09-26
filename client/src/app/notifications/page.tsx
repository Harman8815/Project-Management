"use client";

import Header from "@/components/Header";
import { CardSkeleton } from "@/components/ui";
import { toast } from "@/components/ui/toast";
import { useGetAuthUserQuery, useGetNotificationsQuery, useMarkAllNotificationsReadMutation, useMarkNotificationReadMutation } from "@/state/api";
import { CheckCheck, Circle } from "lucide-react";

export default function NotificationsPage() {
  const { data: currentUser, isLoading: userLoading } = useGetAuthUserQuery({});
  const userId = currentUser?.userDetails?.userId;
  const { data, isLoading, isError } = useGetNotificationsQuery({ userId: userId ?? 0 }, {
    skip: !userId,
  });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();

  if (userLoading || !userId) {
    return <main className="p-8"><p className="text-sm text-gray-500">Loading user...</p></main>;
  }

  return (
    <main className="space-y-6 p-8">
      <div className="flex items-center justify-between gap-4"><Header name="Notifications" /><button className="flex items-center gap-2 rounded border px-3 py-2 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800" onClick={async () => { await markAllRead(userId!).unwrap(); toast.success("All notifications marked as read"); }} disabled={markingAll}><CheckCheck size={16} /> Mark all read</button></div>
      {isLoading && <CardSkeleton count={5} />}
      {isError && <p className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">Notifications are unavailable.</p>}
      {!isLoading && !isError && <section className="divide-y rounded border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">{data?.data.map((notification) => <article className={`flex items-start gap-3 p-4 ${notification.read ? "opacity-60" : ""}`} key={notification.id}><Circle className={notification.read ? "mt-1 text-gray-300" : "mt-1 fill-blue-500 text-blue-500"} size={12} /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-4"><h2 className="font-semibold">{notification.title}</h2>{!notification.read && <button className="text-xs font-medium text-blue-600" onClick={async () => { await markRead(notification.id).unwrap(); toast.success("Notification marked as read"); }}>Mark read</button>}</div><p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{notification.message}</p><p className="mt-2 text-xs text-gray-400">{new Date(notification.createdAt).toLocaleString()}</p></div></article>)}{data?.data.length === 0 && <p className="p-8 text-center text-sm text-gray-500">You are all caught up.</p>}</section>}
    </main>
  );
}
