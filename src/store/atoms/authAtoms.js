import { atom } from 'jotai';
export const userAtom = atom(JSON.parse(localStorage.getItem('currentUser') || 'null'));