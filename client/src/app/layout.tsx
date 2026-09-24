import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import DashboardWrapper from "./dashboardWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ProjeX",
  description: "Application to manage Projects, Tasks and Teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} overflow-x-hidden`}>
        <ErrorBoundary
          fallback={
            <div className="flex min-h-screen items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold">Something went wrong</h1>
                <p className="text-gray-600">
                  An unexpected error occurred. Please refresh the page or try again later.
                </p>
              </div>
            </div>
          }
        >
          <DashboardWrapper>{children}</DashboardWrapper>
        </ErrorBoundary>
      </body>
    </html>
  );
}
