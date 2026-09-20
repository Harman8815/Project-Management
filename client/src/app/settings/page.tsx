"use client";

import Header from "@/components/Header";
import { Card, LoadingState, ErrorState } from "@/components/ui";
import { useGetAuthUserQuery } from "@/state/api";
import React from "react";

const Settings = () => {
  const { data: currentUser, isLoading, isError } = useGetAuthUserQuery({});

  if (isLoading) return <LoadingState message="Loading settings..." />;
  if (isError)
    return (
      <ErrorState
        message="Failed to load settings"
        onRetry={() => window.location.reload()}
      />
    );

  const userDetails = currentUser?.userDetails;
  const settings = {
    username: userDetails?.username ?? "Unknown",
    email: userDetails?.email ?? "Unknown",
    teamName: "Development Team",
    roleName: "Developer",
  };

  const labelStyles = "block text-sm font-medium dark:text-white";
  const textStyles =
    "mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 dark:text-white";

  return (
    <div className="p-8">
      <Header name="Settings" />
      <Card className="max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className={labelStyles}>Username</label>
            <div className={textStyles}>{settings.username}</div>
          </div>
          <div>
            <label className={labelStyles}>Email</label>
            <div className={textStyles}>{settings.email}</div>
          </div>
          <div>
            <label className={labelStyles}>Team</label>
            <div className={textStyles}>{settings.teamName}</div>
          </div>
          <div>
            <label className={labelStyles}>Role</label>
            <div className={textStyles}>{settings.roleName}</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
