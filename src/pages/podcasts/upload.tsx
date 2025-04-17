import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getSession, useSession } from 'next-auth/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import UploadForm from '../../components/podcast/UploadForm';
import { ICourse } from '../../types';

const UploadPodcastPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

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

  const handleUploadComplete = async (file: File, metadata: any) => {
    try {
      setUploading(true);

      // Create a FormData object to upload the audio file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', metadata.title);
      formData.append('description', metadata.description || '');
      formData.append('course', metadata.course);

      // Upload the audio file
      const uploadResponse = await fetch('/api/podcasts/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (uploadData.success) {
        router.push(`/podcasts/${uploadData.data._id}`);
      } else {
        setError(uploadData.message || 'Failed to upload podcast');
      }
    } catch (error) {
      setError('Failed to upload podcast');
      console.error('Error uploading podcast:', error);
    } finally {
      setUploading(false);
    }
  };

  // Check if user has permission to upload
  const canUpload = () => {
    if (!session) return false;
    return ['admin', 'lecturer', 'course_rep'].includes(session.user.role);
  };

  if (!canUpload()) {
    return (
      <Layout>
        <Head>
          <title>Upload Podcast | Campus Podcast System</title>
        </Head>

        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-sm text-red-700">
            You do not have permission to upload podcasts.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Upload Podcast | Campus Podcast System</title>
      </Head>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Upload Podcast</h1>
        <p className="text-gray-600">
          Upload a pre-recorded lecture session and make it available for students.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <UploadForm
          onUploadComplete={handleUploadComplete}
          courses={courses}
        />
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

  // Only allow certain roles to access this page
  if (!['admin', 'lecturer', 'course_rep'].includes(session.user.role)) {
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

export default UploadPodcastPage;
