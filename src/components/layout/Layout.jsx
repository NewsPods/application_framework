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
        // 1. Use h-full and flex-col to fill the locked body
        <div className="h-full flex flex-col bg-paper transition-colors overflow-hidden">

            {/* Header stays fixed at top visually, but we don't need 'fixed' CSS if using flex */}
            <div className="z-50 shrink-0">
                <Header />
            </div>

            {/* 2. MAIN CONTENT: This is the ONLY thing that scrolls now */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pt-20 pb-32 px-4 w-full max-w-lg mx-auto">
                <Outlet />
            </main>

            {/* Players/Nav stay fixed or flexed at bottom */}
            <div className="z-50 shrink-0">
                {currentTrack && <AudioPlayer />}
                <MobileNav />
            </div>
        </div>
    );
}