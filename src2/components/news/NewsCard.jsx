import React from 'react';
import { Play, Clock, Users, User, BookmarkPlus } from 'lucide-react';

const NewsCard = ({ episode, onPlay }) => {
  const formatDuration = (seconds) => {
    const mins = Math.floor((seconds || 0) / 60);
    return `${mins}m`;
  };

  const formatPublishTime = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diff = now - d;
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          {episode.isNew && (
            <span className="inline-block px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-medium rounded-full mb-2">
              New
            </span>
          )}
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 leading-tight">
            {episode.title}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {episode.source}
          </p>
        </div>

        <button className="ml-3 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label="Save">
          <BookmarkPlus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{formatDuration(episode.duration)}</span>
          </span>
          <span className="flex items-center space-x-1">
            {episode.speakers === 'multi' ? 
              <Users className="w-4 h-4" /> : 
              <User className="w-4 h-4" />
            }
            <span>{episode.speakers === 'multi' ? 'Conversation' : 'Single voice'}</span>
          </span>
          <span>{formatPublishTime(episode.publishedAt)}</span>
        </div>

        <button 
          onClick={onPlay}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Play className="w-4 h-4" />
          <span>Play</span>
        </button>
      </div>
    </div>
  );
};

export default NewsCard;
