"use client";

import Header from "@/components/Header";
import { Card, ErrorState, CardSkeleton, Skeleton } from "@/components/ui";
import { useGetAuthUserQuery, useGetProjectsQuery, useGetArchivedProjectsQuery, useUpdateNotificationPreferencesMutation } from "@/state/api";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setIsDarkMode } from "@/state";
import { ChevronDown, User, Shield, Bell, Moon, Sun, Copy, Settings as SettingsIcon } from "lucide-react";
import React, { useState } from "react";
import Image from "next/image";
import { toast } from "@/components/ui/toast";

const Settings = () => {
  const dispatch = useAppDispatch();
  const { data: currentUser, isLoading, isError } = useGetAuthUserQuery({});
  const { data: allProjects, isLoading: projectsLoading } = useGetProjectsQuery();
  const [updatePrefs, { isLoading: updatingPrefs }] = useUpdateNotificationPreferencesMutation();
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const { data: archivedProjects, isLoading: archivedLoading } = useGetArchivedProjectsQuery();
  const userRole = currentUser?.userDetails?.organizationMemberships?.[0]?.role ?? "";
  const isAdminOrOwner = ["ADMIN", "OWNER"].includes(userRole);

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
  const orgInfo = orgMemberships[0]?.organization;
  const team = userDetails?.team;
  const assignedTasks = userDetails?.assignedTasks ?? [];
  const authoredTasks = userDetails?.authoredTasks ?? [];
  const activeProjectCount = allProjects?.filter((p) => !p.archived).length ?? 0;
  const assignedTaskCount = assignedTasks.length;
  const authoredTaskCount = authoredTasks.length;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

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
              <label className="block text-sm font-medium dark:text-white">Cognito ID</label>
              <div className="mt-1 flex items-center gap-2">
                <div className="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                  {userDetails?.cognitoId ?? "Not set"}
                </div>
                {userDetails?.cognitoId && (
                  <button
                    onClick={() => copyToClipboard(userDetails.cognitoId!, "Cognito ID")}
                    className="rounded-md border border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700"
                    title="Copy Cognito ID"
                  >
                    <Copy className="h-4 w-4 text-gray-500" />
                  </button>
                )}
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
            <div>
              <label className="block text-sm font-medium dark:text-white">Capacity (hours/week)</label>
              <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                {userDetails?.capacityHoursPerWeek ?? "Not set"}
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
            <div>
              <label className="block text-sm font-medium dark:text-white">Assigned Tasks</label>
              <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                {assignedTaskCount} tasks assigned to you
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-white">Authored Tasks</label>
              <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                {authoredTaskCount} tasks authored by you
              </div>
            </div>
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

        {orgInfo && (
          <CollapsibleSection
            icon={<SettingsIcon className="h-5 w-5" />}
            title="Organization Information"
            defaultOpen={false}
          >
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium dark:text-white">Organization Name</label>
                <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                  {orgInfo.name ?? "Unknown"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-white">Organization Slug</label>
                <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                  {orgInfo.slug ?? "Unknown"}
                </div>
              </div>
              {orgInfo.id !== undefined && (
                <div>
                  <label className="block text-sm font-medium dark:text-white">Organization ID</label>
                  <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                    {orgInfo.id}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        {team && (
          <CollapsibleSection
            icon={<User className="h-5 w-5" />}
            title="Team Information"
            defaultOpen={false}
          >
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium dark:text-white">Team Name</label>
                <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                  {team.teamName}
                </div>
              </div>
              {team.productOwnerUsername && (
                <div>
                  <label className="block text-sm font-medium dark:text-white">Product Owner</label>
                  <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                    {team.productOwnerUsername}
                  </div>
                </div>
              )}
              {team.projectManagerUsername && (
                <div>
                  <label className="block text-sm font-medium dark:text-white">Project Manager</label>
                  <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                    {team.projectManagerUsername}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        <CollapsibleSection
          icon={<SettingsIcon className="h-5 w-5" />}
          title="Project Memberships"
          defaultOpen={false}
        >
          <div className="space-y-3">
            {projectsLoading ? (
              <Skeleton height={60} width="100%" />
            ) : (
              <>
                <div className="flex justify-between rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700">
                  <span className="dark:text-white">Active Projects</span>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{activeProjectCount}</span>
                </div>
                <div className="flex justify-between rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700">
                  <span className="dark:text-white">Total Projects</span>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{allProjects?.length ?? 0}</span>
                </div>
                <div className="flex justify-between rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700">
                  <span className="dark:text-white">Assigned Tasks</span>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{assignedTaskCount}</span>
                </div>
                {!allProjects?.length && !projectsLoading && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No projects available.</p>
                )}
              </>
            )}
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          icon={isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          title="Appearance"
          defaultOpen={false}
        >
          <div className="space-y-3">
            <ToggleRow
              label="Dark mode"
              checked={isDarkMode}
              onChange={(checked) => dispatch(setIsDarkMode(checked))}
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          icon={<Shield className="h-5 w-5" />}
          title="Security"
          defaultOpen={false}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium dark:text-white">Authentication Method</label>
              <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                AWS Cognito (JWT)
              </div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>Session tokens are automatically refreshed via RTK Query interceptors.</p>
              <p className="mt-1">Upon token expiration, you will be redirected to the login screen.</p>
            </div>
          </div>
        </CollapsibleSection>

        {isAdminOrOwner && (
          <CollapsibleSection
            icon={<Shield className="h-5 w-5" />}
            title="Archives"
            defaultOpen={false}
          >
            <div className="space-y-3">
              {archivedLoading ? (
                <Skeleton height={60} width="100%" />
              ) : (
                <>
                  {archivedProjects && archivedProjects.length > 0 ? (
                    <div className="space-y-2">
                      {archivedProjects.map((project) => (
                        <div
                          key={project.id}
                          className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700"
                        >
                          <div>
                            <p className="font-medium dark:text-white">{project.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {project.key ?? "No key"} · Archived: {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : "Unknown"}
                            </p>
                          </div>
                          <button
                            className="rounded-md border border-blue-500 bg-white p-2 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:bg-gray-700 dark:text-blue-400"
                            onClick={() => {
                              // TODO: Implement restore via API
                              toast.info("Restore functionality coming soon");
                            }}
                          >
                            Restore
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No archived projects.
                    </p>
                  )}
                </>
              )}
            </div>
          </CollapsibleSection>
        )}

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
                try {
                  await updatePrefs({
                    userId: userDetails.userId,
                    emailEnabled: notificationPref.emailEnabled,
                    inAppEnabled: notificationPref.inAppEnabled,
                    notificationType: notificationPref.notificationType,
                  }).unwrap();
                  toast.success("Preferences saved");
                } catch {
                  toast.error("Failed to save preferences");
                }
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
