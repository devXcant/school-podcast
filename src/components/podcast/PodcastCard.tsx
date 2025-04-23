import React from 'react';
import Link from 'next/link';
import { IPodcast, ICourse, IUser } from '../../types';
import { ClockIcon, UserIcon, BookOpenIcon } from '@heroicons/react/24/outline';

interface PodcastCardProps {
  podcast: IPodcast;
}

const PodcastCard: React.FC<PodcastCardProps> = ({ podcast }) => {
  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Type guards to check if the object is of type ICourse or IUser
  const isCourse = (obj: any): obj is ICourse => {
    return obj && typeof obj === 'object' && 'title' in obj;
  };

  const isUser = (obj: any): obj is IUser => {
    return obj && typeof obj === 'object' && 'name' in obj;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-primary-600 h-2"></div>
      <div className="p-4">
        <Link href={`/podcasts/${podcast.id}`} className="block">
          <h3 className="text-lg font-medium text-gray-900 mb-1">{podcast.title}</h3>
        </Link>
        {podcast.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{podcast.description}</p>
        )}
        <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-2">
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-1" />
            {podcast.duration ? formatDuration(podcast.duration) : 'N/A'}
          </div>
          <div className="flex items-center">
            <UserIcon className="h-4 w-4 mr-1" />
            {isUser(podcast.recorded_by_user)
              ? podcast.recorded_by_user.name
              : 'Unknown'}
          </div>
          <div className="flex items-center">
            <BookOpenIcon className="h-4 w-4 mr-1" />
            {isCourse(podcast.course)
              ? podcast.course.title
              : 'Unknown Course'}
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-4 py-2 flex justify-between items-center">
        <span className="text-xs text-gray-500">
          {new Date(podcast.created_at as Date).toLocaleDateString()}
        </span>
        <div className="flex space-x-2">
          {podcast.is_live && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
              Live
            </span>
          )}
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
            {podcast.view_count || 0} views
          </span>
        </div>
      </div>
    </div>
  );
};

export default PodcastCard;
