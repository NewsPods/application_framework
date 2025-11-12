import React, { useState } from 'react';
import BackButton from "../../components/ui/BackButton.jsx";
import { useLoading } from '../../hooks/LoadingProvider.jsx'; // 👈 added

export default function ResetPassword() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState({ loading: false, msg: '' });
    const loading = useLoading(); // 👈 global overlay hook

    const sendMail = async () => {
        if (!email) return;

        setStatus({ loading: true, msg: '' });
        loading.show("Sending password reset link…"); // 👈 show overlay
        try {
            const res = await fetch('http://localhost:4000/api/auth/password-reset/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            // Always show generic success message (even if backend fails)
            setStatus({
                loading: false,
                msg: "If that email exists, we've sent reset instructions."
            });
        } catch (err) {
            console.error("Password reset request error:", err);
            setStatus({
                loading: false,
                msg: "If that email exists, we've sent reset instructions."
            });
        } finally {
            loading.hide(); // 👈 hide overlay after completion
        }
    };

    return (
        <>
            <BackButton to="/login" />
            <div className="max-w-lg mx-auto px-4 pt-24 pb-20">
                <div className="kicker">Reset</div>
                <h2 className="headline text-3xl">Password recovery</h2>
                <div className="rule my-4" />
                <div className="grid gap-3">
                    <input
                        placeholder="Email"
                        className="px-4 py-3 rounded-lg border rule bg-white/70 dark:bg-black/30"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                    <button
                        disabled={status.loading}
                        onClick={sendMail}
                        className="px-4 py-3 rounded-lg border rule bg-slate-900 text-white dark:bg-amber-500 dark:text-black disabled:opacity-70"
                    >
                        {status.loading ? 'Sending…' : 'Send reset link'}
                    </button>

                    {status.msg && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {status.msg}
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}
