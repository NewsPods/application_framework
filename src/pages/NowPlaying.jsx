import React, { useMemo, useEffect, useRef } from 'react';
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

    // Refs for auto-scrolling the subtitles
    const activeWordRef = useRef(null);
    const subtitleContainerRef = useRef(null);

    // 1. Empty State
    if (!track) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
                <div className="headline text-xl">Nothing in queue</div>
                <button onClick={() => nav('/app')} className="px-6 py-3 bg-slate-900 text-white dark:bg-[#c05b4d] rounded-lg font-bold">
                    Go to Feed
                </button>
            </div>
        );
    }

    const realDuration = track.duration || 0;
    const isMetadataLoaded = realDuration > 1;

    // 2. Smart Segmentation (with scale factor logic)
    const { segmentsWithTiming, scaleFactor } = useMemo(() => {
        if (!track.segments) return { segmentsWithTiming: [], scaleFactor: 1 };

        const estimatedTotal = track.segments.reduce((acc, s) => acc + (s.duration || 0), 0);
        // Prevent divide by zero or huge skews
        const factor = (estimatedTotal > 0 && isMetadataLoaded) ? (realDuration / estimatedTotal) : 1;

        let accumulated = 0;
        const segs = track.segments.map((seg, index) => {
            const scaledDur = (seg.duration || 0) * factor;
            const start = accumulated;
            const end = accumulated + scaledDur;
            accumulated = end;
            return { ...seg, start, end, index, displayDuration: Math.round(scaledDur) };
        });
        return { segmentsWithTiming: segs, scaleFactor: factor };
    }, [track, realDuration, isMetadataLoaded]);

    // 3. Find Active Segment
    const currentSegment = isMetadataLoaded
        ? segmentsWithTiming.find(s => pos >= s.start && pos < s.end) || segmentsWithTiming[0]
        : segmentsWithTiming[0];

    // 4. Calculate "Relative Time" inside the article for subtitles
    // We un-scale the time so it matches the original JSON timestamps
    const relativeTime = Math.max(0, (pos - currentSegment.start)) / scaleFactor;

    // 5. Auto-Scroll Effect
    useEffect(() => {
        if (activeWordRef.current && subtitleContainerRef.current) {
            activeWordRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center'
            });
        }
    }, [Math.floor(relativeTime)]); // Throttle scrolling to once per second-ish to avoid jitter

    // --- Helpers ---
    const fmt = (s) => !Number.isFinite(s) || s < 0 ? '--:--' : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

    const handleSeek = (e) => {
        if (!isMetadataLoaded) return;
        const width = e.currentTarget.clientWidth;
        const newPos = (e.nativeEvent.offsetX / width) * realDuration;
        setPos(newPos);
    };

    const handleSkip = (sec) => isMetadataLoaded && setPos(Math.min(Math.max(0, pos + sec), realDuration));

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
            {/* Header */}
            <div className="flex justify-between items-center">
                <button onClick={() => nav(-1)} className="p-2 -ml-2 text-slate-500 dark:text-[#a8a49d]">
                    <ChevronDown size={28} />
                </button>
                <div className="kicker">Now Playing</div>
                <div className="w-8" />
            </div>

            {/* --- Title Info --- */}
            <div className="text-center space-y-2">
                <h2 className="headline text-2xl sm:text-3xl leading-tight truncate px-2">
                    {currentSegment?.title || track.title}
                </h2>
                <div className="byline text-base">
                    {currentSegment?.newspaper} {currentSegment?.section ? `• ${currentSegment.section}` : ''}
                </div>
            </div>

            {/* --- SUBTITLES BOX (Teleprompter) --- */}
            <div
                className="h-56 rounded-xl border rule bg-[#fdfbf7] dark:bg-[#23211f] relative overflow-hidden shadow-inner"
            >
                <div
                    ref={subtitleContainerRef}
                    className="absolute inset-0 overflow-y-auto p-6 text-center space-y-4 no-scrollbar"
                >
                    {/* TRANSITION STATE */}
                    {!isMetadataLoaded ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"/>
                        </div>
                    ) : currentSegment?.type === 'transition' ? (
                        <div className="h-full flex items-center justify-center">
                            <p className="italic text-slate-400 font-serif text-lg animate-pulse">Next story loading...</p>
                        </div>
                    ) : currentSegment?.word_timestamps?.length > 0 ? (
                        // REAL SUBTITLES
                        <p className="serif text-lg leading-loose text-slate-400 dark:text-slate-600 transition-colors duration-300">
                            {currentSegment.word_timestamps.map((w, i) => {
                                // Check if this word is currently spoken
                                const isActive = relativeTime >= w.start && relativeTime < (w.start + (w.duration || 0.5));
                                return (
                                    <span
                                        key={i}
                                        ref={isActive ? activeWordRef : null}
                                        className={`
                                            mx-1 px-1 rounded transition-all duration-200
                                            ${isActive
                                            ? 'bg-yellow-200 dark:bg-[#c05b4d]/40 text-black dark:text-[#e0dcd3] font-bold scale-110 inline-block shadow-sm'
                                            : ''
                                        }
                                        `}
                                    >
                                        {w.text}
                                    </span>
                                );
                            })}
                        </p>
                    ) : (
                        // FALLBACK IF NO SUBTITLES
                        <div className="h-full flex items-center justify-center">
                            <p className="serif text-xl leading-relaxed text-slate-800 dark:text-[#e0dcd3] opacity-80">
                                "{currentSegment?.title}"
                            </p>
                        </div>
                    )}
                </div>
                {/* Fade overlays for visual polish */}
                <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white/90 dark:from-[#23211f]/90 to-transparent pointer-events-none"/>
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/90 dark:from-[#23211f]/90 to-transparent pointer-events-none"/>
            </div>

            {/* --- Controls --- */}
            <div className="space-y-6">
                <div className="space-y-2">
                    <div className={`h-2 rounded-full relative overflow-hidden ${isMetadataLoaded ? 'cursor-pointer bg-slate-200 dark:bg-[#3e3b38]' : 'bg-slate-100 dark:bg-white/5'}`} onClick={handleSeek}>
                        {isMetadataLoaded && (
                            <div className="absolute top-0 left-0 h-full bg-slate-900 dark:bg-[#c05b4d] transition-all duration-100 ease-linear" style={{ width: `${(pos / realDuration) * 100}%` }} />
                        )}
                    </div>
                    <div className="flex justify-between byline font-mono">
                        <span>{fmt(pos)}</span>
                        <span>{isMetadataLoaded ? fmt(realDuration) : '--:--'}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between max-w-xs mx-auto">
                    <button onClick={() => handleSkip(-15)} disabled={!isMetadataLoaded} className="p-3 text-slate-700 dark:text-[#e0dcd3] disabled:opacity-30"><Rewind size={28} /></button>
                    <button onClick={() => setIsPlaying(!isPlaying)} disabled={!isMetadataLoaded} className="w-20 h-20 flex items-center justify-center rounded-full bg-slate-900 text-white dark:bg-[#e0dcd3] dark:text-[#23211f] shadow-lg disabled:opacity-50 hover:scale-105 transition">
                        {!isMetadataLoaded ? <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"/> : isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                    </button>
                    <button onClick={() => handleSkip(15)} disabled={!isMetadataLoaded} className="p-3 text-slate-700 dark:text-[#e0dcd3] disabled:opacity-30"><FastForward size={28} /></button>
                </div>

                <div className="text-center">
                    <button onClick={cycleSpeed} disabled={!isMetadataLoaded} className="px-3 py-1 rounded-full border rule text-xs font-bold uppercase text-slate-500 dark:text-[#a8a49d] disabled:opacity-30">{speed}x Speed</button>
                </div>
            </div>

            <div className="rule my-6" />

            {/* Queue */}
            <div className="pb-10">
                <div className="kicker mb-4">Up Next</div>
                <div className="space-y-3">
                    {segmentsWithTiming.filter(s => s.type === 'article').map((seg) => {
                        let fillPct = 0;
                        if (pos >= seg.end) fillPct = 100;
                        else if (pos > seg.start) fillPct = ((pos - seg.start) / (seg.end - seg.start)) * 100;
                        const isActive = pos >= seg.start && pos < seg.end;

                        return (
                            <button key={seg.index} onClick={() => jumpToSegment(seg)} className={`relative w-full text-left overflow-hidden rounded-lg border transition-all duration-300 ${isActive ? 'border-slate-400 dark:border-[#c05b4d]' : 'border-transparent bg-white/60 dark:bg-white/5'}`}>
                                <div className="absolute inset-0 bg-slate-200/50 dark:bg-[#c05b4d]/20 transition-all duration-300 ease-linear pointer-events-none" style={{ width: `${fillPct}%` }} />
                                <div className="relative p-4 z-10">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`kicker text-[10px] ${isActive ? 'text-slate-800 dark:text-[#c05b4d]' : ''}`}>{seg.newspaper}</span>
                                        <span className="byline font-mono opacity-70">{fmt(seg.displayDuration)}</span>
                                    </div>
                                    <div className={`headline text-base ${isActive ? 'text-black dark:text-white' : 'text-slate-600 dark:text-[#a8a49d]'}`}>{seg.title}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}