// pages/dashboard/manage/courses.tsx
import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getSession, useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../../components/layout/Layout';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { ICourse } from '../../../types';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const CourseManagementPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<ICourse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);

      // For admin, fetch all courses. For lecturers, fetch only their courses
      const url = session?.user.role === 'admin'
        ? '/api/courses'
        : `/api/courses?lecturer=${session?.user.id}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setCourses(data.data);
      } else {
        setError(data.message || 'Failed to load courses');
      }
    } catch (error) {
      setError('Failed to load courses');
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCourse) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/courses/${selectedCourse._id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setDeleteModalOpen(false);
        setSelectedCourse(null);
        fetchCourses();
      } else {
        setError(data.message || 'Failed to delete course');
        setDeleteModalOpen(false);
      }
    } catch (error) {
      setError('Failed to delete course');
      console.error('Error deleting course:', error);
      setDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Only admin and lecturers can manage courses
  const canManageCourses = () => {
    if (!session) return false;
    return ['admin', 'lecturer'].includes(session.user.role);
  };

  // Only admin or the lecturer who created the course can edit/delete it
  const canEditCourse = (course: ICourse) => {
    if (!session) return false;

    const isAdmin = session.user.role === 'admin';
    const isLecturer = session.user.role === 'lecturer' &&
      typeof course.lecturer === 'object' &&
      course.lecturer._id === session.user.id;

    return isAdmin || isLecturer;
  };

  if (!canManageCourses()) {
    return (
      <Layout>
        <Head>
          <title>Course Management | Campus Podcast System</title>
        </Head>

        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-sm text-red-700">
            You do not have permission to manage courses.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Course Management | Campus Podcast System</title>
      </Head>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Course Management</h1>
        <Link href="/dashboard/manage/courses/create">
          <Button>
            <PlusIcon className="h-5 w-5 mr-1" />
            Create Course
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div>Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500">No courses found.</p>
          <Link href="/dashboard/manage/courses/create" className="mt-4 inline-block text-primary-600 hover:text-primary-700">
            Create your first course
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul role="list" className="divide-y divide-gray-200">
            {courses.map((course) => (
              <li key={course._id.toString()}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-primary-600">
                        <Link href={`/courses/${course._id}`} className="hover:underline">
                          {course.title}
                        </Link>
                      </h3>
                      <p className="text-sm text-gray-500">{course.code}</p>
                    </div>

                    {canEditCourse(course) && (
                      <div className="flex space-x-2">
                        <Link href={`/dashboard/manage/courses/edit/${course._id}`}>
                          <Button variant="outline" size="sm">
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setSelectedCourse(course);
                            setDeleteModalOpen(true);
                          }}
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        Lecturer: {typeof course.lecturer === 'object' ? course.lecturer.name : 'Unknown'}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        {Array.isArray(course.students) ? course.students.length : 0} students
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {Array.isArray(course.podcasts) ? course.podcasts.length : 0} podcasts
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Course"
      >
        {selectedCourse && (
          <div>
            <p className="mb-4">
              Are you sure you want to delete the course &quot;{selectedCourse.title}&quot;? This will also delete all associated podcasts. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                isLoading={isDeleting}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
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

export default CourseManagementPage;
