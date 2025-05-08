import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

export const useAuth = (requireAuth = true) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (requireAuth && status === "unauthenticated") {
      router.push(
        `/auth/login?callbackUrl=${encodeURIComponent(router.asPath)}`
      );
    }
  }, [requireAuth, status, router]);

  return {
    session,
    status,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    user: session?.user,
  };
};
