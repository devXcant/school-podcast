"use client"

import { useState, useEffect } from "react"
import type { GetServerSideProps } from "next"
import { getSession, useSession } from "next-auth/react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import type { ICourse, IUser } from "../../../types"
import { Plus, Pencil, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Layout from "@/src/components/layout/Layout"

const CourseManagementPage = () => {
  const { data: session } = useSession()
  const router = useRouter()
  const [courses, setCourses] = useState<ICourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<ICourse | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Type guard for IUser
  const isUser = (obj: any): obj is IUser => {
    return obj && typeof obj === "object" && "name" in obj
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoading(true)

      // For admin, fetch all courses. For lecturers, fetch only their courses
      const url = session?.user.role === "admin" ? "/api/courses" : `/api/courses?lecturer=${session?.user.id}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setCourses(data.data)
      } else {
        setError(data.message || "Failed to load courses")
      }
    } catch (error) {
      setError("Failed to load courses")
      console.error("Error fetching courses:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedCourse) return

    try {
      setIsDeleting(true)
      const courseId = selectedCourse.id || selectedCourse._id
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        setDeleteModalOpen(false)
        setSelectedCourse(null)
        fetchCourses()
      } else {
        setError(data.message || "Failed to delete course")
        setDeleteModalOpen(false)
      }
    } catch (error) {
      setError("Failed to delete course")
      console.error("Error deleting course:", error)
      setDeleteModalOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  // Only admin and lecturers can manage courses
  const canManageCourses = () => {
    if (!session) return false
    return ["admin", "lecturer"].includes(session.user.role)
  }

  // Only admin or the lecturer who created the course can edit/delete it
  const canEditCourse = (course: ICourse) => {
    if (!session) return false

    const isAdmin = session.user.role === "admin"

    // Check if the lecturer matches the current user
    let isLecturer = false
    if (session.user.role === "lecturer" && typeof course.lecturer === "object" && isUser(course.lecturer)) {
      isLecturer = course.lecturer.id === session.user.id || course.lecturer._id === session.user.id
    }

    return isAdmin || isLecturer
  }

  if (!canManageCourses()) {
    return (
      <Layout>
        <Head>
          <title>Course Management | Campus Podcast System</title>
        </Head>

        <Alert variant="destructive">
          <AlertDescription>You do not have permission to manage courses.</AlertDescription>
        </Alert>
      </Layout>
    )
  }

  return (
    <Layout>
      <Head>
        <title>Course Management | Campus Podcast System</title>
      </Head>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Course Management</h1>
        <Button asChild>
          <Link href="/dashboard/manage/courses/create">
            <Plus className="h-4 w-4 mr-1" />
            Create Course
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No courses found.</p>
            <Link href="/dashboard/manage/courses/create" className="mt-4 inline-block text-primary hover:underline">
              Create your first course
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <ul className="divide-y divide-border">
            {courses.map((course) => (
              <li key={(course.id || course._id || "").toString()}>
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-primary">
                        <Link href={`/courses/${course.id || course._id}`} className="hover:underline">
                          {course.title}
                        </Link>
                      </h3>
                      <p className="text-sm text-muted-foreground">{course.code}</p>
                    </div>

                    {canEditCourse(course) && (
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/manage/courses/edit/${course.id || course._id}`}>
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedCourse(course)
                            setDeleteModalOpen(true)
                          }}
                        >
                          <Trash className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-muted-foreground">
                        Lecturer:{" "}
                        {typeof course.lecturer === "object" && isUser(course.lecturer)
                          ? course.lecturer.name
                          : "Unknown"}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-muted-foreground sm:mt-0 sm:ml-6">
                        {Array.isArray(course.students) ? course.students.length : 0} students
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm sm:mt-0">
                      <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                        {Array.isArray(course.podcasts) ? course.podcasts.length : 0} podcasts
                      </Badge>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              {selectedCourse && (
                <>
                  Are you sure you want to delete the course &quot;{selectedCourse.title}&quot;? This will also delete
                  all associated podcasts. This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
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
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)

  if (!session) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    }
  }

  // Only allow admin and lecturers to access this page
  if (!["admin", "lecturer"].includes(session.user.role)) {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}

export default CourseManagementPage
