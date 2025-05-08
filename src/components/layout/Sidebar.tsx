"use client"

import type React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Home, Mic, BookOpen, Users, Settings } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const AppSidebar: React.FC = () => {
  const { data: session } = useSession()
  const router = useRouter()

  if (!session) {
    return null
  }

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Podcasts", href: "/podcasts", icon: Mic },
    { name: "Courses", href: "/courses", icon: BookOpen },
  ]

  if (session.user.role === "admin") {
    navigation.push(
      { name: "Users", href: "/dashboard/manage/users", icon: Users },
      { name: "Settings", href: "/dashboard/manage/settings", icon: Settings },
    )
  }

  // Check if a route is active
  const isActive = (href: string) => {
    if (typeof window !== "undefined") {
      return window.location.pathname === href || window.location.pathname.startsWith(`${href}/`)
    }
    return false
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center h-14 px-4">
          <Link href="/" className="text-xl font-bold">
            Campus Podcast
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.name}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

export default AppSidebar
