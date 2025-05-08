"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { BookOpen, Mic, Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Stats {
  totalCourses: number
  totalPodcasts: number
  recentPodcasts: any[]
  courses: any[]
}

const CourseRepDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalCourses: 0,
    totalPodcasts: 0,
    recentPodcasts: [],
    courses: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/course-rep-stats")
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error("Error fetching course rep stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Course Representative Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">Assigned courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Recordings</CardTitle>
            <Mic className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPodcasts}</div>
            <p className="text-xs text-muted-foreground">Total podcasts recorded</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your Courses</CardTitle>
              <CardDescription>Courses you're representing</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/courses">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.courses.length > 0 ? (
              <div className="space-y-4">
                {stats.courses.slice(0, 5).map((course) => (
                  <Link href={`/courses/${course._id}`} key={course._id} className="block">
                    <div className="rounded-lg border p-3 hover:bg-accent transition-colors">
                      <h3 className="font-medium">{course.title}</h3>
                      <p className="text-sm text-muted-foreground">{course.code}</p>
                      <div className="flex items-center mt-2">
                        <span className="text-xs text-muted-foreground">
                          Lecturer: {typeof course.lecturer === "object" ? course.lecturer.name : "N/A"}
                        </span>
                        <span className="mx-2 text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{course.podcasts?.length || 0} Podcasts</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-6 text-muted-foreground">No courses found.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for course representatives</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <Button variant="outline" className="h-auto flex flex-col items-start p-4 justify-start" asChild>
              <Link href="/podcasts">
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center">
                    <Mic className="h-4 w-4 mr-2" />
                    <span className="font-medium">Manage Podcasts</span>
                  </div>
                  <span className="text-xs text-muted-foreground">View and edit recordings</span>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex flex-col items-start p-4 justify-start" asChild>
              <Link href="/courses">
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    <span className="font-medium">View Courses</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Access your courses</span>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Your Recent Recordings</CardTitle>
            <CardDescription>Latest podcast recordings</CardDescription>
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
                  <TableHead>Views</TableHead>
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
                    <TableCell>{typeof podcast.course === "object" ? podcast.course.title : "N/A"}</TableCell>
                    <TableCell>{podcast.viewCount}</TableCell>
                    <TableCell>{new Date(podcast.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              No recent recordings found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default CourseRepDashboard
