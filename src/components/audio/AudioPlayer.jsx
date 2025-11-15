import React, { useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';
import Hls from 'hls.js'; // <-- ADDED: The real player library
import {
    currentTrackAtom,
    isPlayingAtom,
    playbackPositionAtom,
    playbackSpeedAtom
} from '../../store/atoms/audioAtoms';

const AudioPlayer = () => {
    const navigate = useNavigate();
    const [currentTrack] = useAtom(currentTrackAtom);
    const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom);
    const [position, setPosition] = useAtom(playbackPositionAtom);
    const [speed] = useAtom(playbackSpeedAtom);

    // --- REMOVED ---
    // const [segIndex, setSegIndex] = useState(0);
    // const [segPos, setSegPos] = useState(0);
    // const timerRef = useRef(null);

    // --- ADDED: Refs for the REAL player ---
    const audioRef = useRef(null);
    const hlsRef = useRef(null);

    // --- REMOVED ---
    // The fake useEffect(() => { if (!currentTrack) ... }, [currentTrack]);

    // --- REMOVED ---
    // The fake setInterval logic (useEffect [isPlaying, speed, segIndex, currentTrack])

    // --- ADDED: Effect to load and manage the HLS stream ---
    useEffect(() => {
        if (!currentTrack || !currentTrack.episodeUrl) {
            // Stop and destroy player if no track
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
            }
            return;
        }

        const audio = audioRef.current;
        if (!audio) return;

        const episodeUrl = currentTrack.episodeUrl;

        if (Hls.isSupported()) {
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
            const hls = new Hls();
            hlsRef.current = hls;
            hls.loadSource(episodeUrl);
            hls.attachMedia(audio);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (isPlaying) {
                    audio.play().catch(e => console.error("Autoplay blocked", e));
                }
            });
        } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (e.g., Safari)
            audio.src = episodeUrl;
            if (isPlaying) {
                audio.play().catch(e => console.error("Autoplay blocked", e));
            }
        }

        // Cleanup
        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
            if (audio) {
                audio.pause();
            }
        };
    }, [currentTrack]); // This effect ONLY runs when the track changes

    // --- ADDED: Effect to control Play/Pause from Jotai atom ---
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.play().catch(e => {
                console.error("Playback failed:", e);
                setIsPlaying(false); // Sync state back if play fails
            });
        } else {
            audio.pause();
        }
    }, [isPlaying, setIsPlaying]);

    // --- ADDED: Effect to control Playback Speed from Jotai atom ---
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = speed;
        }
    }, [speed]);


    if (!currentTrack) return null;

    // --- MODIFIED: Real segment calculation ---
    // This logic now derives the current segment from the *real* position
    let currentSeg = null;
    let accumulatedDuration = 0;
    if (currentTrack?.segments) {
        for (const segment of currentTrack.segments) {
            const segmentDuration = segment.duration || 0;
            // Find the first segment that contains the current position
            if (position >= accumulatedDuration && position < accumulatedDuration + segmentDuration) {
                currentSeg = segment;
                break;
            }
            accumulatedDuration += segmentDuration;
        }
        // If no segment was found (e.g., end of track), default to the last one
        if (!currentSeg) {
            currentSeg = currentTrack.segments[currentTrack.segments.length - 1];
        }
    }

    const total = currentTrack.duration || 1;
    const pct = Math.min(100, (position / total) * 100);
    const fmt = s => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

    const openNowPlaying = () => navigate('/app/now-playing');

    return (
        <>
            {/* --- ADDED: The real, hidden audio engine --- */}
            <audio
                ref={audioRef}
                hidden
                preload="metadata"
                // Syncs the audio element's state back to Jotai
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onTimeUpdate={() => {
                    if (audioRef.current) {
                        // This is the *only* place that should write to the position atom
                        setPosition(audioRef.current.currentTime);
                    }
                }}
            />

            {/* --- Your existing UI (unchanged) --- */}
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
                                {/* This UI logic now works because `currentSeg` is calculated correctly */}
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
        </>
    );
};

export default AudioPlayer;