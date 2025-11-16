import React, { useEffect, useRef } from 'react';
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
    // 1. Get the SETTER for currentTrack
    const [currentTrack, setCurrentTrack] = useAtom(currentTrackAtom);
    const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom);
    const [position, setPosition] = useAtom(playbackPositionAtom);
    const [speed] = useAtom(playbackSpeedAtom);

    const audioRef = useRef(null);
    const hlsRef = useRef(null);

    // Effect to load and manage the HLS stream
    useEffect(() => {
        if (!currentTrack || !currentTrack.episodeUrl) {
            // ... (cleanup logic, no change)
            return;
        }

        const audio = audioRef.current;
        if (!audio) return;
        const episodeUrl = currentTrack.episodeUrl;

        // ... (HLS loading logic, no change)
        if (Hls.isSupported()) {
            if (hlsRef.current) hlsRef.current.destroy();
            const hls = new Hls();
            hlsRef.current = hls;
            hls.loadSource(episodeUrl);
            hls.attachMedia(audio);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (isPlaying) audio.play().catch(e => console.error("Autoplay blocked", e));
            });
        } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
            audio.src = episodeUrl;
            if (isPlaying) audio.play().catch(e => console.error("Autoplay blocked", e));
        }

        // Cleanup
        return () => {
            if (hlsRef.current) hlsRef.current.destroy();
            if (audio) audio.pause();
        };
    }, [currentTrack]); // This effect ONLY runs when the track changes

    // Effect to control Play/Pause from Jotai atom
    useEffect(() => {
        // ... (no change)
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) audio.play().catch(e => setIsPlaying(false));
        else audio.pause();
    }, [isPlaying, setIsPlaying]);

    // Effect to control Playback Speed from Jotai atom
    useEffect(() => {
        // ... (no change)
        if (audioRef.current) audioRef.current.playbackRate = speed;
    }, [speed]);

    // --- 2. FIX FOR SEEK/FORWARD/REWIND ---
    // This new effect listens for external changes to the position atom
    // (e.g., from NowPlaying.jsx) and commands the audio element to seek.
    useEffect(() => {
        if (!audioRef.current) return;

        // Compare the atom's position to the audio's real position
        const audioTime = audioRef.current.currentTime;

        // If the difference is more than 1 second, we assume it's a manual seek
        if (Math.abs(position - audioTime) > 1) {
            audioRef.current.currentTime = position;
        }
    }, [position]); // Listen for changes to the atom

    // ... (rest of the component, including UI, is below)
    // ...

    if (!currentTrack) return null;

    // Real-time segment calculation
    let currentSeg = null;
    let accumulatedDuration = 0;
    if (currentTrack?.segments) {
        for (const segment of currentTrack.segments) {
            const segmentDuration = segment.duration || 0;
            if (position >= accumulatedDuration && position < accumulatedDuration + segmentDuration) {
                currentSeg = segment;
                break;
            }
            accumulatedDuration += segmentDuration;
        }
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
            {/* The real, hidden audio engine */}
            <audio
                ref={audioRef}
                hidden
                preload="metadata"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onTimeUpdate={() => {
                    if (audioRef.current) {
                        // This writes the real position back to the atom
                        setPosition(audioRef.current.currentTime);
                    }
                }}

                // --- 3. FIX FOR DURATION ---
                // When the audio file's metadata is loaded, this event fires.
                // We get the REAL duration and update our track atom.
                onLoadedMetadata={() => {
                    if (audioRef.current && currentTrack) {
                        const realDuration = audioRef.current.duration;
                        // If the real duration is different from our guess, update the atom
                        if (realDuration && Math.abs(realDuration - currentTrack.duration) > 1) {
                            setCurrentTrack({ ...currentTrack, duration: realDuration });
                        }
                    }
                }}
            />

            {/* Your existing UI (unchanged) */}
            <div className="fixed bottom-16 left-0 right-0 z-40 px-4" onClick={openNowPlaying}>
                {/* ... all your UI code is unchanged ... */}
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
        </>
    );
};

export default AudioPlayer;