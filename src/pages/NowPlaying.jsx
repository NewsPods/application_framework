import React from 'react';
import { useAtom } from 'jotai';
import {
    currentTrackAtom,
    isPlayingAtom,
    playbackPositionAtom,
    playbackSpeedAtom // Import the speed atom
} from '../store/atoms/audioAtoms';

export default function NowPlaying(){
    const [track] = useAtom(currentTrackAtom);
    const [pos, setPos] = useAtom(playbackPositionAtom); // Get the 'setter'
    const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom); // Get the 'setter'
    const [speed, setSpeed] = useAtom(playbackSpeedAtom); // Get the speed atoms

    if (!track) return <div className="pt-24 px-4">Nothing playing</div>;

    const segs = track.segments||[];
    const total = track.duration||1;
    const pct = Math.min(100, (pos/total)*100);

    // Helper function for formatting time
    const fmt = s => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

    // --- Control Handlers ---

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const skip = (seconds) => {
        const newPos = Math.max(0, Math.min(total, pos + seconds));
        setPos(newPos);
    };

    const onSeek = (e) => {
        const seekBar = e.currentTarget;
        const clickPos = e.nativeEvent.offsetX;
        const width = seekBar.clientWidth;
        const percent = clickPos / width;
        const newPos = percent * total;
        setPos(newPos);
    };

    const cycleSpeed = () => {
        if (speed === 1) setSpeed(1.2);
        else if (speed === 1.2) setSpeed(1.5);
        else if (speed === 1.5) setSpeed(2);
        else setSpeed(1);
    };

    return (
        <div className="px-4 pt-20 pb-24 max-w-lg mx-auto">
            <div className="kicker">Now playing</div>
            <h2 className="headline text-3xl">{track.title}</h2>
            <div className="rule my-3" />

            {/* Captions area - This is a good place for current segment title */}
            <div className="rounded-xl border rule bg-white/90 dark:bg-black/40 p-4 min-h-[40vh]">
                <p className="serif text-lg leading-relaxed">
                    {segs.map((s,i)=> s.type==='article' ? <span key={i}><strong>{s.title}.</strong> </span> : <span key={i} className="opacity-60 italic">(transition) </span>)}
                </p>
            </div>

            {/* --- NEW TRANSPORT CONTROLS --- */}
            <div className="mt-4 rounded-xl border rule bg-white/80 dark:bg-black/30 p-4">
                {/* Clickable Seek Bar */}
                <div
                    className="h-1.5 bg-slate-200 dark:bg-amber-900/30 rounded-full cursor-pointer"
                    onClick={onSeek}
                >
                    <div
                        className="h-full bg-slate-800 dark:bg-amber-400 rounded-full"
                        style={{width: pct+'%'}}
                    />
                </div>
                {/* Time Display */}
                <div className="flex justify-between text-xs byline mt-2 px-1">
                    <span>{fmt(pos)}</span>
                    <span>{fmt(total)}</span>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between mt-4">
                    <button
                        onClick={cycleSpeed}
                        className="font-bold byline w-12 text-center"
                    >
                        {speed}x
                    </button>

                    <button onClick={() => skip(-15)} className="font-bold text-2xl">
                        {/* You can replace this with an icon */}
                        «
                    </button>

                    <button
                        onClick={togglePlay}
                        className="w-16 h-16 rounded-full bg-slate-900 text-white dark:bg-amber-500 dark:text-black flex items-center justify-center text-3xl"
                    >
                        {/* You can replace this with icons */}
                        {isPlaying ? '||' : '▶'}
                    </button>

                    <button onClick={() => skip(15)} className="font-bold text-2xl">
                        {/* You can replace this with an icon */}
                        »
                    </button>

                    <div className="w-12"></div> {/* Empty spacer */}
                </div>
            </div>

            {/* Article list (Queue) */}
            <div className="mt-4">
                <div className="kicker">Queue</div>
                <div className="rule mb-2" />
                <ol className="space-y-2">
                    {segs.filter(s=>s.type==='article').map((s,i)=> (
                        <li key={i} className="px-3 py-2 rounded border rule bg-white/70 dark:bg-black/30">{i+1}. {s.title} <span className="byline">• {s.section}</span></li>
                    ))}
                </ol>
            </div>
        </div>
    );
}