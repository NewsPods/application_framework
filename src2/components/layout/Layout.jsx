import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAtom } from 'jotai';
import Header from './Header';
import MobileNav from './MobileNav';
import { currentTrackAtom } from '../../store/atoms/audioAtoms';
import AudioPlayer from '../audio/AudioPlayer.jsx';

const Layout = () => {
  const [currentTrack] = useAtom(currentTrackAtom);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <Header />
      <main className="pt-16 pb-20 px-4 max-w-lg mx-auto">
        <Outlet />
      </main>
      {currentTrack && (
        <div className="fixed bottom-16 left-0 right-0 z-40">
          <AudioPlayer />
        </div>
      )}
      <MobileNav />
    </div>
  );
};

export default Layout;
