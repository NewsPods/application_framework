import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile(){
    const nav = useNavigate();
    const [showUser, setShowUser] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [delPw, setDelPw] = useState('');

    const deleteAccount = ()=>{ if(delPw){ localStorage.clear(); nav('/welcome'); } };

    return (
        <div className="space-y-6">
            <section>
                <div className="kicker">Profile</div>
                <h2 className="headline text-2xl">Account settings</h2>
                <div className="rule my-3" />
                <div className="grid gap-2">
                    <button onClick={()=>setShowUser(true)} className="px-4 py-3 rounded-lg border rule bg-white/70 dark:bg-black/30 text-left">Change username</button>
                    <button onClick={()=>setShowPw(true)} className="px-4 py-3 rounded-lg border rule bg-white/70 dark:bg-black/30 text-left">Change password</button>
                </div>
            </section>

            <section>
                <div className="kicker">Danger zone</div>
                <h3 className="headline text-xl">Delete account</h3>
                <div className="rule my-3" />
                <div className="grid gap-2">
                    <input type="password" placeholder="Confirm password" value={delPw} onChange={e=>setDelPw(e.target.value)} className="px-4 py-3 rounded-lg border rule bg-white/70 dark:bg-black/30" />
                    <button onClick={deleteAccount} className="px-4 py-3 rounded-lg bg-red-600 text-white">Delete account</button>
                </div>
            </section>

            {/* Mock modals */}
            {showUser && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
                    <div className="max-w-sm w-full rounded-xl border rule bg-white p-4">
                        <h4 className="headline text-lg">Change username</h4>
                        <input placeholder="New username" className="mt-3 w-full px-4 py-3 rounded-lg border rule" />
                        <div className="mt-3 flex justify-end gap-2">
                            <button onClick={()=>setShowUser(false)} className="px-3 py-2 rounded border rule">Cancel</button>
                            <button onClick={()=>setShowUser(false)} className="px-3 py-2 rounded bg-slate-900 text-white">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {showPw && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
                    <div className="max-w-sm w-full rounded-xl border rule bg-white p-4">
                        <h4 className="headline text-lg">Change password</h4>
                        <input type="password" placeholder="Old password" className="mt-3 w-full px-4 py-3 rounded-lg border rule" />
                        <input type="password" placeholder="New password" className="mt-2 w-full px-4 py-3 rounded-lg border rule" />
                        <div className="mt-3 flex justify-end gap-2">
                            <button onClick={()=>setShowPw(false)} className="px-3 py-2 rounded border rule">Cancel</button>
                            <button onClick={()=>setShowPw(false)} className="px-3 py-2 rounded bg-slate-900 text-white">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
