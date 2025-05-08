"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import { useSession, signOut } from "next-auth/react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ModeToggle } from "../ui/mode-toggle"
// import { ModeToggle } from "@/components/ui/mode-toggle"

const Header: React.FC = () => {
  const { data: session } = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/auth/login")
  }

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const NavItems = () => (
    <>
      {session ? (
        <>
          <Link href="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
            Dashboard
          </Link>
          <Link href="/podcasts" className="text-sm font-medium transition-colors hover:text-primary">
            Podcasts
          </Link>
          <Link href="/courses" className="text-sm font-medium transition-colors hover:text-primary">
            Courses
          </Link>
          {(session.user.role === "admin" ||
            session.user.role === "lecturer" ||
            session.user.role === "course_rep") && (
            <Link href="/podcasts/record" className="text-sm font-medium transition-colors hover:text-primary">
              Record
            </Link>
          )}
        </>
      ) : (
        <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
          Home
        </Link>
      )}
    </>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">Campus Podcast</span>
          </Link>

          <nav className="hidden md:flex gap-6">
            <NavItems />
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <ModeToggle />

          {session ? (
            <div className="flex items-center gap-4">
              <span className="hidden md:inline-block text-sm text-muted-foreground">{session.user.role}</span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{session.user.name ? getInitials(session.user.name) : "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{session.user.name}</p>
                      <p className="text-xs text-muted-foreground">{session.user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={handleSignOut}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="pr-0">
              <div className="px-7">
                <Link href="/" className="flex items-center" onClick={() => setOpen(false)}>
                  <span className="font-bold">Campus Podcast</span>
                </Link>
                <nav className="mt-10 flex flex-col gap-6">
                  <NavItems />
                  {session ? (
                    <Button onClick={handleSignOut} className="mt-4">
                      Sign out
                    </Button>
                  ) : (
                    <Button asChild className="mt-4">
                      <Link href="/auth/login" onClick={() => setOpen(false)}>
                        Sign in
                      </Link>
                    </Button>
                  )}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

export default Header
