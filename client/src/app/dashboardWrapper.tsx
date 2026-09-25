"use client";

import React, { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import StoreProvider, { useAppSelector } from "./redux";
import { AppLoadingScreen, ErrorState } from "@/components/ui";
import { useGetAuthUserQuery } from "@/state/api";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed,
  );
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  const { isLoading, isError, refetch } = useGetAuthUserQuery({});

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  });

  const handleRetry = () => {
    refetch();
  };

  if (isLoading) {
    return <AppLoadingScreen message="Loading ProjeX..." />;
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-dark-bg">
        <ErrorState
          message="Unable to connect to the application. Please check your connection."
          onRetry={handleRetry}
          retryLabel="Retry"
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full min-w-0 overflow-x-hidden bg-gray-50 text-gray-900">
      <Sidebar />
      <main
        className={`flex h-screen w-full min-w-0 flex-col bg-gray-50 dark:bg-dark-bg transition-all duration-300 ${
          isSidebarCollapsed ? "md:pl-16" : "md:pl-64"
        }`}
      >
        <Navbar />
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
};

const DashboardWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <StoreProvider>
      {/* <AuthProvider> */}
        <DashboardLayout>{children}</DashboardLayout>
      {/* </AuthProvider> */}
    </StoreProvider>
  );
};

export default DashboardWrapper;
