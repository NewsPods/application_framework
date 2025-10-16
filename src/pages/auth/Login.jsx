import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Login(){
    const nav = useNavigate(); const { login } = useAuth();
    const [id, setId] = useState(''); const [pw, setPw] = useState(''); const [err,setErr]=useState('');
    const submit = async (e)=>{ e.preventDefault(); const res = await login(id, pw); if(res.success){ nav('/app'); } else setErr(res.error||'Login failed'); };
    return (
        <div className="max-w-lg mx-auto px-4 pt-24 pb-20">
            <div className="kicker">Welcome back</div>
            <h2 className="headline text-3xl">Log in</h2>
            <div className="rule my-4" />
            <form onSubmit={submit} className="grid gap-3">
                <input placeholder="Email or Username" className="px-4 py-3 rounded-lg border rule bg-white/70 dark:bg-black/30" value={id} onChange={e=>setId(e.target.value)} required />
                <input type="password" placeholder="Password" className="px-4 py-3 rounded-lg border rule bg-white/70 dark:bg-black/30" value={pw} onChange={e=>setPw(e.target.value)} required />
                {err && <div className="text-sm text-red-600">{err}</div>}
                <div className="flex items-center justify-between">
                    <Link to="/forgot" className="text-sm underline">Forgot password?</Link>
                    <button className="px-4 py-3 rounded-lg bg-slate-900 text-white dark:bg-amber-500 dark:text-black">Log in</button>
                </div>
            </form>
        </div>
    );
}