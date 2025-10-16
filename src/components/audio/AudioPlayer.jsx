import React, { useEffect, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';
import { currentTrackAtom, isPlayingAtom, playbackPositionAtom, playbackSpeedAtom } from '../../store/atoms/audioAtoms';

const AudioPlayer = () => {
    const navigate = useNavigate();
    const [currentTrack, setCurrentTrack] = useAtom(currentTrackAtom);
    const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom);
    const [position, setPosition] = useAtom(playbackPositionAtom);
    const [speed, setSpeed] = useAtom(playbackSpeedAtom);
    const [segIndex, setSegIndex] = useState(0);
    const [segPos, setSegPos] = useState(0);
    const timerRef = useRef(null);

    useEffect(() => { if (!currentTrack) return; setSegIndex(0); setSegPos(0); setPosition(0); }, [currentTrack]);

    useEffect(() => {
        if (!currentTrack) return;
        const segments = currentTrack.segments || [];
        if (!isPlaying || segments.length === 0) { clearInterval(timerRef.current); return; }

        timerRef.current = setInterval(() => {
            setSegPos(prev => {
                const seg = segments[segIndex]; if (!seg) return prev; const done = prev + 1 >= (seg.duration || 1);
                if (done) { // next segment or end
                    if (segIndex < segments.length - 1) { setSegIndex(i => i + 1); return 0; }
                    setIsPlaying(false); return prev;
                }
                return prev + 1;
            });
            setPosition(p => p + 1);
        }, 1000 / speed);

        return () => clearInterval(timerRef.current);
    }, [isPlaying, speed, segIndex, currentTrack]);

    if (!currentTrack) return null;
    const total = currentTrack.duration || 1; const pct = Math.min(100, (position / total) * 100);
    const currentSeg = currentTrack.segments?.[segIndex];

    const fmt = s => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

    const openNowPlaying = () => navigate('/app/now-playing');

    return (
        <div className="fixed bottom-16 left-0 right-0 z-40 px-4" onClick={openNowPlaying}>
            <div className="max-w-lg mx-auto cursor-pointer">
                <div className="bg-white/90 dark:bg-black/60 backdrop-blur-xl border rule rounded-t-2xl shadow-xl overflow-hidden">
                    <div className="h-1 bg-slate-200 dark:bg-amber-900/30">
                        <div className="h-full bg-slate-800 dark:bg-amber-400 transition-all" style={{ width: pct + '%' }} />
                    </div>

                    <div className="p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-slate-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <span className="text-xs kicker">NP</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="headline text-base truncate">{currentTrack?.title || 'Daily Episode'}</div>
                            {currentSeg?.type === 'article' && (
                                <div className="byline truncate">{currentSeg.title} • {currentSeg.section || currentSeg.newspaper}</div>
                            )}
                            {currentSeg?.type === 'transition' && (
                                <div className="byline italic">Transition…</div>
                            )}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-amber-200/70">{fmt(position)} / {fmt(total)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default AudioPlayer;