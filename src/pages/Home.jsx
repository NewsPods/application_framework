import React, { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { currentTrackAtom, isPlayingAtom } from '../store/atoms/audioAtoms';
import { useLoading } from '../hooks/LoadingProvider';
import NewsCard from '../components/news/newsCard';
import axios from 'axios';
import { Play, Headphones } from 'lucide-react';

export default function Home() {
    const [, setTrack] = useAtom(currentTrackAtom);
    const [, setIsPlaying] = useAtom(isPlayingAtom);
    const loading = useLoading();

    const [data, setData] = useState(null);
    const [isFetching, setIsFetching] = useState(true);

    // --- 1. Fetch Data from our new Backend Route ---
    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const API_URL = `${import.meta.env.VITE_API_URL}/home/feed`;

                const res = await axios.get(API_URL, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(res.data);
            } catch (err) {
                console.error("Home feed failed:", err);
            } finally {
                setIsFetching(false);
            }
        };
        fetchHomeData();
    }, []);

    // --- 2. Universal Play Function ---
    // Takes a list of articles (1 or many) and starts playback
    const playQueue = async (articles, titleOverride) => {
        if (!articles || articles.length === 0) return;

        loading.show('Stitching audio...');
        try {
            const API_BASE = import.meta.env.VITE_API_URL;
            const playlistPaths = articles.map(a => a.hlsPath).filter(Boolean);

            if (playlistPaths.length === 0) {
                alert("Audio not available.");
                return;
            }

            const res = await axios.post(`${API_BASE}/episodes/hls`, { playlistPaths });
            const episodeUrl = res.data.episodeUrl;
            const totalDuration = articles.reduce((sum, a) => sum + (a.audio_duration_seconds || 0), 0);

            const segments = [];
            articles.forEach((a, i) => {
                segments.push({
                    type: 'article',
                    title: a.title,
                    newspaper: a.news_source,
                    section: a.sections?.[0] || 'News',
                    duration: a.audio_duration_seconds || 0,
                    // CHANGED: Pass timestamps to the player atom
                    word_timestamps: a.word_timestamps || []
                });
                if (i < articles.length - 1) {
                    segments.push({ type: 'transition', duration: 2 });
                }
            });

            setTrack({
                id: `ep-${Date.now()}`,
                title: titleOverride || 'NewsPods Episode',
                duration: totalDuration,
                segments,
                episodeUrl
            });
            setIsPlaying(true);

        } catch (e) {
            console.error("Play failed", e);
            alert("Could not play audio.");
        } finally {
            loading.hide();
        }
    };

    if (isFetching) {
        return (
            <div className="space-y-6 pt-4 animate-pulse">
                <div className="h-40 bg-slate-200 dark:bg-white/10 rounded-2xl"></div>
                <div className="h-8 bg-slate-200 dark:bg-white/10 w-1/2 rounded"></div>
                <div className="h-32 bg-slate-200 dark:bg-white/10 rounded-xl"></div>
            </div>
        );
    }

    if (!data) return <div className="pt-10 text-center">Unable to load feed.</div>;

    // Helper for formatting duration
    const getMins = (sec) => Math.max(1, Math.round((sec || 0) / 60));

    return (
        <div className="space-y-8">

            {/* --- 1. MAIN DAILY DIGEST --- */}
            <div>

            </div>
            <section>
                <div className="rounded-2xl border rule bg-white/90 dark:bg-[#2d2b29] p-5 shadow-sm">
                    <div className="kicker">Daily Digest • {new Date(data.date).toLocaleDateString()}</div>
                    <h2 className="headline text-2xl sm:text-3xl mt-1 mb-2">Your Personal Briefing</h2>

                    <div className="text-sm text-slate-600 dark:text-[#a8a49d] mb-4 leading-relaxed">
                        {data.dailyDigest.length} stories curated based on your preferences.
                        <br />
                        Approx time: <span className="font-bold text-slate-900 dark:text-[#e0dcd3]">
                            {getMins(data.dailyDigest.reduce((s, a) => s + (a.audio_duration_seconds||0), 0))} mins
                        </span>
                    </div>

                    <button
                        onClick={() => playQueue(data.dailyDigest, "Daily Digest")}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-slate-900 text-white dark:bg-[#c05b4d] dark:text-white font-bold transition-transform active:scale-95"
                    >
                        <Play size={20} fill="currentColor" /> Play Full Episode
                    </button>
                </div>
            </section>

            {/* --- 2. SECTION EPISODES (New!) --- */}
            {data.sections.length > 0 && (
                <section>
                    <div className="kicker mb-3">Deep Dives</div>

                    {/* Horizontal Scroll Container */}
                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
                        {data.sections.map(sect => (
                            <div
                                key={sect.id}
                                className="snap-start shrink-0 w-64 p-4 rounded-xl border rule bg-white/60 dark:bg-white/5 flex flex-col justify-between h-40 hover:bg-white/80 dark:hover:bg-white/10 transition-colors"
                            >
                                <div>
                                    <div className="headline text-lg">{sect.title}</div>
                                    <div className="byline mt-1">{sect.articleCount} Articles • {getMins(sect.duration)}m</div>
                                </div>

                                <button
                                    onClick={() => playQueue(sect.articles, sect.title)}
                                    className="self-start flex items-center gap-2 text-sm font-bold text-[#8b0000] dark:text-[#c05b4d]"
                                >
                                    <Headphones size={16} /> Listen
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* --- 3. TOP NEWS TODAY (Random Mix) --- */}
            <section>
                <div className="kicker mb-3">Top News Today</div>
                <div className="space-y-3">
                    {data.topNews.map(a => (
                        <NewsCard
                            key={a.article_id}
                            item={{
                                ...a,
                                id: a.article_id,
                                newspaper: a.news_source,
                                section: a.sections?.[0],
                                publishedAt: a.created_at,
                                duration: a.audio_duration_seconds
                            }}
                            onPlay={() => playQueue([a], a.title)}
                        />
                    ))}
                </div>
            </section>

            {/* Footer Padding */}
            <div className="h-12"></div>
        </div>
    );
}