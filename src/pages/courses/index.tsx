import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getSession, useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';
import { PlusIcon } from '@heroicons/react/24/outline';
import { ICourse } from '../../types';

const CoursesPage = () => {
  const { data: session } = useSession();
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/courses');
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

  // Check if user can create courses
  const canCreateCourse = () => {
    if (!session) return false;
    return ['admin', 'lecturer'].includes(session.user.role);
  };

  return (
    <Layout>
      <Head>
        <title>Courses | Campus Podcast System</title>
      </Head>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Courses</h1>
        {canCreateCourse() && (
          <Link href="/dashboard/manage/courses/create">
            <Button>
              <PlusIcon className="h-5 w-5 mr-1" />
              Create Course
            </Button>
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="p-4">
                <div className="h-6 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
              <div className="bg-gray-50 px-4 py-3">
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500">No courses found.</p>
          {canCreateCourse() && (
            <Link href="/dashboard/manage/courses/create" className="mt-4 inline-block text-primary-600 hover:text-primary-700">
              Create your first course
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              href={`/courses/${course._id}`}
              key={course._id.toString()}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-4">
                <h2 className="text-lg font-medium text-gray-900">{course.title}</h2>
                <p className="text-sm text-primary-600 mb-2">{course.code}</p>
                {course.description && (
                  <p className="text-sm text-gray-500 line-clamp-3">{course.description}</p>
                )}
              </div>
              <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  Lecturer: {typeof course.lecturer === 'object' ? course.lecturer.name : 'Unknown'}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                  {Array.isArray(course.podcasts) ? course.podcasts.length : 0} podcasts
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
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

  return {
    props: {},
  };
};

export default CoursesPage;
