"use client";

import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setIsDarkMode, setIsSidebarCollapsed } from "@/state";
import { useGetAuthUserQuery } from "@/state/api";
import { signOut } from "aws-amplify/auth";
import { Menu, Moon, Search, Settings, Sun, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import React from "react";

const Navbar = () => {
  const dispatch = useAppDispatch();
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed,
  );
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  const { data: currentUser } = useGetAuthUserQuery({});
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  if (!currentUser) return null;
  const currentUserDetails = currentUser?.userDetails;

  return (
    <nav className="flex items-center justify-between bg-white px-4 py-3 dark:bg-black">
      <div className="flex items-center gap-8">
        {!isSidebarCollapsed ? null : (
          <button
            onClick={() => dispatch(setIsSidebarCollapsed(true))}
            className="rounded p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            aria-label="Open sidebar"
          >
            <Menu className="h-8 w-8 dark:text-white" />
          </button>
        )}
        <div className="relative flex h-min w-[240px]">
          <Search
            className="absolute left-[4px] top-1/2 mr-2 h-5 w-5 -translate-y-1/2 transform cursor-pointer dark:text-white"
            aria-hidden="true"
          />
          <input
            className="w-full rounded border-none bg-gray-100 p-2 pl-8 placeholder-gray-500 focus:border-transparent focus:outline-none dark:bg-gray-700 dark:text-white dark:placeholder-white"
            type="search"
            placeholder="Search..."
            aria-label="Search"
          />
        </div>
      </div>

      <div className="flex items-center">
        <button
          onClick={() => dispatch(setIsDarkMode(!isDarkMode))}
          className="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? (
            <Sun className="h-6 w-6 cursor-pointer dark:text-white" />
          ) : (
            <Moon className="h-6 w-6 cursor-pointer dark:text-white" />
          )}
        </button>
        <Link
          href="/settings"
          className="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Settings"
        >
          <Settings className="h-6 w-6 cursor-pointer dark:text-white" />
        </Link>
        <div className="mx-5 hidden min-h-[2em] w-[0.1rem] bg-gray-200 md:inline-block"></div>
        <div className="hidden items-center justify-between md:flex">
          <div className="align-center flex h-9 w-9 justify-center">
            {!!currentUserDetails?.profilePictureUrl ? (
              <Image
                src={`/${currentUserDetails?.profilePictureUrl}`}
                alt={currentUserDetails?.username || "User Profile Picture"}
                width={36}
                height={36}
                className="rounded-full object-cover"
              />
            ) : (
              <User className="h-6 w-6 cursor-pointer rounded-full dark:text-white" />
            )}
          </div>
          <span className="mx-3 text-gray-800 dark:text-white">
            {currentUserDetails?.username}
          </span>
          <button
            className="hidden rounded bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 md:block"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
