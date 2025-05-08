"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { GetServerSideProps } from "next"
import { getSession, useSession } from "next-auth/react"
import Head from "next/head"
import { useRouter } from "next/router"
import Link from "next/link"
import type { IUser } from "../../../../types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Layout from "@/src/components/layout/Layout"

const CreateCoursePage = () => {
  const { data: session } = useSession()
  const router = useRouter()

  const [courseData, setCourseData] = useState({
    code: "",
    title: "",
    description: "",
    lecturer: "",
    courseRep: "", // MongoDB style
    course_rep: "", // Supabase style
    students: [] as string[],
  })

  const [lecturers, setLecturers] = useState<IUser[]>([])
  const [students, setStudents] = useState<IUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchUsers()

    // If current user is a lecturer, set them as the default lecturer
    if (session?.user.role === "lecturer") {
      setCourseData((prev) => ({
        ...prev,
        lecturer: session.user.id,
      }))
    }
  }, [session])

  const fetchUsers = async () => {
    try {
      setLoading(true)

      // Fetch lecturers
      const lecturersResponse = await fetch("/api/users?role=lecturer")
      const lecturersData = await lecturersResponse.json()

      if (lecturersData.success) {
        setLecturers(lecturersData.data)
      }

      // Fetch students
      const studentsResponse = await fetch("/api/users?role=student,course_rep")
      const studentsData = await studentsResponse.json()

      if (studentsData.success) {
        setStudents(studentsData.data)
      }
    } catch (error) {
      setError("Failed to load users")
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    // When courseRep is updated, also update course_rep
    if (name === "courseRep") {
      setCourseData({ ...courseData, courseRep: value, course_rep: value })
    } else {
      setCourseData({ ...courseData, [name]: value })
    }
  }

  const handleStudentSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options
    const selectedStudents: string[] = []

    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedStudents.push(options[i].value)
      }
    }

    setCourseData({ ...courseData, students: selectedStudents })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!courseData.code || !courseData.title || !courseData.lecturer) {
      setError("Course code, title, and lecturer are required")
      return
    }

    try {
      setIsSubmitting(true)
      setError("")

      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user?.id}`,
        },
        body: JSON.stringify(courseData),
      })

      const data = await response.json()

      if (data.success) {
        const courseId = data.data.id || data.data._id
        router.push(`/courses/${courseId}`)
      } else {
        setError(data.message || "Failed to create course")
      }
    } catch (error) {
      setError("Failed to create course")
      console.error("Error creating course:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Only admin and lecturers can create courses
  const canCreateCourse = () => {
    if (!session) return false
    return ["admin", "lecturer"].includes(session.user.role)
  }

  if (!canCreateCourse()) {
    return (
      <Layout>
        <Head>
          <title>Create Course | Campus Podcast System</title>
        </Head>

        <Alert variant="destructive">
          <AlertDescription>You do not have permission to create courses.</AlertDescription>
        </Alert>
      </Layout>
    )
  }

  return (
    <Layout>
      <Head>
        <title>Create Course | Campus Podcast System</title>
      </Head>

      <div className="mb-6">
        <Button variant="link" asChild className="pl-0">
          <Link href="/dashboard/manage/courses">&larr; Back to course management</Link>
        </Button>
        <h1 className="text-2xl font-semibold mt-2">Create New Course</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="code">Course Code</Label>
                <Input
                  id="code"
                  name="code"
                  value={courseData.code}
                  onChange={handleInputChange}
                  placeholder="e.g., CS101"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={courseData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Introduction to Computer Science"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Course Description</Label>
              <Textarea
                id="description"
                name="description"
                value={courseData.description}
                onChange={handleInputChange}
                placeholder="Provide a brief description of the course"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="lecturer">Lecturer</Label>
                <select
                  id="lecturer"
                  name="lecturer"
                  value={courseData.lecturer}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                  disabled={session?.user.role === "lecturer"} // Lecturers can only create courses for themselves
                >
                  <option value="">Select a lecturer</option>
                  {lecturers.map((lecturer) => (
                    <option
                      key={(lecturer.id || lecturer._id || "").toString()}
                      value={(lecturer.id || lecturer._id || "").toString()}
                    >
                      {lecturer.name} ({lecturer.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="courseRep">Course Representative</Label>
                <select
                  id="courseRep"
                  name="courseRep"
                  value={courseData.courseRep}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select a course rep (optional)</option>
                  {students
                    .filter((student) => student.role === "course_rep")
                    .map((student) => (
                      <option
                        key={(student.id || student._id || "").toString()}
                        value={(student.id || student._id || "").toString()}
                      >
                        {student.name} ({student.email})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="students">Students (Hold Ctrl/Cmd to select multiple)</Label>
              <select
                id="students"
                multiple
                value={courseData.students}
                onChange={handleStudentSelection}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                size={5}
              >
                {students.map((student) => (
                  <option
                    key={(student.id || student._id || "").toString()}
                    value={(student.id || student._id || "").toString()}
                  >
                    {student.name} ({student.email}) - {student.role === "course_rep" ? "Course Rep" : "Student"}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                Hold Ctrl (Windows) or Cmd (Mac) to select multiple students
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" type="button" asChild>
                <Link href="/dashboard/manage/courses">Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={!courseData.code || !courseData.title || !courseData.lecturer || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Course"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
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

export default CreateCoursePage
