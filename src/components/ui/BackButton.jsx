import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * BackButton
 * - If `to` is provided, navigates there.
 * - Else tries history back; if no history, goes to `fallback`.
 * - Styled to match your glassy light/dark theme and mobile tap target.
 */
export default function BackButton({
                                       to,
                                       fallback = '/auth',
                                       label = 'Back',
                                       className = '',
                                       replace = false,
                                       positionClass = 'fixed left-4 top-4', // change to 'absolute left-4 top-4' if you prefer
                                       sizeClass = 'w-11 h-11',
                                   }) {
    const nav = useNavigate();

    const onClick = (e) => {
        e.preventDefault();
        if (to) {
            nav(to, { replace });
        } else if (window.history.length > 1) {
            nav(-1);
        } else {
            nav(fallback);
        }
    };

    const base =
        `${positionClass} z-20 ${sizeClass} rounded-full border rule ` +
        `bg-white/70 dark:bg-black/30 backdrop-blur-sm shadow-sm ` +
        `flex items-center justify-center ` +
        `hover:bg-white/90 dark:hover:bg-black/50 ` +
        `focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70`;

    return (
        <button
            type="button"
            aria-label={label}
            onClick={onClick}
            className={`${base} ${className}`}
        >
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-6 h-6"
                aria-hidden="true"
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <span className="sr-only">{label}</span>
        </button>
    );
}
