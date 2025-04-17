import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getSession, useSession } from 'next-auth/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import LiveRecorder from '../../components/podcast/LiveRecorder';
import { ICourse } from '../../types';

const RecordPodcastPage = () => {
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

  const handleRecordingComplete = async (audioBlob: Blob, metadata: any) => {
    try {
      setUploading(true);

      // Create a FormData object to upload the audio file
      const formData = new FormData();
      formData.append('file', audioBlob, `${metadata.title.replace(/\s+/g, '_')}.wav`);
      formData.append('title', metadata.title);
      formData.append('description', metadata.description || '');
      formData.append('course', metadata.course);
      formData.append('duration', metadata.duration.toString());

      // Upload the audio file
      const uploadResponse = await fetch('/api/podcasts/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (uploadData.success) {
        router.push(`/podcasts/${uploadData.data._id}`);
      } else {
        setError(uploadData.message || 'Failed to upload recording');
      }
    } catch (error) {
      setError('Failed to upload recording');
      console.error('Error uploading recording:', error);
    } finally {
      setUploading(false);
    }
  };

  // Check if user has permission to record
  const canRecord = () => {
    if (!session) return false;
    return ['admin', 'lecturer', 'course_rep'].includes(session.user.role);
  };

  if (!canRecord()) {
    return (
      <Layout>
        <Head>
          <title>Record Session | Campus Podcast System</title>
        </Head>

        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-sm text-red-700">
            You do not have permission to record sessions.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Record Session | Campus Podcast System</title>
      </Head>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Record Lecture Session</h1>
        <p className="text-gray-600">
          Record a live lecture session and make it available for students.
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
        <LiveRecorder
          onRecordingComplete={handleRecordingComplete}
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

export default RecordPodcastPage;
