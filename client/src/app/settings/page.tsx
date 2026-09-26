"use client";

import Header from "@/components/Header";
import { Card, ErrorState, CardSkeleton } from "@/components/ui";
import { useGetAuthUserQuery, useUpdateNotificationPreferencesMutation } from "@/state/api";
import { ChevronDown, User, Shield, Bell } from "lucide-react";
import React, { useState } from "react";
import Image from "next/image";

const Settings = () => {
  const { data: currentUser, isLoading, isError } = useGetAuthUserQuery({});
  const [updatePrefs, { isLoading: updatingPrefs }] = useUpdateNotificationPreferencesMutation();

  if (isLoading) {
    return (
      <div className="p-8">
        <Header name="Settings" />
        <CardSkeleton count={3} />
      </div>
    );
  }
  if (isError) return <ErrorState message="Failed to load settings" onRetry={() => window.location.reload()} />;

  const userDetails = currentUser?.userDetails;
  const teamName = userDetails?.team?.teamName ?? "No team assigned";
  const roleName = userDetails?.organizationMemberships?.[0]?.role ?? "No role assigned";
  const notificationPref = userDetails?.notificationPreference;
  const orgMemberships = userDetails?.organizationMemberships ?? [];

  type Section = "profile" | "account" | "notifications" | "appearance";

  return (
    <div className="p-8">
      <Header name="Settings" />
      <div className="mx-auto max-w-3xl space-y-4">
        <CollapsibleSection
          icon={<User className="h-5 w-5" />}
          title="Profile Information"
          defaultOpen={true}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              {userDetails?.profilePictureUrl ? (
                <Image
                  src={userDetails.profilePictureUrl}
                  alt={userDetails.username}
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                  <User className="h-8 w-8 text-gray-500" />
                </div>
              )}
              <div>
                <p className="font-semibold">{userDetails?.username ?? "Unknown"}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{userDetails?.email ?? "No email"}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-white">Username</label>
              <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                {userDetails?.username ?? "Unknown"}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-white">Email</label>
              <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                {userDetails?.email ?? "Unknown"}
              </div>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          icon={<Shield className="h-5 w-5" />}
          title="Account Information"
          defaultOpen={false}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium dark:text-white">User ID</label>
              <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                {userDetails?.userId ?? "Unknown"}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-white">Team</label>
              <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                {teamName}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-white">Role</label>
              <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                {roleName}
              </div>
            </div>
            {userDetails?.createdAt && (
              <div>
                <label className="block text-sm font-medium dark:text-white">Account Created</label>
                <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                  {new Date(userDetails.createdAt).toLocaleDateString()}
                </div>
              </div>
            )}
            {orgMemberships.length > 0 && (
              <div>
                <label className="block text-sm font-medium dark:text-white">Organizations</label>
                <div className="mt-1 space-y-1">
                  {orgMemberships.map((m) => (
                    <div key={m.id} className="flex justify-between rounded-md border border-gray-200 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700">
                      <span className="dark:text-white">{m.organization?.name ?? `Org #${m.organizationId}`}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{m.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!orgMemberships.length && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No organization memberships found.</p>
            )}
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          icon={<Bell className="h-5 w-5" />}
          title="Notification Preferences"
          defaultOpen={false}
        >
          {notificationPref ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!userDetails?.userId) return;
                await updatePrefs({
                  userId: userDetails.userId,
                  emailEnabled: notificationPref.emailEnabled,
                  inAppEnabled: notificationPref.inAppEnabled,
                  notificationType: notificationPref.notificationType,
                }).unwrap();
              }}
              className="space-y-3"
            >
              <ToggleRow
                label="Email notifications"
                checked={notificationPref.emailEnabled}
                onChange={(checked) => {
                  notificationPref.emailEnabled = checked;
                  if (userDetails?.userId)
                    void updatePrefs({ userId: userDetails.userId, emailEnabled: checked }).unwrap();
                }}
                disabled={updatingPrefs}
              />
              <ToggleRow
                label="In-app notifications"
                checked={notificationPref.inAppEnabled}
                onChange={(checked) => {
                  notificationPref.inAppEnabled = checked;
                  if (userDetails?.userId)
                    void updatePrefs({ userId: userDetails.userId, inAppEnabled: checked }).unwrap();
                }}
                disabled={updatingPrefs}
              />
              <div>
                <label className="block text-sm font-medium dark:text-white">Notification type</label>
                <select
                  className="mt-1 w-full rounded-md border border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  value={notificationPref.notificationType}
                  onChange={(e) => {
                    if (userDetails?.userId)
                      void updatePrefs({ userId: userDetails.userId, notificationType: e.target.value }).unwrap();
                  }}
                  disabled={updatingPrefs}
                >
                  <option value="ALL">All</option>
                  <option value="MENTIONS">Mentions only</option>
                  <option value="ASSIGNS">Assigned to me only</option>
                  <option value="NONE">None</option>
                </select>
              </div>
            </form>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No notification preferences configured.
            </p>
          )}
        </CollapsibleSection>
      </div>
    </div>
  );
};

function CollapsibleSection({
  icon,
  title,
  defaultOpen = false,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="shadow dark:border-gray-700">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 text-left font-semibold"
      >
        {icon}
        <span className="dark:text-white">{title}</span>
        <ChevronDown
          className={`ml-auto h-5 w-5 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="mt-4 space-y-3">{children}</div>}
    </Card>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center justify-between">
      <span className="text-sm dark:text-white">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-blue-600" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );
}

export default Settings;
