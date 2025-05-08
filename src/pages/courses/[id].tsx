"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Head from "next/head";
import Link from "next/link";
import { Mic, Upload, Pencil, Trash, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ICourse, IUser, IPodcast } from "../../types";
import PodcastList from "@/src/components/podcast/PodcastList";
import CourseLiveButton from "@/src/components/course/CourseLiveButton";
import Layout from "@/src/components/layout/Layout";

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string) || "";
  const { data: session } = useSession();
  const [course, setCourse] = useState<ICourse | null>(null);
  const [podcasts, setPodcasts] = useState<IPodcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isUser = (obj: any): obj is IUser => {
    return obj && typeof obj === "object" && "name" in obj;
  };

  useEffect(() => {
    if (id) {
      fetchCourse();
    }
  }, [id]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${id}`);
      const data = await response.json();

      if (data.success) {
        setCourse(data.data);
        if (data.data.podcasts) {
          setPodcasts(data.data.podcasts as IPodcast[]);
        }
      } else {
        setError(data.message || "Failed to load course");
      }
    } catch (error) {
      setError("Failed to load course");
      console.error("Error fetching course:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!course) return;

    try {
      setIsDeleting(true);
      const courseId = course.id || course._id;

      const response = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        router.push("/courses");
      } else {
        setError(data.message || "Failed to delete course");
        setDeleteModalOpen(false);
      }
    } catch (error) {
      setError("Failed to delete course");
      console.error("Error deleting course:", error);
      setDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const canEdit = () => {
    if (!session || !course) return false;

    const isAdmin = session.user.role === "admin";
    const isLecturer =
      session.user.role === "lecturer" &&
      typeof course.lecturer === "object" &&
      isUser(course.lecturer) &&
      (course.lecturer.id === session.user.id ||
        course.lecturer._id === session.user.id);

    return isAdmin || isLecturer;
  };

  const canRecord = () => {
    if (!session || !course) return false;

    const isAdmin = session.user.role === "admin";
    const isLecturer =
      session.user.role === "lecturer" &&
      typeof course.lecturer === "object" &&
      isUser(course.lecturer) &&
      (course.lecturer.id === session.user.id ||
        course.lecturer._id === session.user.id);

    const courseRepId =
      course.course_rep &&
      typeof course.course_rep === "object" &&
      isUser(course.course_rep)
        ? course.course_rep.id || course.course_rep._id
        : course.courseRep &&
          typeof course.courseRep === "object" &&
          isUser(course.courseRep)
        ? course.courseRep.id || course.courseRep._id
        : null;

    const isCourseRep =
      session.user.role === "course_rep" && courseRepId === session.user.id;

    return isAdmin || isLecturer || isCourseRep;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (error || !course) {
    return (
      <Layout>
        <Alert variant="destructive">
          <AlertDescription>{error || "Course not found"}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="link" asChild className="pl-0">
            <Link href="/courses">&larr; Back to courses</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{course.title} | Campus Podcast System</title>
      </Head>

      <div className="mb-4">
        <Button variant="link" asChild className="pl-0">
          <Link href="/courses">&larr; Back to courses</Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-semibold">{course.title}</h1>
              <p className="text-primary text-lg">{course.code}</p>
            </div>

            {canEdit() && (
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`/dashboard/manage/courses/edit/${
                      course.id || course._id
                    }`}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteModalOpen(true)}
                >
                  <Trash className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          {course.description && (
            <p className="text-muted-foreground mt-4">{course.description}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium mb-2 flex items-center">
                <User className="h-5 w-5 mr-1 text-muted-foreground" />
                Lecturer
              </h3>
              <p>
                {isUser(course.lecturer) ? course.lecturer.name : "Unknown"}
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium mb-2 flex items-center">
                <Users className="h-5 w-5 mr-1 text-muted-foreground" />
                Students
              </h3>
              <p>
                {Array.isArray(course.students) ? course.students.length : 0}{" "}
                enrolled
              </p>
            </div>
          </div>

          {canRecord() && (
            <div className="flex flex-wrap gap-2 mt-6">
              <CourseLiveButton
                courseId={course.id || course._id}
                courseTitle={course.title}
              />
              <Button asChild>
                <Link
                  href={`/podcasts/record?course=${course.id || course._id}`}
                >
                  <Mic className="h-4 w-4 mr-1" />
                  Record Session
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link
                  href={`/podcasts/upload?course=${course.id || course._id}`}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload Recording
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-4">Course Podcasts</h2>
        <PodcastList
          podcasts={podcasts}
          emptyMessage="No podcasts available for this course yet."
        />
      </div>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this course? This will also delete
              all associated podcasts. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
