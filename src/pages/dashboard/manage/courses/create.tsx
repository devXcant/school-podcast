// pages/dashboard/manage/courses/create.tsx
import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getSession, useSession } from 'next-auth/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../../components/layout/Layout';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import { IUser } from '../../../../types';

const CreateCoursePage = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const [courseData, setCourseData] = useState({
    code: '',
    title: '',
    description: '',
    lecturer: '',
    courseRep: '',
    students: [] as string[]
  });

  const [lecturers, setLecturers] = useState<IUser[]>([]);
  const [students, setStudents] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();

    // If current user is a lecturer, set them as the default lecturer
    if (session?.user.role === 'lecturer') {
      setCourseData(prev => ({
        ...prev,
        lecturer: session.user.id
      }));
    }
  }, [session]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Fetch lecturers
      const lecturersResponse = await fetch('/api/users?role=lecturer');
      const lecturersData = await lecturersResponse.json();

      if (lecturersData.success) {
        setLecturers(lecturersData.data);
      }

      // Fetch students
      const studentsResponse = await fetch('/api/users?role=student,course_rep');
      const studentsData = await studentsResponse.json();

      if (studentsData.success) {
        setStudents(studentsData.data);
      }
    } catch (error) {
      setError('Failed to load users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCourseData({ ...courseData, [name]: value });
  };

  const handleStudentSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selectedStudents: string[] = [];

    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedStudents.push(options[i].value);
      }
    }

    setCourseData({ ...courseData, students: selectedStudents });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!courseData.code || !courseData.title || !courseData.lecturer) {
      setError('Course code, title, and lecturer are required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/courses/${data.data._id}`);
      } else {
        setError(data.message || 'Failed to create course');
      }
    } catch (error) {
      setError('Failed to create course');
      console.error('Error creating course:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only admin and lecturers can create courses
  const canCreateCourse = () => {
    if (!session) return false;
    return ['admin', 'lecturer'].includes(session.user.role);
  };

  if (!canCreateCourse()) {
    return (
      <Layout>
        <Head>
          <title>Create Course | Campus Podcast System</title>
        </Head>

        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-sm text-red-700">
            You do not have permission to create courses.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Create Course | Campus Podcast System</title>
      </Head>

      <div className="mb-6">
        <Link href="/dashboard/manage/courses" className="text-primary-600 hover:text-primary-700">
          &larr; Back to course management
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Create New Course</h1>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Course Code"
                name="code"
                value={courseData.code}
                onChange={handleInputChange}
                placeholder="e.g., CS101"
                required
              />

              <Input
                label="Course Title"
                name="title"
                value={courseData.title}
                onChange={handleInputChange}
                placeholder="e.g., Introduction to Computer Science"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Description
              </label>
              <textarea
                name="description"
                value={courseData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Provide a brief description of the course"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lecturer
                </label>
                <select
                  name="lecturer"
                  value={courseData.lecturer}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                  required
                  disabled={session?.user.role === 'lecturer'} // Lecturers can only create courses for themselves
                >
                  <option value="">Select a lecturer</option>
                  {lecturers.map((lecturer) => (
                    <option key={lecturer._id.toString()} value={lecturer._id.toString()}>
                      {lecturer.name} ({lecturer.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Representative
                </label>
                <select
                  name="courseRep"
                  value={courseData.courseRep}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Select a course rep (optional)</option>
                  {students
                    .filter(student => student.role === 'course_rep')
                    .map((student) => (
                      <option key={student._id.toString()} value={student._id.toString()}>
                        {student.name} ({student.email})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Students (Hold Ctrl/Cmd to select multiple)
              </label>
              <select
                multiple
                value={courseData.students}
                onChange={handleStudentSelection}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                size={5}
              >
                {students.map((student) => (
                  <option key={student._id.toString()} value={student._id.toString()}>
                    {student.name} ({student.email}) - {student.role === 'course_rep' ? 'Course Rep' : 'Student'}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Hold Ctrl (Windows) or Cmd (Mac) to select multiple students
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Link href="/dashboard/manage/courses">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={!courseData.code || !courseData.title || !courseData.lecturer}
              >
                Create Course
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  // Only allow admin and lecturers to access this page
  if (!['admin', 'lecturer'].includes(session.user.role)) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

export default CreateCoursePage;
