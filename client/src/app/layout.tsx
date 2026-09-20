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
      <body className={inter.className}>
        <ErrorBoundary>
          <DashboardWrapper>{children}</DashboardWrapper>
        </ErrorBoundary>
      </body>
    </html>
  );
}
