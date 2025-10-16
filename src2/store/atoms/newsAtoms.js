import { atom } from 'jotai';

export const selectedCategoriesAtom = atom(['technology', 'politics']);
export const selectedSourcesAtom = atom(['times', 'guardian', 'reuters']);
export const customTopicsAtom = atom([]);
export const currentEpisodeAtom = atom(null);
export const episodesAtom = atom([]);
export const newsLoadingAtom = atom(false);
