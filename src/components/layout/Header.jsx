import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import { themeAtom } from '../../store/atoms/uiAtoms';
import Storage from '../../services/storage';

export default function Header(){
    const [theme, setTheme] = useAtom(themeAtom);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        Storage.set('theme', theme).catch(console.error);
    }, [theme]);

    return (
        // 1. ADD: pt-[env(safe-area-inset-top)]
        // This extends the background color/blur up behind the status bar
        <header className="fixed top-0 inset-x-0 z-50 border-b rule bg-white/80 dark:bg-black/40 backdrop-blur-xl pt-[env(safe-area-inset-top)] transition-all">
            <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-slate-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <span className="kicker">NP</span>
                    </div>
                    <div>
                        <div className="masthead">NewsPods</div>
                        <div className="kicker">AI‑Powered Newspaper Podcast</div>
                    </div>
                </div>
                <button onClick={()=>setTheme(theme==='dark'?'light':'dark')} className="px-3 py-1.5 text-xs rounded border rule bg-white/70 dark:bg-black/30">
                    {theme==='dark' ? 'Light • 𝑁' : 'Dark • 𝒱'}
                </button>
            </div>
        </header>
    );
}