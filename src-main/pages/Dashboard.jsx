import React from 'react';
import { useAtom } from 'jotai';
import { episodesAtom, currentTrackAtom } from '../store/atoms/audioAtoms';
import { selectedCategoriesAtom } from '../store/atoms/newsAtoms';
import NewsCard from '../components/news/NewsCard';

const Dashboard = () => {
  const [episodes] = useAtom(episodesAtom);
  const [, setCurrentTrack] = useAtom(currentTrackAtom);
  const [selectedCategories] = useAtom(selectedCategoriesAtom);

  // Mock data - replace with actual API calls
  const mockEpisodes = [
    {
      id: 1,
      title: "Tech Giants Face New Regulations",
      source: "Reuters, The Guardian",
      category: "Technology",
      duration: 420,
      publishedAt: new Date(),
      speakers: "multi",
      isNew: true
    },
    {
      id: 2,
      title: "Climate Summit Reaches Historic Agreement",
      source: "Times, BBC",
      category: "Politics",
      duration: 360,
      publishedAt: new Date(Date.now() - 86400000),
      speakers: "single",
      isNew: false
    }
  ];

  const playEpisode = (episode) => {
    setCurrentTrack(episode);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Good morning! 👋</h2>
        <p className="text-primary-100 mb-4">
          Your daily news digest is ready. 3 new episodes available.
        </p>
        <div className="flex space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold">12m</div>
            <div className="text-xs text-primary-100">Today's content</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">3</div>
            <div className="text-xs text-primary-100">New episodes</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button className="flex items-center space-x-3 p-4 bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <svg className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">Continue</div>
            <div className="text-xs text-gray-500">Where you left off</div>
          </div>
        </button>

        <button className="flex items-center space-x-3 p-4 bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
            <svg className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">Schedule</div>
            <div className="text-xs text-gray-500">Set listening time</div>
          </div>
        </button>
      </div>

      {/* Today's Episodes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Today's Episodes
          </h3>
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            See all
          </button>
        </div>

        {mockEpisodes.map((episode) => (
          <NewsCard 
            key={episode.id} 
            episode={episode} 
            onPlay={() => playEpisode(episode)}
          />
        ))}
      </div>

      {/* Categories */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Your Categories
        </h3>
        <div className="flex flex-wrap gap-2">
          {selectedCategories.map((category) => (
            <span 
              key={category}
              className="px-3 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium"
            >
              {category}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
