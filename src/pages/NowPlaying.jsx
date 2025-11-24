import React, { useMemo } from 'react';
import { useAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, FastForward, Rewind, ChevronDown } from 'lucide-react';
import {
    currentTrackAtom,
    isPlayingAtom,
    playbackPositionAtom,
    playbackSpeedAtom
} from '../store/atoms/audioAtoms';

export default function NowPlaying() {
    const nav = useNavigate();
    const [track] = useAtom(currentTrackAtom);
    const [pos, setPos] = useAtom(playbackPositionAtom);
    const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom);
    const [speed, setSpeed] = useAtom(playbackSpeedAtom);

    // 1. Handle Empty State
    if (!track) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
                <div className="headline text-xl">Nothing in queue</div>
                <button
                    onClick={() => nav('/app')}
                    className="px-6 py-3 bg-slate-900 text-white dark:bg-[#c05b4d] rounded-lg font-bold"
                >
                    Go to Feed
                </button>
            </div>
        );
    }

    // 2. Determine if we have Real Data yet
    // We assume '1' or '0' are placeholders. Real HLS streams are usually longer.
    const realDuration = track.duration || 0;
    const isMetadataLoaded = realDuration > 1;

    // 3. Smart Segmentation (Only runs if we have data)
    const segmentsWithTiming = useMemo(() => {
        if (!track.segments) return [];

        // If not loaded, just return raw segments without timing logic to prevent "0m" glitches
        if (!isMetadataLoaded) return track.segments.map((s, i) => ({ ...s, index: i, start: 0, end: 0 }));

        // A. Sum of the "Mock"/DB durations
        const estimatedTotal = track.segments.reduce((acc, s) => acc + (s.duration || 0), 0);

        // B. Calculate Ratio (Real Audio Length / Mock DB Length)
        const scaleFactor = estimatedTotal > 0 ? (realDuration / estimatedTotal) : 1;

        let accumulated = 0;
        return track.segments.map((seg, index) => {
            const scaledDur = (seg.duration || 0) * scaleFactor;
            const start = accumulated;
            const end = accumulated + scaledDur;
            accumulated = end;

            return {
                ...seg,
                start,
                end,
                index,
                // We display the SCALED duration, so it matches the real audio file
                displayDuration: Math.round(scaledDur)
            };
        });
    }, [track, realDuration, isMetadataLoaded]);

    // 4. Find Active Segment
    const currentSegment = isMetadataLoaded
        ? segmentsWithTiming.find(s => pos >= s.start && pos < s.end) || segmentsWithTiming[0]
        : segmentsWithTiming[0];

    // --- Helpers ---
    const fmt = (s) => {
        if (!Number.isFinite(s) || s < 0) return '--:--';
        return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    };

    const handleSeek = (e) => {
        if (!isMetadataLoaded) return;
        const width = e.currentTarget.clientWidth;
        const clickX = e.nativeEvent.offsetX;
        const newPos = (clickX / width) * realDuration;
        setPos(newPos);
    };

    const handleSkip = (sec) => {
        if (!isMetadataLoaded) return;
        setPos(Math.min(Math.max(0, pos + sec), realDuration));
    };

    const jumpToSegment = (seg) => {
        if (!isMetadataLoaded) return;
        setPos(seg.start + 0.1);
        if (!isPlaying) setIsPlaying(true);
    };

    const cycleSpeed = () => {
        const speeds = [1, 1.2, 1.5, 2.0];
        setSpeed(speeds[(speeds.indexOf(speed) + 1) % speeds.length] || 1);
    };

    return (
        <div className="space-y-6">
            {/* --- Header --- */}
            <div className="flex justify-between items-center">
                <button onClick={() => nav(-1)} className="p-2 -ml-2 text-slate-500 dark:text-[#a8a49d]">
                    <ChevronDown size={28} />
                </button>
                <div className="kicker">Now Playing</div>
                <div className="w-8" />
            </div>

            {/* --- Title Info --- */}
            <div className="text-center space-y-2">
                {isMetadataLoaded ? (
                    <>
                        <h2 className="headline text-2xl sm:text-3xl leading-tight truncate px-2">
                            {currentSegment?.title || track.title}
                        </h2>
                        <div className="byline text-base">
                            {currentSegment?.newspaper} {currentSegment?.section ? `• ${currentSegment.section}` : ''}
                        </div>
                    </>
                ) : (
                    <div className="animate-pulse space-y-2">
                        <div className="h-8 bg-slate-200 dark:bg-white/10 rounded w-3/4 mx-auto"/>
                        <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-1/2 mx-auto"/>
                    </div>
                )}
            </div>

            {/* --- Subtitles Box --- */}
            <div className="h-48 overflow-y-auto rounded-xl border rule bg-white/50 dark:bg-black/20 p-6 flex flex-col justify-center text-center">
                {!isMetadataLoaded ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"/>
                        <p className="byline">Loading audio stream...</p>
                    </div>
                ) : currentSegment?.type === 'transition' ? (
                    <p className="italic text-slate-400 font-serif text-lg animate-pulse">
                        (Next story loading...)
                    </p>
                ) : (
                    <p className="serif text-xl leading-relaxed text-slate-800 dark:text-[#e0dcd3]">
                        "{currentSegment?.title}"
                    </p>
                )}
            </div>

            {/* --- Controls --- */}
            <div className="space-y-6">
                {/* Scrubber */}
                <div className="space-y-2">
                    <div
                        className={`h-2 rounded-full relative overflow-hidden ${isMetadataLoaded ? 'cursor-pointer bg-slate-200 dark:bg-[#3e3b38]' : 'bg-slate-100 dark:bg-white/5'}`}
                        onClick={handleSeek}
                    >
                        {isMetadataLoaded && (
                            <div
                                className="absolute top-0 left-0 h-full bg-slate-900 dark:bg-[#c05b4d] transition-all duration-100 ease-linear"
                                style={{ width: `${(pos / realDuration) * 100}%` }}
                            />
                        )}
                    </div>
                    <div className="flex justify-between byline font-mono">
                        <span>{fmt(pos)}</span>
                        <span>{isMetadataLoaded ? fmt(realDuration) : '--:--'}</span>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-between max-w-xs mx-auto">
                    <button
                        onClick={() => handleSkip(-15)}
                        disabled={!isMetadataLoaded}
                        className="p-3 text-slate-700 dark:text-[#e0dcd3] disabled:opacity-30"
                    >
                        <Rewind size={28} />
                    </button>

                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        disabled={!isMetadataLoaded}
                        className="w-20 h-20 flex items-center justify-center rounded-full bg-slate-900 text-white dark:bg-[#e0dcd3] dark:text-[#23211f] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition"
                    >
                        {!isMetadataLoaded ? (
                            <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"/>
                        ) : isPlaying ? (
                            <Pause size={32} fill="currentColor" />
                        ) : (
                            <Play size={32} fill="currentColor" className="ml-1" />
                        )}
                    </button>

                    <button
                        onClick={() => handleSkip(15)}
                        disabled={!isMetadataLoaded}
                        className="p-3 text-slate-700 dark:text-[#e0dcd3] disabled:opacity-30"
                    >
                        <FastForward size={28} />
                    </button>
                </div>

                <div className="text-center">
                    <button onClick={cycleSpeed} disabled={!isMetadataLoaded} className="px-3 py-1 rounded-full border rule text-xs font-bold uppercase text-slate-500 dark:text-[#a8a49d] disabled:opacity-30">
                        {speed}x Speed
                    </button>
                </div>
            </div>

            <div className="rule my-6" />

            {/* --- Queue --- */}
            <div className="pb-10">
                <div className="kicker mb-4">Up Next</div>

                {!isMetadataLoaded ? (
                    // Loading Skeleton for Queue
                    <div className="space-y-3">
                        {[1,2,3].map(i => (
                            <div key={i} className="h-16 rounded-lg bg-slate-100 dark:bg-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    // Real Queue
                    <div className="space-y-3">
                        {segmentsWithTiming.filter(s => s.type === 'article').map((seg) => {
                            let fillPct = 0;
                            if (pos >= seg.end) fillPct = 100;
                            else if (pos > seg.start) fillPct = ((pos - seg.start) / (seg.end - seg.start)) * 100;

                            const isActive = pos >= seg.start && pos < seg.end;

                            return (
                                <button
                                    key={seg.index}
                                    onClick={() => jumpToSegment(seg)}
                                    className={`
                                        relative w-full text-left overflow-hidden rounded-lg border transition-all duration-300
                                        ${isActive
                                        ? 'border-slate-400 dark:border-[#c05b4d]'
                                        : 'border-transparent bg-white/60 dark:bg-white/5'
                                    }
                                    `}
                                >
                                    <div
                                        className="absolute inset-0 bg-slate-200/50 dark:bg-[#c05b4d]/20 transition-all duration-300 ease-linear pointer-events-none"
                                        style={{ width: `${fillPct}%` }}
                                    />
                                    <div className="relative p-4 z-10">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`kicker text-[10px] ${isActive ? 'text-slate-800 dark:text-[#c05b4d]' : ''}`}>
                                                {seg.newspaper}
                                            </span>
                                            <span className="byline font-mono opacity-70">
                                                {fmt(seg.displayDuration)}
                                            </span>
                                        </div>
                                        <div className={`headline text-base ${isActive ? 'text-black dark:text-white' : 'text-slate-600 dark:text-[#a8a49d]'}`}>
                                            {seg.title}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}