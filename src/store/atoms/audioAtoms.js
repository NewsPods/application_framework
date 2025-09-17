import { atom } from 'jotai';

export const currentTrackAtom = atom(null);
export const isPlayingAtom = atom(false);
export const playbackPositionAtom = atom(0);
export const playbackSpeedAtom = atom(1);
export const voiceSettingsAtom = atom({
  speaker: 'multi', // 'single' | 'multi'
  voice: 'natural', // 'natural' | 'professional'
  speed: 1
});
export const episodesAtom = atom([]);
