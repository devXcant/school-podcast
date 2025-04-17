import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpenIcon, MicrophoneIcon } from '@heroicons/react/24/outline';

interface Stats {
  totalCourses: number;
  totalPodcasts: number;
  recentPodcasts: any[];
  courses: any[];
}

const CourseRepDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalCourses: 0,
    totalPodcasts: 0,
    recentPodcasts: [],
    courses: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/course-rep-stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching course rep stats:', error);
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
      <h1 className="text-2xl font-semibold mb-6">Course Representative Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <BookOpenIcon className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500">Your Courses</h2>
            <p className="text-2xl font-semibold">{stats.totalCourses}</p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 flex items-center">
          <div className="rounded-full bg-purple-100 p-3 mr-4">
            <MicrophoneIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500">Your Recordings</h2>
            <p className="text-2xl font-semibold">{stats.totalPodcasts}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Your Courses</h2>
            <Link href="/courses" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>

          {stats.courses.length > 0 ? (
            <div className="space-y-4">
              {stats.courses.slice(0, 5).map((course) => (
                <Link href={`/courses/${course._id}`} key={course._id} className="block">
                  <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <h3 className="font-medium">{course.title}</h3>
                    <p className="text-sm text-gray-500">{course.code}</p>
                    <div className="flex items-center mt-2">
                      <span className="text-xs text-gray-500">
                        Lecturer: {typeof course.lecturer === 'object' ? course.lecturer.name : 'N/A'}
                      </span>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="text-xs text-gray-500">
                        {course.podcasts?.length || 0} Podcasts
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">No courses found.</p>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/podcasts/record" className="bg-gray-50 hover:bg-gray-100 p-4 rounded-lg">
              <h3 className="font-medium">Record Session</h3>
              <p className="text-sm text-gray-500">Start a new recording</p>
            </Link>
            <Link href="/podcasts/upload" className="bg-gray-50 hover:bg-gray-100 p-4 rounded-lg">
              <h3 className="font-medium">Upload Podcast</h3>
              <p className="text-sm text-gray-500">Upload an existing recording</p>
            </Link>
            <Link href="/podcasts" className="bg-gray-50 hover:bg-gray-100 p-4 rounded-lg">
              <h3 className="font-medium">Manage Podcasts</h3>
              <p className="text-sm text-gray-500">View and edit recordings</p>
            </Link>
            <Link href="/courses" className="bg-gray-50 hover:bg-gray-100 p-4 rounded-lg">
              <h3 className="font-medium">View Courses</h3>
              <p className="text-sm text-gray-500">Access your courses</p>
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Your Recent Recordings</h2>
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
                    Views
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
                      {typeof podcast.course === 'object' ? podcast.course.title : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {podcast.viewCount}
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
          <p className="text-center text-gray-500 py-4">No recent recordings found.</p>
        )}
      </div>
    </div>
  );
};

export default CourseRepDashboard;
