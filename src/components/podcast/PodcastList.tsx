// components/podcast/PodcastList.tsx
import React from 'react';
import { IPodcast } from '../../types';
import PodcastCard from './PodcastCard';

interface PodcastListProps {
  podcasts: IPodcast[];
  loading?: boolean;
  emptyMessage?: string;
}

const PodcastList: React.FC<PodcastListProps> = ({
  podcasts,
  loading = false,
  emptyMessage = 'No podcasts found'
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
            <div className="bg-gray-200 h-2"></div>
            <div className="p-4">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="flex flex-wrap gap-2 mt-4">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3">
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (podcasts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {podcasts.map((podcast) => (
        <PodcastCard
          key={(podcast.id || podcast._id || '').toString()}
          podcast={podcast}
        />
      ))}
    </div>
  );
};

export default PodcastList;
