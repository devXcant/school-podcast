import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import PodcastList from '../../components/podcast/PodcastList';
import Button from '../../components/ui/Button';
import { MicrophoneIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { IPodcast } from '../../types';

const PodcastsPage = () => {
  const [podcasts, setPodcasts] = useState<IPodcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { course } = router.query;

  useEffect(() => {
    fetchPodcasts();
  }, [course]);

  const fetchPodcasts = async () => {
    try {
      setLoading(true);

      const url = course
        ? `/api/podcasts?course=${course}`
        : '/api/podcasts';

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setPodcasts(data.data);
      } else {
        setError(data.message || 'Failed to load podcasts');
      }
    } catch (error) {
      setError('Failed to load podcasts');
      console.error('Error fetching podcasts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Podcasts | Campus Podcast System</title>
      </Head>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Podcasts</h1>
        <div className="flex space-x-2">
          <Link href="/podcasts/record">
            <Button>
              <MicrophoneIcon className="h-5 w-5 mr-1" />
              Record
            </Button>
          </Link>
          <Link href="/podcasts/upload">
            <Button variant="outline">
              <ArrowUpTrayIcon className="h-5 w-5 mr-1" />
              Upload
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <PodcastList
        podcasts={podcasts}
        loading={loading}
        emptyMessage="No podcasts found. Record or upload a podcast to get started."
      />
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

export default PodcastsPage;
