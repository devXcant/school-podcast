"use client";

import type React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Mic, Radio } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  totalCourses: number;
  totalPodcasts: number;
  liveStreamsCount: number;
  recentPodcasts: any[];
  courses: any[];
}

const StudentDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalCourses: 0,
    totalPodcasts: 0,
    liveStreamsCount: 0,
    recentPodcasts: [],
    courses: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/student-stats");
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching student stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">Enrolled courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Podcasts
            </CardTitle>
            <Mic className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPodcasts}</div>
            <p className="text-xs text-muted-foreground">Total recordings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Streams</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.liveStreamsCount}</div>
            <p className="text-xs text-muted-foreground">Active streams</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your Courses</CardTitle>
              <CardDescription>Courses you're enrolled in</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/courses">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.courses.length > 0 ? (
              <div className="space-y-4">
                {stats.courses.slice(0, 5).map((course) => (
                  <Link
                    href={`/courses/${course.id}`}
                    key={course.id}
                    className="block"
                  >
                    <div className="rounded-lg border p-3 hover:bg-accent transition-colors">
                      <h3 className="font-medium">{course.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {course.code}
                      </p>
                      <div className="flex items-center mt-2">
                        <span className="text-xs text-muted-foreground">
                          Lecturer:{" "}
                          {typeof course.lecturer === "object"
                            ? course.lecturer.name
                            : "N/A"}
                        </span>
                        <span className="mx-2 text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {course.podcasts?.length || 0} Podcasts
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                No courses found.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Podcasts</CardTitle>
              <CardDescription>Latest available recordings</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/podcasts">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recentPodcasts.length > 0 ? (
              <div className="space-y-4">
                {stats.recentPodcasts.slice(0, 5).map((podcast) => (
                  <Link
                    href={`/podcasts/${podcast.id}`}
                    key={podcast.id}
                    className="block"
                  >
                    <div className="rounded-lg border p-3 hover:bg-accent transition-colors">
                      <h3 className="font-medium">{podcast.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {typeof podcast.course === "object"
                          ? podcast.course.title
                          : "N/A"}
                      </p>
                      <div className="flex items-center mt-2">
                        <span className="text-xs text-muted-foreground">
                          By:{" "}
                          {typeof podcast.recorded_by === "object"
                            ? podcast.recorded_by.name
                            : "N/A"}
                        </span>
                        <span className="mx-2 text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(podcast.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                No recent podcasts found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
