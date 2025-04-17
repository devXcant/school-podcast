import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { UserIcon, BookOpenIcon, MicrophoneIcon } from '@heroicons/react/24/outline';

interface Stats {
  totalUsers: number;
  totalCourses: number;
  totalPodcasts: number;
  recentPodcasts: any[];
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalCourses: 0,
    totalPodcasts: 0,
    recentPodcasts: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/admin-stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div>Loading dashboard stats...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <UserIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500">Total Users</h2>
            <p className="text-2xl font-semibold">{stats.totalUsers}</p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <BookOpenIcon className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500">Total Courses</h2>
            <p className="text-2xl font-semibold">{stats.totalCourses}</p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 flex items-center">
          <div className="rounded-full bg-purple-100 p-3 mr-4">
            <MicrophoneIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500">Total Podcasts</h2>
            <p className="text-2xl font-semibold">{stats.totalPodcasts}</p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Recent Podcasts</h2>
          <Link href="/podcasts" className="text-sm text-primary-600 hover:text-primary-700">
            View all
          </Link>
        </div>

        {stats.recentPodcasts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    By
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentPodcasts.map((podcast) => (
                  <tr key={podcast._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/podcasts/${podcast._id}`} className="text-primary-600 hover:text-primary-700">
                        {podcast.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {podcast.course?.title || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {podcast.recordedBy?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(podcast.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4">No recent podcasts found.</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/dashboard/manage/users/create" className="bg-gray-50 hover:bg-gray-100 p-4 rounded-lg">
              <h3 className="font-medium">Create User</h3>
              <p className="text-sm text-gray-500">Add a new user to the system</p>
            </Link>
            <Link href="/dashboard/manage/courses/create" className="bg-gray-50 hover:bg-gray-100 p-4 rounded-lg">
              <h3 className="font-medium">Create Course</h3>
              <p className="text-sm text-gray-500">Add a new course</p>
            </Link>
            <Link href="/podcasts/record" className="bg-gray-50 hover:bg-gray-100 p-4 rounded-lg">
              <h3 className="font-medium">Record Session</h3>
              <p className="text-sm text-gray-500">Start a new recording</p>
            </Link>
            <Link href="/podcasts/upload" className="bg-gray-50 hover:bg-gray-100 p-4 rounded-lg">
              <h3 className="font-medium">Upload Podcast</h3>
              <p className="text-sm text-gray-500">Upload an existing recording</p>
            </Link>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">System Status</h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Database Connection</span>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                Connected
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Storage Status</span>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                Available
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Last Backup</span>
              <span className="text-sm text-gray-700">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
