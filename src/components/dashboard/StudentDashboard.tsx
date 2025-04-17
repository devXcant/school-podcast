// components/dashboard/StudentDashboard.tsx (continued)
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpenIcon, MicrophoneIcon } from '@heroicons/react/24/outline';

interface Stats {
  totalCourses: number;
  recentPodcasts: any[];
  courses: any[];
}

const StudentDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalCourses: 0,
    recentPodcasts: [],
    courses: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/student-stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching student stats:', error);
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
      <h1 className="text-2xl font-semibold mb-6">Student Dashboard</h1>

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
            <h2 className="text-sm font-medium text-gray-500">Available Podcasts</h2>
            <p className="text-2xl font-semibold">{stats.recentPodcasts.length}</p>
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
            <h2 className="text-lg font-medium">Recent Podcasts</h2>
            <Link href="/podcasts" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>

          {stats.recentPodcasts.length > 0 ? (
            <div className="space-y-4">
              {stats.recentPodcasts.slice(0, 5).map((podcast) => (
                <Link href={`/podcasts/${podcast._id}`} key={podcast._id} className="block">
                  <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <h3 className="font-medium">{podcast.title}</h3>
                    <p className="text-sm text-gray-500">
                      {typeof podcast.course === 'object' ? podcast.course.title : 'N/A'}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className="text-xs text-gray-500">
                        By: {typeof podcast.recordedBy === 'object' ? podcast.recordedBy.name : 'N/A'}
                      </span>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="text-xs text-gray-500">
                        {new Date(podcast.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">No recent podcasts found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
