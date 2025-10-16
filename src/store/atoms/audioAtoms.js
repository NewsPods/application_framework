import { atom } from 'jotai';

export const currentTrackAtom = atom(null); // { id, title, duration, segments: [...] }
export const isPlayingAtom = atom(false);
export const playbackPositionAtom = atom(0);
export const playbackSpeedAtom = atom(1);