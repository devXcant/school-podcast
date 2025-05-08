import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  // Skip middleware for API routes entirely
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  // Check if the path is protected
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/courses") ||
    pathname.startsWith("/podcasts")

  // Check if the path is auth related
  const isAuthPage =
    pathname.startsWith("/auth/login") ||
    pathname.startsWith("/auth/register")

  // Get the token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // Redirect unauthenticated users to login page
  if (isProtected && !token) {
    const url = new URL("/auth/login", request.url)
    url.searchParams.set("callbackUrl", encodeURI(pathname))
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // Include the paths you want to protect
    "/dashboard/:path*",
    "/courses/:path*",
    "/podcasts/:path*",
    "/auth/login",
    "/auth/register",
  ],
}
