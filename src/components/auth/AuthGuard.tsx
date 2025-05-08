// src/components/auth/AuthGuard.tsx
'use client'

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = "/"
}: {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (requireAuth && !session) {
      router.push(redirectTo)
    }

    if (!requireAuth && session) {
      router.push(redirectTo)
    }
  }, [session, status, requireAuth, redirectTo, router])

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if ((requireAuth && !session) || (!requireAuth && session)) {
    return null
  }

  return <>{children}</>
}
