import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword(){
    const nav = useNavigate();
    const [email,setEmail]=useState(''); const [otp,setOtp]=useState('');
    return (
        <div className="max-w-lg mx-auto px-4 pt-24 pb-20">
            <div className="kicker">Reset</div>
            <h2 className="headline text-3xl">Password recovery</h2>
            <div className="rule my-4" />
            <div className="grid gap-3">
                <input placeholder="Email" className="px-4 py-3 rounded-lg border rule bg-white/70 dark:bg-black/30" value={email} onChange={e=>setEmail(e.target.value)} />
                <div className="flex gap-2">
                    <button className="px-4 py-3 rounded-lg border rule">Send mail</button>
                    <input placeholder="Enter OTP" className="flex-1 px-4 py-3 rounded-lg border rule bg-white/70 dark:bg-black/30" value={otp} onChange={e=>setOtp(e.target.value)} />
                    <button onClick={()=>nav('/reset')} className="px-4 py-3 rounded-lg bg-slate-900 text-white dark:bg-amber-500 dark:text-black">Reset</button>
                </div>
            </div>
        </div>
    );
}