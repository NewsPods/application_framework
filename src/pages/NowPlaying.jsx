import React from 'react';
import { useAtom } from 'jotai';
import { currentTrackAtom, isPlayingAtom, playbackPositionAtom } from '../store/atoms/audioAtoms';

export default function NowPlaying(){
    const [track] = useAtom(currentTrackAtom); const [pos] = useAtom(playbackPositionAtom); const [isPlaying] = useAtom(isPlayingAtom);
    if (!track) return <div className="pt-24 px-4">Nothing playing</div>;
    const segs = track.segments||[]; const total = track.duration||1; const pct = Math.min(100, (pos/total)*100);

    return (
        <div className="px-4 pt-20 pb-24 max-w-lg mx-auto">
            <div className="kicker">Now playing</div>
            <h2 className="headline text-3xl">{track.title}</h2>
            <div className="rule my-3" />

            {/* Captions area */}
            <div className="rounded-xl border rule bg-white/90 dark:bg-black/40 p-4 min-h-[40vh]">
                <p className="serif text-lg leading-relaxed">
                    {segs.map((s,i)=> s.type==='article' ? <span key={i}><strong>{s.title}.</strong> </span> : <span key={i} className="opacity-60 italic">(transition) </span>)}
                </p>
            </div>

            {/* Article list */}
            <div className="mt-4">
                <div className="kicker">Queue</div>
                <div className="rule mb-2" />
                <ol className="space-y-2">
                    {segs.filter(s=>s.type==='article').map((s,i)=> (
                        <li key={i} className="px-3 py-2 rounded border rule bg-white/70 dark:bg-black/30">{i+1}. {s.title} <span className="byline">• {s.section}</span></li>
                    ))}
                </ol>
            </div>

            {/* Transport */}
            <div className="mt-4 rounded-xl border rule bg-white/80 dark:bg-black/30 p-3">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="headline">{track.title}</div>
                        <div className="byline">{isPlaying ? 'Playing' : 'Paused'}</div>
                    </div>
                    <div className="text-sm">{Math.round(pct)}%</div>
                </div>
                <div className="mt-2 h-1 bg-slate-200 dark:bg-amber-900/30">
                    <div className="h-full bg-slate-800 dark:bg-amber-400" style={{width: pct+'%'}} />
                </div>
            </div>
        </div>
    );
}
