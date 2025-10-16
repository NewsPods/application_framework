import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthLanding(){
    const nav = useNavigate();
    return (
        <div className="max-w-lg mx-auto px-4 pt-24 pb-20">
            <div className="kicker">Access</div>
            <h2 className="headline text-3xl">Sign up or log in</h2>
            <div className="rule my-4" />
            <div className="grid gap-3">
                <button onClick={()=>nav('/signup')} className="px-4 py-3 rounded-lg bg-slate-900 text-white dark:bg-amber-500 dark:text-black">Create an account</button>
                <button onClick={()=>nav('/login')} className="px-4 py-3 rounded-lg border rule bg-white/70 dark:bg-black/30">I already have an account</button>
            </div>
        </div>
    );
}