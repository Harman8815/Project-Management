"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav aria-label="breadcrumb" className="mb-4 flex items-center text-sm">
      <ol className="flex items-center">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight
                className="mx-2 h-4 w-4 text-gray-400 dark:text-gray-500"
                aria-hidden="true"
              />
            )}
            {item.href && index < items.length - 1 ? (
              <Link
                href={item.href}
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-800 dark:text-gray-200">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
