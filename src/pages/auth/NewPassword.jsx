import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NewPassword(){
    const nav = useNavigate(); const [a,setA]=useState(''); const [b,setB]=useState('');
    const confirm=()=>{ if(a && a===b) nav('/login'); };
    return (
        <div className="max-w-lg mx-auto px-4 pt-24 pb-20">
            <div className="kicker">Choose new password</div>
            <h2 className="headline text-3xl">Set password</h2>
            <div className="rule my-4" />
            <div className="grid gap-3">
                <input type="password" placeholder="New password" className="px-4 py-3 rounded-lg border rule bg-white/70 dark:bg-black/30" value={a} onChange={e=>setA(e.target.value)} />
                <input type="password" placeholder="Confirm password" className="px-4 py-3 rounded-lg border rule bg-white/70 dark:bg-black/30" value={b} onChange={e=>setB(e.target.value)} />
                <button onClick={confirm} className="px-4 py-3 rounded-lg bg-slate-900 text-white dark:bg-amber-500 dark:text-black">Confirm</button>
            </div>
        </div>
    );
}