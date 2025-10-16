import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Signup(){
    const nav = useNavigate();
    const { signup } = useAuth();

    // Match backend schema
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        username: '',
        password: ''
    });

    const onChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        const res = await signup(form);
        if(res.success){
            nav('/onboarding/sources');
        }
    };

    return (
        <div className="max-w-lg mx-auto px-4 pt-24 pb-20">
            <div className="kicker">Create account</div>
            <h2 className="headline text-3xl">Tell us about you</h2>
            <div className="rule my-4" />
            <form onSubmit={submit} className="grid gap-3">
                <input
                    name="first_name"
                    placeholder="First name"
                    className="px-4 py-3 rounded-lg border rule bg-white/70 dark:bg-black/30"
                    onChange={onChange} required
                />
                <input
                    name="last_name"
                    placeholder="Last name"
                    className="px-4 py-3 rounded-lg border rule bg-white/70 dark:bg-black/30"
                    onChange={onChange} required
                />
                <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    className="px-4 py-3 rounded-lg border rule bg-white/70 dark:bg-black/30"
                    onChange={onChange} required
                />
                <input
                    name="username"
                    placeholder="Username"
                    className="px-4 py-3 rounded-lg border rule bg-white/70 dark:bg-black/30"
                    onChange={onChange} required
                />
                <input
                    name="password"
                    type="password"
                    placeholder="Password"
                    className="px-4 py-3 rounded-lg border rule bg-white/70 dark:bg-black/30"
                    onChange={onChange} required
                />
                <button
                    className="mt-2 px-4 py-3 rounded-lg bg-slate-900 text-white dark:bg-amber-500 dark:text-black"
                >
                    Create account
                </button>
            </form>
        </div>
    );
}
