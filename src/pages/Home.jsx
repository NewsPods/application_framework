import React, { useMemo, useState } from 'react';
import { useAtom } from 'jotai';
import { currentTrackAtom, isPlayingAtom } from '../store/atoms/audioAtoms';
import NewsCard from '../components/news/NewsCard';
import axios from 'axios';

// --- 1. YOUR 4 MOCK ARTICLES FROM BACKBLAZE ---
// The hlsPath is based on your screenshot
const MY_MOCK_ARTICLES = [
    {
        id: 'b2_mock_1',
        title: 'Crime gangs in UK',
        newspaper: 'Your News',
        section: 'Crime',
        duration: 45, // Set a duration in seconds for the UI
        hlsPath: 'audio/hls/Crime_gangs_in_UK_start_making_1763300979/index.m3u8'
    },
    {
        id: 'b2_mock_2',
        title: 'Missing Dec 31 PAN-Aadhaar',
        newspaper: 'Your News',
        section: 'Finance',
        duration: 60,
        hlsPath: 'audio/hls/Missing_Dec_31_PAN-Aadhaar_lin_1763300549/index.m3u8'
    },
    {
        id: 'b2_mock_3',
        title: 'Tribes in Jharkhand make paneer',
        newspaper: 'Your News',
        section: 'Culture',
        duration: 30,
        hlsPath: 'audio/hls/Tribes_in_Jharkhand_make_panee_1763300549/index.m3u8'
    },
    {
        id: 'b2_mock_4',
        title: 'xQc defends Sydney Sweeney',
        newspaper: 'Your News',
        section: 'Entertainment',
        duration: 50,
        hlsPath: 'audio/hls/xQc_defends_Sydney_Sweeney_ove_1763300901/index.m3u8'
    }
];
// To change the playback order, just re-order the items in this array.

export default function Home(){
    const [, setTrack] = useAtom(currentTrackAtom);
    const [, setIsPlaying] = useAtom(isPlayingAtom);
    const [isLoading, setIsLoading] = useState(false);

    const episode = useMemo(() => {
        const segments = [];
        const playlistPaths = []; // This array is for the API

        MY_MOCK_ARTICLES.forEach((a, i) => {
            playlistPaths.push(a.hlsPath);
            segments.push({
                type: 'article',
                title: a.title,
                newspaper: a.newspaper,
                section: a.section,
                duration: a.duration
            });
            if (i < MY_MOCK_ARTICLES.length - 1) {
                segments.push({ type: 'transition', duration: 2 });
            }
        });

        const duration = segments.reduce((s, x) => s + (x.duration || 0), 0);

        return {
            id: 'ep-' + Date.now(),
            title: `Your Daily Digest`,
            segments,
            duration,
            playlistPaths // This is the ordered list for your API!
        };
    }, []);

    const playEpisode = async () => {
        if (!episode) return;
        setIsLoading(true);

        try {
            // Make sure this URL is correct for your running API
            const API_URL = 'http://localhost:4000/api/episodes/hls';

            const response = await axios.post(API_URL, {
                playlistPaths: episode.playlistPaths // Sending the ordered list
            });

            const { episodeUrl } = response.data;
            const finalTrack = { ...episode, episodeUrl };

            setTrack(finalTrack);
            setIsPlaying(true);
        } catch (error) {
            console.error("Failed to create HLS episode:", error);
        }
        setIsLoading(false);
    };

    return (
        <div className="space-y-6">
            <div>

            </div>
            <div className="rounded-2xl border rule bg-white/90 dark:bg-black/40 p-5">
                <div className="kicker">Good day</div>
                <h2 className="headline text-2xl">Your daily episode is ready</h2>
                <p className="byline">A hand-picked digest from your sources, in a conversational 2-voice tone.</p>
                <div className="mt-4 flex items-center gap-3">
                    <button
                        onClick={playEpisode}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-lg bg-slate-900 text-white dark:bg-amber-500 dark:text-black disabled:opacity-50"
                    >
                        {isLoading ? 'Loading...' : 'Play'}
                    </button>
                    <span className="byline">≈ {Math.round(episode.duration / 60)} min</span>
                </div>
            </div>

            <section>
                <div className="kicker">Top news today</div>
                <div className="rule mb-3" />
                <div className="space-y-3">
                    {MY_MOCK_ARTICLES.map(a => (
                        <NewsCard key={a.id} item={a} onPlay={() => {playEpisode}} />
                    ))}
                </div>
            </section>
        </div>
    );
}