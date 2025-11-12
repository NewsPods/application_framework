import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function Profile() {
    const nav = useNavigate();

    // user info
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);

    // modals
    const [showUser, setShowUser] = useState(false);
    const [showPw, setShowPw] = useState(false);

    // forms
    const [newUsername, setNewUsername] = useState('');
    const [oldPw, setOldPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [delPw, setDelPw] = useState('');

    // UI feedback
    const [msg, setMsg] = useState('');
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);

    const token = useMemo(() => localStorage.getItem('authToken') || '', []);

    function headers(json = true) {
        return {
            ...(json ? { 'Content-Type': 'application/json' } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
    }

    // lock scroll when any modal is open
    useEffect(() => {
        const anyOpen = showUser || showPw;
        const prev = document.body.style.overflow;
        if (anyOpen) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [showUser, showPw]);

    // load current user
    useEffect(() => {
        (async () => {
            try {
                const r = await fetch(`${API}/auth/me`, { headers: headers(false) });
                const ctype = r.headers.get('content-type') || '';
                const data = ctype.includes('application/json') ? await r.json() : {};
                if (r.ok && data?.user) {
                    setUser(data.user);
                    localStorage.setItem('currentUser', JSON.stringify(data.user));
                } else if (r.status === 401) {
                    nav('/auth');
                } else {
                    setErr(data?.error || 'Failed to load profile');
                }
            } catch (e) {
                console.error(e);
                setErr('Failed to load profile');
            } finally {
                setLoadingUser(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const initials = useMemo(() => {
        if (!user) return 'U';
        const f = (user.first_name || '').trim();
        const l = (user.last_name || '').trim();
        const u = (user.username || '').trim();
        const s = `${f?.[0] || ''}${l?.[0] || ''}` || u?.slice(0, 2) || 'U';
        return s.toUpperCase();
    }, [user]);

    async function handleChangeUsername() {
        if (!newUsername || newUsername.length < 3) {
            setErr('Username must be at least 3 characters.');
            return;
        }
        setBusy(true); setErr(''); setMsg('');
        try {
            const r = await fetch(`${API}/auth/change-username`, {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify({ username: newUsername }),
            });
            const data = await r.json();
            if (!r.ok || !data?.success) {
                setErr(data?.error || 'Could not change username');
                return;
            }
            setMsg('Username updated.');
            setUser(data.user);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            setShowUser(false);
            setNewUsername('');
        } catch (e) {
            console.error(e);
            setErr('Could not change username');
        } finally {
            setBusy(false);
        }
    }

    async function handleChangePassword() {
        if (!oldPw || !newPw || newPw.length < 8) {
            setErr('New password must be at least 8 characters.');
            return;
        }
        setBusy(true); setErr(''); setMsg('');
        try {
            const r = await fetch(`${API}/auth/change-password`, {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify({ old_password: oldPw, new_password: newPw }),
            });
            const data = await r.json();
            if (!r.ok || !data?.success) {
                setErr(data?.error || 'Could not change password');
                return;
            }
            setMsg('Password updated.');
            setShowPw(false);
            setOldPw(''); setNewPw('');
        } catch (e) {
            console.error(e);
            setErr('Could not change password');
        } finally {
            setBusy(false);
        }
    }

    async function handleDeleteAccount() {
        if (!delPw) {
            setErr('Please confirm your password.');
            return;
        }
        if (!confirm('This will permanently delete your account. Continue?')) return;

        setBusy(true); setErr(''); setMsg('');
        try {
            const r = await fetch(`${API}/auth/delete`, {
                method: 'DELETE',
                headers: headers(),
                body: JSON.stringify({ password: delPw }),
            });
            const data = await r.json();
            if (!r.ok || !data?.success) {
                setErr(data?.error || 'Could not delete account');
                return;
            }
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            setMsg('Account deleted.');
            nav('/welcome');
        } catch (e) {
            console.error(e);
            setErr('Could not delete account');
        } finally {
            setBusy(false);
        }
    }

    if (loadingUser) {
        return <div className="kicker px-4 sm:px-6 pt-6 pb-2">Loading profile…</div>;
    }

    return (
        <div className="space-y-6 px-4 sm:px-6 pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),6rem)]">
            {/* ↑ extra bottom padding so content never tucks under a fixed bottom menu */}

            {/* Header */}
            <section>
                <div className="kicker">Profile</div>
                <h2 className="headline text-2xl sm:text-3xl">Account settings</h2>
                <div className="rule my-3" />

                {/* User card (responsive) */}
                <div className="rounded-2xl border rule bg-white/80 dark:bg-black/30 p-4 md:p-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[auto,1fr,auto] md:items-start">
                        {/* Avatar */}
                        <div className="flex flex-col items-center text-center gap-3 md:flex-row md:items-center md:text-left">
                            {/* Avatar */}
                            <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-slate-900 text-white dark:bg-amber-500 dark:text-black grid place-items-center font-semibold text-lg">
                                {initials}
                            </div>

                            {/* User text */}
                            <div className="min-w-0">
                                <div className="headline truncate text-balance">
                                    {(user?.first_name || '')} {(user?.last_name || '')}
                                </div>
                                <div className="byline break-words">{user?.email}</div>
                                <div className="byline">
                                    Username:{' '}
                                    <span className="font-mono break-all">{user?.username}</span>
                                </div>
                                <div className="byline">
                                    Joined:{' '}
                                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                                </div>
                            </div>
                        </div>


                        {/* Actions (right on desktop, full-width stack on mobile) */}
                        <div className="grid grid-cols-1 gap-2 md:justify-items-center md:gap-3">
                            <button
                                onClick={() => { setShowUser(true); setNewUsername(user?.username || ''); }}
                                className="px-4 py-3 rounded-lg border rule bg-white/70 dark:bg-black/30 text-center w-full md:w-auto"
                            >
                                Change username
                            </button>
                            <button
                                onClick={() => setShowPw(true)}
                                className="px-4 py-3 rounded-lg border rule bg-white/70 dark:bg-black/30 text-center w-full md:w-auto"
                            >
                                Change password
                            </button>
                        </div>
                    </div>
                </div>


                {(msg || err) && (
                    <div className={`mt-3 text-sm ${err ? 'text-red-600' : 'text-green-700'}`}>
                        {err || msg}
                    </div>
                )}
            </section>

            {/* Danger zone */}
            <section>
                <div className="kicker">Danger zone</div>
                <h3 className="headline text-xl sm:text-2xl">Delete account</h3>
                <div className="rule my-3" />
                <div className="grid gap-3 max-w-lg">
                    <input
                        type="password"
                        placeholder="Confirm password"
                        value={delPw}
                        onChange={e => setDelPw(e.target.value)}
                        className="px-4 py-3 rounded-lg border rule bg-white/70 dark:bg-black/30"
                    />
                    <button
                        onClick={handleDeleteAccount}
                        className="px-4 py-3 rounded-lg bg-red-600 text-white disabled:opacity-70 w-full"
                        disabled={busy}
                    >
                        {busy ? 'Working…' : 'Delete account'}
                    </button>
                </div>
            </section>

            {/* Username Modal (centered, above everything) */}
            {showUser && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setShowUser(false)}
                        aria-hidden="true"
                    />
                    {/* Dialog */}
                    <div className="relative w-full max-w-md rounded-2xl border rule bg-white p-4 md:p-5 shadow-xl">
                        <h4 className="headline text-lg">Change username</h4>
                        <input
                            value={newUsername}
                            onChange={e => setNewUsername(e.target.value)}
                            placeholder="New username"
                            className="mt-3 w-full px-4 py-3 rounded-lg border rule"
                        />
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <button onClick={() => setShowUser(false)} className="px-4 py-3 rounded border rule w-full">
                                Cancel
                            </button>
                            <button
                                onClick={handleChangeUsername}
                                className="px-4 py-3 rounded bg-slate-900 text-white disabled:opacity-70 w-full"
                                disabled={busy}
                            >
                                {busy ? 'Saving…' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Modal (centered, above everything) */}
            {showPw && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setShowPw(false)}
                        aria-hidden="true"
                    />
                    <div className="relative w-full max-w-md rounded-2xl border rule bg-white p-4 md:p-5 shadow-xl">
                        <h4 className="headline text-lg">Change password</h4>
                        <input
                            type="password"
                            value={oldPw}
                            onChange={e => setOldPw(e.target.value)}
                            placeholder="Old password"
                            className="mt-3 w-full px-4 py-3 rounded-lg border rule"
                        />
                        <input
                            type="password"
                            value={newPw}
                            onChange={e => setNewPw(e.target.value)}
                            placeholder="New password (min 8 chars)"
                            className="mt-2 w-full px-4 py-3 rounded-lg border rule"
                        />
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <button onClick={() => setShowPw(false)} className="px-4 py-3 rounded border rule w-full">
                                Cancel
                            </button>
                            <button
                                onClick={handleChangePassword}
                                className="px-4 py-3 rounded bg-slate-900 text-white disabled:opacity-70 w-full"
                                disabled={busy}
                            >
                                {busy ? 'Saving…' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
