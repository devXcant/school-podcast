"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { User, BookOpen, Mic, Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Stats {
  totalUsers: number
  totalCourses: number
  totalPodcasts: number
  recentPodcasts: any[]
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalCourses: 0,
    totalPodcasts: 0,
    recentPodcasts: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/admin-stats")
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error("Error fetching admin stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">Available courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Podcasts</CardTitle>
            <Mic className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPodcasts}</div>
            <p className="text-xs text-muted-foreground">Recorded sessions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Podcasts</CardTitle>
            <CardDescription>Latest recorded sessions</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/podcasts">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {stats.recentPodcasts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentPodcasts.map((podcast) => (
                  <TableRow key={podcast._id}>
                    <TableCell>
                      <Link href={`/podcasts/${podcast._id}`} className="font-medium hover:underline">
                        {podcast.title}
                      </Link>
                    </TableCell>
                    <TableCell>{podcast.course?.title || "N/A"}</TableCell>
                    <TableCell>{podcast.recordedBy?.name || "N/A"}</TableCell>
                    <TableCell>{new Date(podcast.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center py-6 text-muted-foreground">No recent podcasts found.</div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button variant="outline" className="h-auto flex flex-col items-start p-4 justify-start" asChild>
              <Link href="/dashboard/manage/users/create">
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="font-medium">Create User</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Add a new user to the system</span>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex flex-col items-start p-4 justify-start" asChild>
              <Link href="/dashboard/manage/courses/create">
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="font-medium">Create Course</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Add a new course</span>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex flex-col items-start p-4 justify-start" asChild>
              <Link href="/podcasts/record">
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center">
                    <Mic className="h-4 w-4 mr-2" />
                    <span className="font-medium">Record Session</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Start a new recording</span>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex flex-col items-start p-4 justify-start" asChild>
              <Link href="/podcasts/upload">
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="font-medium">Upload Podcast</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Upload an existing recording</span>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Database Connection</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                Connected
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Storage Status</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                Available
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Last Backup</span>
              <span className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdminDashboard
