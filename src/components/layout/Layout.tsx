"use client";

import type React from "react";
import { type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarProvider } from "@/components/ui/sidebar";
import Header from "./Header";
import AppSidebar from "./Sidebar";
import Navbar from "./Navbar";

interface LayoutProps {
  children: ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
  isPublicRoute?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  requireAuth = true,
  allowedRoles = [],
  isPublicRoute = false,
}) => {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Check if the current path is a public route
  const isPublicPage =
    isPublicRoute ||
    router.pathname === "/" ||
    router.pathname === "/auth/login" ||
    router.pathname === "/auth/register";

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-md space-y-4 p-8 border rounded-lg bg-card text-card-foreground shadow-sm">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  // Public route that doesn't require authentication
  if (!requireAuth && isPublicPage) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto py-6 px-4">{children}</main>
      </div>
    );
  }

  // Redirect unauthenticated users if auth is required
  if (requireAuth && status === "unauthenticated" && !isPublicPage) {
    router.push(`/auth/login?callbackUrl=${encodeURIComponent(router.asPath)}`);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-md space-y-4 p-8">
          <p className="text-center">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Redirect users without the required role
  if (
    session &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(session.user?.role)
  ) {
    router.push("/dashboard");
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-md space-y-4 p-8">
          <p className="text-center">Access denied. Redirecting...</p>
        </div>
      </div>
    );
  }

  // Default authenticated layout
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {session && !isPublicPage ? (
        <SidebarProvider>
          <div className="flex h-[calc(100vh-4rem)] flex-col">
            <div className="flex flex-1 overflow-hidden">
              <AppSidebar />
              <main className="flex-1 overflow-auto p-6">
                <div className="container mx-auto">{children}</div>
              </main>
            </div>
          </div>
        </SidebarProvider>
      ) : (
        <main className="container mx-auto py-6 px-4">{children}</main>
      )}
    </div>
  );
};

export default Layout;
