import React from 'react';
export default function Button({children, className='', ...props}){
    return (
        <button {...props} className={`inline-flex items-center justify-center rounded-lg border rule bg-white/80 dark:bg-black/30 px-4 py-2 text-sm font-medium hover:bg-white transition ${className}`}>{children}</button>
    );
}