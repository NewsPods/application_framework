import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import MobileNav from './MobileNav';
import AudioPlayer from '../audio/AudioPlayer';
import { useAtom } from 'jotai';
import { currentTrackAtom } from '../../store/atoms/audioAtoms';

export default function Layout(){
    const [currentTrack] = useAtom(currentTrackAtom);
    return (
        <div className="min-h-screen bg-paper">
            <Header />
            <main className="pt-20 pb-24 px-4 max-w-lg mx-auto">
                <Outlet />
            </main>
            {currentTrack && <AudioPlayer />}
            <MobileNav />
        </div>
    );
}