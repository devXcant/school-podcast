"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Home,
  Mic,
  Users,
  Settings,
  LogOut,
  User,
} from "lucide-react";
import { signOut } from "next-auth/react";

const Navbar = () => {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session) return null;

  const isActive = (path: string) => pathname === path;

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: Home,
      roles: ["student", "lecturer", "course_rep", "admin"],
    },
    {
      href: "/courses",
      label: "Courses",
      icon: BookOpen,
      roles: ["student", "lecturer", "course_rep", "admin"],
    },
    {
      href: "/podcasts",
      label: "Podcasts",
      icon: Mic,
      roles: ["student", "lecturer", "course_rep", "admin"],
    },
    {
      href: "/users",
      label: "Users",
      icon: Users,
      roles: ["admin"],
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
      roles: ["student", "lecturer", "course_rep", "admin"],
    },
  ];

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          {navItems
            .filter((item) => item.roles.includes(session.user.role))
            .map((item) => (
              <Button
                key={item.href}
                variant={isActive(item.href) ? "default" : "ghost"}
                size="sm"
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Link>
              </Button>
            ))}
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {session.user.name} ({session.user.role})
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
