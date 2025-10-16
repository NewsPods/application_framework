import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Welcome(){
    const nav = useNavigate();
    const start = ()=>{ localStorage.setItem('np_hasOnboarded','1'); nav('/auth'); };
    return (
        <div className="min-h-screen bg-paper-light dark:bg-paper-dark flex items-center justify-center px-6">
            <div className="max-w-md text-center">
                <div className="text-4xl masthead">Welcome to NewsPods</div>
                <p className="mt-3 text-slate-600 dark:text-amber-200/70">A customizable newspaper podcast to help you beat doom‑scrolling and stay truly informed.</p>
                <div className="rule my-6" />
                <button onClick={start} className="px-5 py-3 rounded-lg bg-slate-900 text-white dark:bg-amber-500 dark:text-black">Get started</button>
            </div>
        </div>
    );
}