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
        <div className="h-full flex flex-col bg-paper transition-colors overflow-hidden">

            <div className="z-50 shrink-0">
                <Header />
            </div>

            {/* CHANGE: pt-20 -> pt-[calc(5rem+env(safe-area-inset-top))]
               This ensures content always starts exactly below the header,
               regardless of how tall the notch is.
            */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pt-[calc(5rem+env(safe-area-inset-top))] pb-[calc(9rem+env(safe-area-inset-bottom))] px-4 w-full max-w-lg mx-auto">
                <Outlet />
            </main>

            <div className="z-50 shrink-0">
                {currentTrack && <AudioPlayer />}
                <MobileNav />
            </div>
        </div>
    );
}