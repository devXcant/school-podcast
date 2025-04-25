import React, { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
}

const Layout: React.FC<LayoutProps> = ({
  children,
  requireAuth = true,
  allowedRoles = [],
}) => {
  const router = useRouter();

  const isPublicRoute =
    router.pathname === "/" ||
    router.pathname === "/auth/login" ||
    router.pathname === "/auth/register";

  // Only use session when needed
  if (!requireAuth && isPublicRoute) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Header />
        <main className="container-responsive">{children}</main>
      </div>
    );
  }

  // Use session for protected routes
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="card p-8">Loading...</div>
      </div>
    );
  }

  if (requireAuth && !session && !isPublicRoute) {
    router.push("/auth/login");
    return null;
  }

  if (
    session &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(session.user.role)
  ) {
    router.push("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header />
      {session && !isPublicRoute ? (
        <div className="flex h-[calc(100vh-64px)]">
          {/* <Sidebar /> */}
          <main className="flex-1 overflow-auto p-6">
            <div className="container-responsive">{children}</div>
          </main>
        </div>
      ) : (
        <main className="container-responsive">{children}</main>
      )}
    </div>
  );
};

export default Layout;
