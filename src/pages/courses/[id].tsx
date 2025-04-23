// pages/courses/[id].tsx
import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getSession, useSession } from 'next-auth/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import PodcastList from '../../components/podcast/PodcastList';
import {
  MicrophoneIcon,
  ArrowUpTrayIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { ICourse, IPodcast, IUser } from '../../types';
import Button from '@/src/components/ui/Button';
import Modal from '@/src/components/ui/Modal';

const CourseDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  const [course, setCourse] = useState<ICourse | null>(null);
  const [podcasts, setPodcasts] = useState<IPodcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Type guards
  const isUser = (obj: any): obj is IUser => {
    return obj && typeof obj === 'object' && 'name' in obj;
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
        setError(data.message || 'Failed to load course');
      }
    } catch (error) {
      setError('Failed to load course');
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!course) return;

    try {
      setIsDeleting(true);
      // Use either id or _id depending on what's available
      const courseId = course.id || course._id;

      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        router.push('/courses');
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

  // Check if user can edit this course
  const canEdit = () => {
    if (!session || !course) return false;

    const isAdmin = session.user.role === 'admin';
    const isLecturer = session.user.role === 'lecturer' &&
      typeof course.lecturer === 'object' &&
      isUser(course.lecturer) &&
      (course.lecturer.id === session.user.id || course.lecturer._id === session.user.id);

    return isAdmin || isLecturer;
  };

  // Check if user can record for this course
  const canRecord = () => {
    if (!session || !course) return false;

    const isAdmin = session.user.role === 'admin';
    const isLecturer = session.user.role === 'lecturer' &&
      typeof course.lecturer === 'object' &&
      isUser(course.lecturer) &&
      (course.lecturer.id === session.user.id || course.lecturer._id === session.user.id);

    // Support both course_rep and courseRep properties
    const courseRepId =
      (course.course_rep && typeof course.course_rep === 'object' && isUser(course.course_rep))
        ? course.course_rep.id || course.course_rep._id
        : (course.courseRep && typeof course.courseRep === 'object' && isUser(course.courseRep))
          ? course.courseRep.id || course.courseRep._id
          : null;

    const isCourseRep = session.user.role === 'course_rep' &&
      courseRepId === session.user.id;

    return isAdmin || isLecturer || isCourseRep;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p>Loading course...</p>
        </div>
      </Layout>
    );
  }

  if (error || !course) {
    return (
      <Layout>
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-sm text-red-700">{error || 'Course not found'}</p>
        </div>
        <div className="mt-4">
          <Link href="/courses" className="text-primary-600 hover:text-primary-700">
            &larr; Back to courses
          </Link>
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
        <Link href="/courses" className="text-primary-600 hover:text-primary-700">
          &larr; Back to courses
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-semibold">{course.title}</h1>
              <p className="text-primary-600 text-lg">{course.code}</p>
            </div>

            {canEdit() && (
              <div className="flex space-x-2">
                <Link href={`/dashboard/manage/courses/edit/${course.id || course._id}`}>
                  <Button variant="outline" size="sm">
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setDeleteModalOpen(true)}
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          {course.description && (
            <p className="text-gray-600 mt-4">{course.description}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-2 flex items-center">
                <UserIcon className="h-5 w-5 mr-1 text-gray-500" />
                Lecturer
              </h3>
              <p className="text-gray-700">
                {isUser(course.lecturer) ? course.lecturer.name : 'Unknown'}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-2 flex items-center">
                <UserGroupIcon className="h-5 w-5 mr-1 text-gray-500" />
                Students
              </h3>
              <p className="text-gray-700">
                {Array.isArray(course.students) ? course.students.length : 0} enrolled
              </p>
            </div>
          </div>

          {canRecord() && (
            <div className="flex space-x-2 mt-6">
              <Link href={`/podcasts/record?course=${course.id || course._id}`}>
                <Button>
                  <MicrophoneIcon className="h-5 w-5 mr-1" />
                  Record Session
                </Button>
              </Link>
              <Link href={`/podcasts/upload?course=${course.id || course._id}`}>
                <Button variant="outline">
                  <ArrowUpTrayIcon className="h-5 w-5 mr-1" />
                  Upload Recording
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Course Podcasts</h2>
        <PodcastList
          podcasts={podcasts}
          emptyMessage="No podcasts available for this course yet."
        />
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Course"
      >
        <div>
          <p className="mb-4">
            Are you sure you want to delete this course? This will also delete all associated podcasts. This action cannot be undone.
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

  return {
    props: {},
  };
};

export default CourseDetailPage;
