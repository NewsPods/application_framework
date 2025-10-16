import React from 'react';

export default function NewsCard({ item, onPlay }){
    const mins = Math.round((item.duration||120)/60);
    const when = new Date(item.publishedAt);
    const ago = (()=>{ const h = Math.floor((Date.now()-when)/36e5); return h<1?'Just now':h<24?`${h}h ago`:when.toLocaleDateString(); })();
    return (
        <div className="rounded-xl border rule bg-white/80 dark:bg-black/30 p-4">
            <div className="flex items-start justify-between">
                <div>
                    <div className="kicker">{item.newspaper} • {item.section}</div>
                    <h4 className="headline text-lg">{item.title}</h4>
                    <div className="byline mt-1">{ago} • {mins}m brief</div>
                </div>
                <button onClick={onPlay} className="ml-3 px-3 py-1.5 text-sm rounded border rule bg-slate-900 text-white dark:bg-amber-500 dark:text-black">Play</button>
            </div>
        </div>
    );
}