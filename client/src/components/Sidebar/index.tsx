"use client";

import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setIsSidebarCollapsed } from "@/state";
import { useGetAuthUserQuery, useGetProjectsQuery } from "@/state/api";
import { profilePictureSrc } from "@/lib/utils";
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Home,
  Layers3,
  LockIcon,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  Bell,
  User,
  Users,
  X,
  LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

interface SidebarLinkConfig {
  href: string;
  icon: LucideIcon;
  label: string;
}

const sidebarLinks: SidebarLinkConfig[] = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/timeline", icon: Briefcase, label: "Timeline" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/settings", icon: Settings, label: "Settings" },
  { href: "/organization", icon: ShieldAlert, label: "Organization" },
  { href: "/assistant", icon: Sparkles, label: "Assistant" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
  { href: "/users", icon: User, label: "Users" },
  { href: "/teams", icon: Users, label: "Teams" },
];

const priorityLinks: SidebarLinkConfig[] = [
  { href: "/priority/urgent", icon: AlertCircle, label: "Urgent" },
  { href: "/priority/high", icon: ShieldAlert, label: "High" },
  { href: "/priority/medium", icon: AlertTriangle, label: "Medium" },
  { href: "/priority/low", icon: AlertOctagon, label: "Low" },
  { href: "/priority/backlog", icon: Layers3, label: "Backlog" },
];

const Sidebar = () => {
  const [showProjects, setShowProjects] = useState(true);
  const [showPriority, setShowPriority] = useState(true);

  const { data: projects } = useGetProjectsQuery();
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed,
  );
  const { data: currentUser } = useGetAuthUserQuery({});

  const handleSignOut = async () => {
    try {
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };
  const currentUserDetails = currentUser?.userDetails;
  const avatarSrc = profilePictureSrc(currentUserDetails?.profilePictureUrl);

  const sidebarClassNames = `fixed flex flex-col h-screen shadow-xl
    transition-all duration-300 z-40 dark:bg-black bg-white
    ${isSidebarCollapsed ? "w-16" : "w-64"}
    hidden md:flex
  `;

  const SidebarLink = ({ href, icon: Icon, label }: SidebarLinkConfig) => {
    const isActive =
      pathname === href || (pathname === "/" && href === "/dashboard");

    return (
      <Link href={href} className="w-full">
        <div
          className={`relative flex cursor-pointer items-center gap-3 transition-colors hover:bg-gray-100 dark:bg-black dark:hover:bg-gray-700 group ${
            isActive ? "bg-gray-100 text-white dark:bg-gray-600" : ""
          } ${isSidebarCollapsed ? "justify-center px-2 py-3" : "justify-start px-8 py-3"}`}
        >
          {isActive && !isSidebarCollapsed && (
            <div className="absolute left-0 top-0 h-[100%] w-[5px] bg-blue-200" />
          )}
          <Icon className="h-6 w-6 text-gray-800 dark:text-gray-100 group-hover:text-blue-600" />
          {!isSidebarCollapsed && (
            <span className="font-medium text-gray-800 dark:text-gray-100">
              {label}
            </span>
          )}
        </div>
      </Link>
    );
  };

  return (
    <div className={sidebarClassNames}>
      <div className="flex h-full w-full flex-col">
        <div className={`z-50 flex min-h-[56px] items-center bg-white px-4 pt-3 dark:bg-black ${isSidebarCollapsed ? "w-16 justify-center" : "w-64"}`}>
          {!isSidebarCollapsed && (
            <div className="text-xl font-bold text-gray-800 dark:text-white">
              Projex
            </div>
          )}
          <button
            className="ml-auto py-3"
            onClick={() => {
              dispatch(setIsSidebarCollapsed(!isSidebarCollapsed));
            }}
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? (
              <ChevronDown className="h-6 w-6 text-gray-800 hover:text-gray-500 dark:text-white" />
            ) : (
              <X className="h-6 w-6 text-gray-800 hover:text-gray-500 dark:text-white" />
            )}
          </button>
        </div>
        <div className={`border-y-[1.5px] py-4 dark:border-gray-700 ${isSidebarCollapsed ? "flex justify-center px-2" : "flex items-center gap-5 px-8"}`}>
          <Image src="/logo.png" alt="Logo" width={isSidebarCollapsed ? 30 : 40} height={isSidebarCollapsed ? 30 : 40} />
          {!isSidebarCollapsed && (
            <div>
              <h3 className="text-md font-bold tracking-wide dark:text-gray-200">
                Projex TEAM
              </h3>
              <div className="mt-1 flex items-start gap-2">
                <LockIcon className="mt-[0.1rem] h-3 w-3 text-gray-500 dark:text-gray-400" />
                <p className="text-xs text-gray-500">Private</p>
              </div>
            </div>
          )}
        </div>
        <nav className="z-10 w-full flex-1 overflow-y-auto">
          {sidebarLinks.map((link) => (
            <SidebarLink key={link.href} {...link} />
          ))}

          <button
            onClick={() => setShowProjects((prev) => !prev)}
            className={`flex w-full items-center py-3 text-gray-500 ${isSidebarCollapsed ? "justify-center px-2" : "justify-between px-8"}`}
            aria-expanded={showProjects}
          >
            {!isSidebarCollapsed && <span>Projects</span>}
            {!isSidebarCollapsed ? (
              showProjects ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )
            ) : null}
          </button>
          {!isSidebarCollapsed &&
            showProjects &&
            projects?.map((project) => (
              <SidebarLink
                key={project.id}
                href={`/projects/${project.id}`}
                icon={Briefcase}
                label={project.name}
              />
            ))}

          <button
            onClick={() => setShowPriority((prev) => !prev)}
            className={`flex w-full items-center py-3 text-gray-500 ${isSidebarCollapsed ? "justify-center px-2" : "justify-between px-8"}`}
            aria-expanded={showPriority}
          >
            {!isSidebarCollapsed && <span>Priority</span>}
            {!isSidebarCollapsed ? (
              showPriority ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )
            ) : null}
          </button>
          {!isSidebarCollapsed &&
            showPriority &&
            priorityLinks.map((link) => <SidebarLink key={link.href} {...link} />)}
        </nav>

        <div className="z-10 flex w-full flex-shrink-0 flex-col items-center gap-4 bg-white px-4 py-4 dark:bg-black md:hidden">
          {!isSidebarCollapsed ? (
            <div className="flex w-full items-center">
              <div className="align-center flex h-9 w-9 justify-center">
                {avatarSrc ? (
                  <Image
                    src={avatarSrc}
                    alt={currentUserDetails?.username || "User Profile Picture"}
                    width={100}
                    height={50}
                    unoptimized
                    className="h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-6 w-6 cursor-pointer self-center rounded-full dark:text-white" />
                )}
              </div>
              <span className="mx-3 text-gray-800 dark:text-white">
                {currentUserDetails?.username}
              </span>
              <button
                className="self-start rounded bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex h-9 w-9 justify-center">
              {avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt={currentUserDetails?.username || "User Profile Picture"}
                  width={100}
                  height={50}
                  unoptimized
                  className="h-full rounded-full object-cover"
                />
              ) : (
                <User className="h-6 w-6 cursor-pointer self-center rounded-full dark:text-white" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
