import React, { useEffect, useRef, useMemo } from 'react';
import { useAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';
import Hls from 'hls.js';
import {
    currentTrackAtom,
    isPlayingAtom,
    playbackPositionAtom,
    playbackSpeedAtom
} from '../../store/atoms/audioAtoms';

const AudioPlayer = () => {
    const navigate = useNavigate();
    const [currentTrack, setCurrentTrack] = useAtom(currentTrackAtom);
    const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom);
    const [position, setPosition] = useAtom(playbackPositionAtom);
    const [speed] = useAtom(playbackSpeedAtom);

    const audioRef = useRef(null);
    const hlsRef = useRef(null);

    // --- 1. HLS / Stream Loader ---
    useEffect(() => {
        if (!currentTrack || !currentTrack.episodeUrl) return;

        const audio = audioRef.current;
        if (!audio) return;

        const episodeUrl = currentTrack.episodeUrl;

        // Cleanup previous HLS instance
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        if (Hls.isSupported()) {
            const hls = new Hls();
            hlsRef.current = hls;
            hls.loadSource(episodeUrl);
            hls.attachMedia(audio);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (isPlaying) audio.play().catch(e => console.warn("Autoplay blocked", e));
            });
        } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari / Native HLS support
            audio.src = episodeUrl;
            if (isPlaying) audio.play().catch(e => console.warn("Autoplay blocked", e));
        }

        return () => {
            if (hlsRef.current) hlsRef.current.destroy();
        };
    }, [currentTrack?.id]); // Only reload if Track ID changes

    // --- 2. Play/Pause Sync ---
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying && audio.paused) {
            audio.play().catch(() => setIsPlaying(false));
        } else if (!isPlaying && !audio.paused) {
            audio.pause();
        }
    }, [isPlaying]);

    // --- 3. Speed Sync ---
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = speed;
        }
    }, [speed]);

    // --- 4. Seek Handling ---
    useEffect(() => {
        if (!audioRef.current) return;
        const diff = Math.abs(audioRef.current.currentTime - position);
        // Only force seek if difference is significant (>1s) to prevent UI stutter
        if (diff > 1.5) {
            audioRef.current.currentTime = position;
        }
    }, [position]);


    if (!currentTrack) return null;

    // --- 5. SMART SEGMENT CALCULATION (Real Data Logic) ---
    // This determines exactly which "Article" is playing right now
    const currentSeg = useMemo(() => {
        const segments = currentTrack.segments || [];
        const realDuration = currentTrack.duration || 0;

        // If metadata isn't loaded yet, show the first segment or generic info
        if (realDuration <= 1 || segments.length === 0) {
            return segments[0] || null;
        }

        // Calculate the scaling factor (Real Audio Time / DB Estimated Time)
        const estimatedTotal = segments.reduce((acc, s) => acc + (s.duration || 0), 0);
        const scaleFactor = estimatedTotal > 0 ? (realDuration / estimatedTotal) : 1;

        let accumulated = 0;

        // Find the segment that contains the current 'position'
        for (const segment of segments) {
            const scaledDur = (segment.duration || 0) * scaleFactor;

            // Check if position falls within this segment's window
            if (position >= accumulated && position < accumulated + scaledDur) {
                return segment;
            }

            accumulated += scaledDur;
        }

        // Edge case: End of track, return last segment
        return segments[segments.length - 1];
    }, [currentTrack, position]);


    // Progress percentage for the bar
    const totalDuration = currentTrack.duration || 1;
    const progressPct = Math.min(100, Math.max(0, (position / totalDuration) * 100));

    const formatTime = (s) =>
        `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

    return (
        <>
            <audio
                ref={audioRef}
                hidden
                preload="metadata"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onTimeUpdate={(e) => {
                    setPosition(e.target.currentTime);
                }}

                // --- THE FIX IS HERE ---
                onLoadedMetadata={(e) => {
                    const el = e.target;

                    // 1. Force re-apply the speed from the atom
                    if (speed !== 1 && el.playbackRate !== speed) {
                        el.playbackRate = speed;
                    }

                    // 2. Existing duration fix logic
                    const real = el.duration;
                    if (real && Math.abs(real - currentTrack.duration) > 1) {
                        setCurrentTrack(prev => ({ ...prev, duration: real }));
                    }
                }}
            />

            {/* --- The Mini Player UI --- */}
            <div
                className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 px-4 transition-all"
                onClick={() => navigate('/app/now-playing')}
            >
                <div className="max-w-lg mx-auto cursor-pointer transform transition-transform hover:scale-[1.02] active:scale-[0.98]">
                    <div className="bg-white/95 dark:bg-[#2d2b29]/95 backdrop-blur-xl border rule rounded-xl shadow-2xl overflow-hidden">

                        {/* Progress Bar */}
                        <div className="h-1 bg-slate-200 dark:bg-[#3e3b38]">
                            <div
                                className="h-full bg-slate-800 dark:bg-[#c05b4d] transition-all duration-100 ease-linear"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>

                        <div className="p-3 flex items-center gap-3">
                            {/* Album Art / Icon */}
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-[#3e3b38] flex items-center justify-center shrink-0">
                                {isPlaying ? (
                                    <div className="flex gap-0.5 items-end h-4">
                                        <div className="w-1 bg-slate-800 dark:bg-[#c05b4d] animate-[bounce_1s_infinite] h-3"></div>
                                        <div className="w-1 bg-slate-800 dark:bg-[#c05b4d] animate-[bounce_1.2s_infinite] h-4"></div>
                                        <div className="w-1 bg-slate-800 dark:bg-[#c05b4d] animate-[bounce_0.8s_infinite] h-2"></div>
                                    </div>
                                ) : (
                                    <span className="kicker text-[10px]">NP</span>
                                )}
                            </div>

                            {/* Text Info */}
                            <div className="flex-1 min-w-0">
                                <div className="headline text-sm truncate text-slate-900 dark:text-[#e0dcd3]">
                                    {currentTrack?.title || 'Loading...'}
                                </div>

                                <div className="byline truncate flex items-center gap-1">
                                    {currentSeg ? (
                                        currentSeg.type === 'transition' ? (
                                            <span className="italic opacity-80">Transitioning...</span>
                                        ) : (
                                            <>
                                                <span className="font-bold text-slate-700 dark:text-[#c05b4d]">
                                                    {currentSeg.newspaper}
                                                </span>
                                                <span className="opacity-60">• {currentSeg.title}</span>
                                            </>
                                        )
                                    ) : (
                                        <span>Buffering stream...</span>
                                    )}
                                </div>
                            </div>

                            {/* Timer */}
                            <div className="text-xs font-mono text-slate-500 dark:text-[#a8a49d] shrink-0 tabular-nums">
                                {formatTime(position)} / {formatTime(totalDuration)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AudioPlayer;