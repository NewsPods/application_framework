import React, { useMemo } from 'react';
import { useAtom } from 'jotai';
import { currentTrackAtom, isPlayingAtom } from '../store/atoms/audioAtoms';
import { mockArticles } from '../utils/mockData';
import NewsCard from '../components/news/NewsCard';

export default function Home(){
    const [, setTrack] = useAtom(currentTrackAtom); const [, setIsPlaying] = useAtom(isPlayingAtom);
    const episode = useMemo(()=>{
        const selected = mockArticles.slice(0,3);
        const segments = [];
        selected.forEach((a, i)=>{
            segments.push({ type:'article', title: a.title, newspaper: a.newspaper, section: a.section, duration: a.duration });
            if (i<selected.length-1) segments.push({ type:'transition', duration: 2 });
        });
        const duration = segments.reduce((s,x)=> s + (x.duration||0), 0);
        return { id:'ep-'+Date.now(), title: `Your Daily Digest`, segments, duration };
    }, []);
    const playEpisode = ()=>{ setTrack(episode); setIsPlaying(true); };

    return (
        <div className="space-y-6">
            {/* Daily episode banner */}
            <div className="rounded-2xl border rule bg-white/90 dark:bg-black/40 p-5">
                <div className="kicker">Good day</div>
                <h2 className="headline text-2xl">Your daily episode is ready</h2>
                <p className="byline mt-1">A hand-picked digest from your sources, in a conversational 2-voice tone.</p>
                <div className="mt-4 flex items-center gap-3">
                    <button onClick={playEpisode} className="px-4 py-2 rounded-lg bg-slate-900 text-white dark:bg-amber-500 dark:text-black">Play</button>
                    <span className="byline">≈ {Math.round(episode.duration/60)} min</span>
                </div>
            </div>

            {/* Top news today */}
            <section>
                <div className="kicker">Top news today</div>
                <div className="rule mb-3" />
                <div className="space-y-3">
                    {mockArticles.map(a => (
                        <NewsCard key={a.id} item={a} onPlay={playEpisode} />
                    ))}
                </div>
            </section>

            {/* Listen a section */}
            <section>
                <div className="kicker">Listen a section</div>
                <div className="rule mb-3" />
                <div className="grid grid-cols-2 gap-3">
                    {['Politics','Finance','Sports','Technology'].map(sec => (
                        <button key={sec} onClick={playEpisode} className="rounded-xl border rule bg-white/80 dark:bg-black/30 p-4 text-left">
                            <div className="headline text-lg">{sec}</div>
                            <div className="byline">Quick brief</div>
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
}
