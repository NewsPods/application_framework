import React, { useState, useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { Play, Pause, SkipBack, SkipForward, Volume2, X } from 'lucide-react';
import {
  currentTrackAtom,
  isPlayingAtom,
  playbackPositionAtom,
  playbackSpeedAtom
} from '../../store/atoms/audioAtoms.js';

const AudioPlayer = () => {
  const [currentTrack, setCurrentTrack] = useAtom(currentTrackAtom);
  const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom);
  const [position, setPosition] = useAtom(playbackPositionAtom);
  const [speed, setSpeed] = useAtom(playbackSpeedAtom);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [segmentPosition, setSegmentPosition] = useState(0);
  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!currentTrack) return;
    setCurrentSegmentIndex(0);
    setSegmentPosition(0);
    setPosition(0);
  }, [currentTrack]);

  useEffect(() => {
    if (isPlaying && currentTrack) {
      // Simulate audio playback
      intervalRef.current = setInterval(() => {
        setSegmentPosition(prev => {
          const currentSegment = currentTrack.segments[currentSegmentIndex];
          if (!currentSegment) return prev;

          if (prev >= currentSegment.duration) {
            // Move to next segment
            if (currentSegmentIndex < currentTrack.segments.length - 1) {
              setCurrentSegmentIndex(currentSegmentIndex + 1);
              return 0;
            } else {
              // End of episode
              setIsPlaying(false);
              return prev;
            }
          }
          return prev + 1;
        });

        setPosition(prev => prev + 1);
      }, 1000 / speed);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, currentSegmentIndex, speed, currentTrack]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const skipToNext = () => {
    if (currentSegmentIndex < currentTrack.segments.length - 1) {
      setCurrentSegmentIndex(currentSegmentIndex + 1);
      setSegmentPosition(0);
    }
  };

  const skipToPrevious = () => {
    if (currentSegmentIndex > 0) {
      setCurrentSegmentIndex(currentSegmentIndex - 1);
      setSegmentPosition(0);
    }
  };

  const closePlayer = () => {
    setIsPlaying(false);
    setCurrentTrack(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  const currentSegment = currentTrack.segments[currentSegmentIndex];
  const progressPercentage = (position / currentTrack.duration) * 100;

  return (
      <div className="fixed bottom-16 left-0 right-0 z-40 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-gradient-to-r from-purple-900/95 to-pink-900/95 backdrop-blur-xl rounded-t-3xl shadow-2xl border border-purple-500/20">
            {/* Progress Bar */}
            <div className="h-1 bg-purple-950/50 rounded-t-3xl overflow-hidden">
              <div
                  className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-1000 ease-linear"
                  style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="p-4">
              {/* Track Info */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate text-lg">
                    {currentTrack.title}
                  </h3>
                  {currentSegment && currentSegment.type === 'article' && (
                      <div className="mt-1">
                        <p className="text-sm text-purple-200 truncate">
                          {currentSegment.title}
                        </p>
                        <p className="text-xs text-purple-300 mt-1">
                          {currentSegment.newspaper} • {currentSegment.section}
                        </p>
                      </div>
                  )}
                  {currentSegment && currentSegment.type === 'transition' && (
                      <p className="text-sm text-purple-300 italic mt-1">
                        Transitioning to next story...
                      </p>
                  )}
                </div>
                <button
                    onClick={closePlayer}
                    className="p-2 hover:bg-white/10 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-purple-300" />
                </button>
              </div>

              {/* Time Display */}
              <div className="flex justify-between text-xs text-purple-300 mb-3">
                <span>{formatTime(position)}</span>
                <span>
                Article {Math.floor(currentSegmentIndex / 2) + 1} of {Math.floor(currentTrack.segments.length / 2) + 1}
              </span>
                <span>{formatTime(currentTrack.duration)}</span>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center space-x-4">
                <button
                    onClick={skipToPrevious}
                    disabled={currentSegmentIndex === 0}
                    className="p-2 rounded-full hover:bg-white/10 transition disabled:opacity-30"
                >
                  <SkipBack className="w-6 h-6 text-white" />
                </button>

                <button
                    onClick={togglePlay}
                    className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105"
                >
                  {isPlaying ?
                      <Pause className="w-6 h-6 text-white" /> :
                      <Play className="w-6 h-6 text-white ml-0.5" />
                  }
                </button>

                <button
                    onClick={skipToNext}
                    disabled={currentSegmentIndex >= currentTrack.segments.length - 1}
                    className="p-2 rounded-full hover:bg-white/10 transition disabled:opacity-30"
                >
                  <SkipForward className="w-6 h-6 text-white" />
                </button>

                <div className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-purple-300" />
                  <button
                      onClick={() => setSpeed(speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1)}
                      className="px-3 py-1.5 text-sm font-medium bg-white/10 text-purple-200 border border-purple-400/50 rounded-lg hover:bg-white/20 transition"
                  >
                    {speed}x
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default AudioPlayer;
