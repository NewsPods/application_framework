import { useAtom } from 'jotai';
import { 
  currentTrackAtom, 
  isPlayingAtom, 
  playbackPositionAtom 
} from '../store/atoms/audioAtoms';

export const useAudio = () => {
  const [currentTrack, setCurrentTrack] = useAtom(currentTrackAtom);
  const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom);
  const [position, setPosition] = useAtom(playbackPositionAtom);

  const playTrack = (track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const seek = (newPosition) => {
    setPosition(newPosition);
  };

  return {
    currentTrack,
    isPlaying,
    position,
    playTrack,
    togglePlay,
    seek
  };
};
