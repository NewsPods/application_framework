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

    // Refs for auto-scrolling
    const activeSentenceRef = useRef(null);
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

    // 2. Smart Segmentation (Queue Logic)
    const { segmentsWithTiming, scaleFactor } = useMemo(() => {
        if (!track.segments) return { segmentsWithTiming: [], scaleFactor: 1 };

        const estimatedTotal = track.segments.reduce((acc, s) => acc + (s.duration || 0), 0);
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

    // 4. Calculate "Relative Time" for subtitles
    const relativeTime = Math.max(0, (pos - currentSegment.start)) / scaleFactor;

    // 5. SENTENCE AGGREGATION LOGIC (New!)
    // Transforms raw word list -> sentences with start/end times
    const sentences = useMemo(() => {
        const words = currentSegment?.word_timestamps || [];
        if (words.length === 0) return [];

        const result = [];
        let currentSentenceWords = [];
        let sentenceStartTime = words[0]?.start || 0;

        words.forEach((w, i) => {
            currentSentenceWords.push(w.text);

            // Check if word ends with punctuation or if it's the last word
            const isEnd = ['.', '?', '!'].some(p => w.text.includes(p)) || i === words.length - 1;

            if (isEnd) {
                const endTime = w.start + (w.duration || 0);
                // Join words, fixing spaces before punctuation (e.g. "Hello ." -> "Hello.")
                const text = currentSentenceWords.join(' ').replace(/ ([.,!?])/g, '$1');

                result.push({
                    text,
                    start: sentenceStartTime,
                    end: endTime + 0.2 // Add slight buffer
                });

                // Reset for next sentence
                currentSentenceWords = [];
                sentenceStartTime = words[i + 1]?.start || endTime;
            }
        });
        return result;
    }, [currentSegment]);

    // 6. Identify Active Sentence
    const activeSentenceIndex = sentences.findIndex(
        s => relativeTime >= s.start && relativeTime < s.end
    );

    // 7. Auto-Scroll Effect
    useEffect(() => {
        const sent = activeSentenceRef.current;
        const box = subtitleContainerRef.current;
        if (!sent || !box) return;

        requestAnimationFrame(() => {
            const sentTop = sent.offsetTop;
            const sentHeight = sent.offsetHeight;
            const boxHeight = box.clientHeight;

            const scrollTo = sentTop - (boxHeight / 2) + (sentHeight / 2);

            box.scrollTo({
                top: scrollTo,
                behavior: 'smooth'
            });
        });
    }, [activeSentenceIndex]);
    // Only scroll when the sentence changes

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

            {/* --- TELEPROMPTER BOX --- */}
            <div className="h-64 relative rounded-xl border rule bg-[#fdfbf7] dark:bg-[#23211f] overflow-hidden shadow-inner">
                <div
                    ref={subtitleContainerRef}
                    className="absolute inset-0 overflow-y-auto px-6 py-4 no-scrollbar"
                >
                    {/* Add huge padding so the first/last sentences can still be centered */}
                    <div className="pt-[80px] pb-[80px] space-y-6 text-center">

                        {!isMetadataLoaded ? (
                            <div className="flex justify-center"><div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"/></div>
                        ) : currentSegment?.type === 'transition' ? (
                            <p className="italic text-slate-400 font-serif text-lg animate-pulse">Next story loading...</p>
                        ) : sentences.length > 0 ? (
                            sentences.map((s, i) => {
                                const isActive = i === activeSentenceIndex;
                                const isPast = i < activeSentenceIndex;

                                return (
                                    <p
                                        key={i}
                                        ref={isActive ? activeSentenceRef : null}
                                        className={`
                                            serif text-lg leading-relaxed transition-all duration-500 ease-out
                                            ${isActive
                                            ? 'text-slate-900 dark:text-[#e0dcd3] scale-105 font-medium opacity-100'
                                            : 'text-slate-400 dark:text-slate-600 scale-95 opacity-40 blur-[0.5px]'
                                        }
                                        `}
                                    >
                                        {s.text}
                                    </p>
                                );
                            })
                        ) : (
                            <p className="serif text-xl leading-relaxed text-slate-800 dark:text-[#e0dcd3] opacity-80">
                                "{currentSegment?.title}"
                            </p>
                        )}
                    </div>
                </div>

                {/* Fade Gradients */}
                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#fdfbf7] dark:from-[#23211f] to-transparent pointer-events-none"/>
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#fdfbf7] dark:from-[#23211f] to-transparent pointer-events-none"/>
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