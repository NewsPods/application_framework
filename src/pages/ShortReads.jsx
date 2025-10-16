import React from 'react';
import { mockArticles } from '../utils/mockData';

export default function ShortReads(){
    return (
        <div className="space-y-4">
            <div className="kicker">Short reads</div>
            <h2 className="headline text-2xl">Skim the paper</h2>
            <div className="rule mb-2" />
            {mockArticles.map(a => (
                <article key={a.id} className="rounded-xl border rule bg-white/80 dark:bg-black/30 p-4">
                    <div className="kicker">{a.newspaper} • {a.section}</div>
                    <h3 className="headline text-lg">{a.title}</h3>
                    <p className="mt-2 text-sm text-slate-700 dark:text-amber-50/80">{a.transcript}</p>
                    <a href={a.url} target="_blank" rel="noreferrer" className="inline-block mt-3 underline text-sm">Read full article →</a>
                </article>
            ))}
        </div>
    );
}
