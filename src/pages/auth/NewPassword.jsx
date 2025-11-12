import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLoading } from '../../hooks/LoadingProvider.jsx'; // 👈 overlay hook

export default function NewPassword(){
    const nav = useNavigate();
    const { search } = useLocation();
    const loading = useLoading(); // 👈 overlay controller

    const token = new URLSearchParams(search).get('token') || '';
    const [a, setA] = useState('');
    const [b, setB] = useState('');
    const [state, setState] = useState({ loading: true, valid: false, msg: '' });

    useEffect(() => {
        const validate = async () => {
            if (!token) {
                setState({ loading: false, valid: false, msg: 'Missing or invalid link.' });
                return;
            }
            loading.show('Validating reset link…'); // 👈 show overlay
            try {
                const r = await fetch(`http://localhost:4000/api/auth/password-reset/validate?token=${encodeURIComponent(token)}`);
                const json = await r.json();
                if (json.success) {
                    setState({ loading: false, valid: true, msg: `Reset link valid for ${json.email_masked}` });
                } else {
                    setState({ loading: false, valid: false, msg: 'This link is invalid or expired.' });
                }
            } catch {
                setState({ loading: false, valid: false, msg: 'This link is invalid or expired.' });
            } finally {
                loading.hide(); // 👈 hide overlay
            }
        };
        validate();
    }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

    const confirm = async () => {
        if (!a || a !== b) {
            setState(s => ({ ...s, msg: 'Passwords do not match.' }));
            return;
        }
        loading.show('Resetting password…'); // 👈 show overlay
        try {
            const r = await fetch('http://localhost:4000/api/auth/password-reset/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, new_password: a })
            });
            const json = await r.json();
            if (json.success) {
                nav('/login');
            } else {
                setState(s => ({ ...s, msg: json.error || 'Could not reset password.' }));
            }
        } catch {
            setState(s => ({ ...s, msg: 'Could not reset password.' }));
        } finally {
            loading.hide(); // 👈 hide overlay
        }
    };

    if (state.loading) {
        // Optional: keep a minimal message behind the overlay for a11y
        return <div className="max-w-lg mx-auto px-4 pt-24 pb-20">Checking link…</div>;
    }

    if (!state.valid) {
        return (
            <div className="max-w-lg mx-auto px-4 pt-24 pb-20">
                <p>{state.msg}</p>
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto px-4 pt-24 pb-20">
            <div className="kicker">Choose new password</div>
            <h2 className="headline text-3xl">Set password</h2>
            <div className="rule my-4" />
            <div className="grid gap-3">
                <input
                    type="password"
                    placeholder="New password"
                    className="px-4 py-3 rounded-lg border rule bg-white/70 dark:bg-black/30"
                    value={a}
                    onChange={e => setA(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Confirm password"
                    className="px-4 py-3 rounded-lg border rule bg-white/70 dark:bg-black/30"
                    value={b}
                    onChange={e => setB(e.target.value)}
                />
                <button
                    onClick={confirm}
                    className="px-4 py-3 rounded-lg bg-slate-900 text-white dark:bg-amber-500 dark:text-black"
                >
                    Confirm
                </button>
                {state.msg ? (
                    <p className="text-sm text-gray-600 dark:text-gray-300">{state.msg}</p>
                ) : null}
            </div>
        </div>
    );
}
