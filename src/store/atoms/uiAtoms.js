import { atom } from 'jotai';

// Default to system or light, hydration will override this later
export const themeAtom = atom('light');