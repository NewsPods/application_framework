import { atom } from 'jotai';

const initialTheme = (() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
})();

export const themeAtom = atom(initialTheme);
