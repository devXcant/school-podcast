"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/src/components/layout/Layout";
import CourseList from "@/src/components/course/CourseList";
// import CourseList from "@/components/course/CourseList";

export default function CoursesPage() {
  const { data: session } = useSession();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/courses");
      const data = await response.json();

      if (data.success) {
        setCourses(data.data);
      } else {
        setError(data.message || "Failed to load courses");
      }
    } catch (error) {
      setError("Failed to load courses");
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const canCreateCourse = () => {
    if (!session) return false;
    return ["admin", "lecturer"].includes(session.user.role);
  };

  return (
    <Layout>
      <Head>
        <title>Courses | Campus Podcast System</title>
      </Head>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Courses</h1>
        {canCreateCourse() && (
          <Button asChild>
            <Link href="/dashboard/manage/courses/create">
              <Plus className="h-4 w-4 mr-1" />
              Create Course
            </Link>
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="overflow-hidden">
              <div className="p-4 space-y-3">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/3 mb-4" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="bg-muted/50 px-4 py-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <CourseList courses={courses} />
      )}
    </Layout>
  );
}
