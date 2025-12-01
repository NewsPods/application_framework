import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const items = [
    { path: '/app', label: 'Home' },
    { path: '/app/preferences', label: 'Preferences' },
    { path: '/app/shorts', label: 'Short Reads' },
    { path: '/app/profile', label: 'Profile' },
];

export default function MobileNav(){
    const nav = useNavigate(); const loc = useLocation();
    return (
        <nav className="fixed bottom-0 inset-x-0 z-50 border-t rule bg-white/90 dark:bg-black/50 backdrop-blur-xl pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] transition-all">
            <div className="max-w-lg mx-auto px-2 py-2 grid grid-cols-4 gap-2">
                {items.map(it=>{
                    const active = loc.pathname === it.path;
                    return (
                        <button key={it.path} onClick={()=>nav(it.path)} className={`text-xs py-2 rounded-lg ${active?'bg-slate-900 text-white dark:bg-amber-500 dark:text-black':'text-slate-700 dark:text-amber-200 hover:bg-white/50 dark:hover:bg-white/10'}`}>
                            {it.label}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}