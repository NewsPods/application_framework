import React, { useMemo, useState } from 'react';
import { useAtom } from 'jotai';
import { currentTrackAtom, isPlayingAtom } from '../store/atoms/audioAtoms';
import NewsCard from '../components/news/newsCard';
import axios from 'axios';
import { useLoading } from '../hooks/LoadingProvider'; // Use the global loader

// 1. YOUR MOCK ARTICLES (Ensure hlsPaths match your B2 bucket exactly)
const MY_MOCK_ARTICLES = [
    {
        id: 'b2_mock_1',
        title: 'Crime gangs in UK',
        newspaper: 'The Guardian',
        section: 'Crime',
        duration: 45,
        publishedAt: new Date().toISOString(), // Added for the timestamp UI
        hlsPath: 'audio/hls/Crime_gangs_in_UK_start_making_1763300979/index.m3u8'
    },
    {
        id: 'b2_mock_2',
        title: 'Missing Dec 31 PAN-Aadhaar',
        newspaper: 'Indian Express',
        section: 'Finance',
        duration: 60,
        publishedAt: new Date().toISOString(),
        hlsPath: 'audio/hls/Missing_Dec_31_PAN-Aadhaar_lin_1763300549/index.m3u8'
    },
    {
        id: 'b2_mock_3',
        title: 'Tribes in Jharkhand make paneer',
        newspaper: 'Reuters',
        section: 'Culture',
        duration: 30,
        publishedAt: new Date().toISOString(),
        hlsPath: 'audio/hls/Tribes_in_Jharkhand_make_panee_1763300549/index.m3u8'
    },
    {
        id: 'b2_mock_4',
        title: 'xQc defends Sydney Sweeney',
        newspaper: 'Your News',
        section: 'Entertainment',
        duration: 50,
        publishedAt: new Date().toISOString(),
        hlsPath: 'audio/hls/xQc_defends_Sydney_Sweeney_ove_1763300901/index.m3u8'
    }
];

export default function Home(){
    const [, setTrack] = useAtom(currentTrackAtom);
    const [, setIsPlaying] = useAtom(isPlayingAtom);
    const loading = useLoading(); // Global overlay controller

    // --- 1. Prepare the "Daily Digest" Episode Object ---
    const digestEpisode = useMemo(() => {
        const segments = [];
        const playlistPaths = [];

        MY_MOCK_ARTICLES.forEach((a, i) => {
            playlistPaths.push(a.hlsPath);
            segments.push({
                type: 'article',
                title: a.title,
                newspaper: a.newspaper,
                section: a.section,
                duration: a.duration
            });
            // Add transition if not the last item
            if (i < MY_MOCK_ARTICLES.length - 1) {
                segments.push({ type: 'transition', duration: 2 });
            }
        });

        const totalDuration = segments.reduce((s, x) => s + (x.duration || 0), 0);

        return {
            id: 'digest-' + new Date().toLocaleDateString(),
            title: `Your Daily Digest`,
            segments,
            duration: totalDuration,
            playlistPaths // The ordered list of all files
        };
    }, []);

    // --- 2. Generic Helper to Request HLS URL from Backend ---
    const fetchHlsStream = async (paths) => {
        const API_BASE = import.meta.env.VITE_API_URL; // Uses your .env (localhost or 10.0.2.2)
        const API_URL = `${API_BASE}/episodes/hls`;

        const response = await axios.post(API_URL, {
            playlistPaths: paths
        });
        return response.data.episodeUrl;
    };

    // --- 3. Play the Full Digest ---
    const playDigest = async () => {
        loading.show('Stitching your digest...');
        try {
            const url = await fetchHlsStream(digestEpisode.playlistPaths);

            setTrack({
                ...digestEpisode,
                episodeUrl: url
            });
            setIsPlaying(true);
        } catch (error) {
            console.error("Failed to play digest:", error);
            alert("Could not load audio stream.");
        } finally {
            loading.hide();
        }
    };

    // --- 4. Play a Single Article ---
    const playArticle = async (article) => {
        loading.show('Loading article...');
        try {
            // We create a "mini episode" with just this one file
            const url = await fetchHlsStream([article.hlsPath]);

            const track = {
                id: article.id,
                title: article.title,
                duration: article.duration,
                episodeUrl: url,
                segments: [{
                    type: 'article',
                    title: article.title,
                    newspaper: article.newspaper,
                    section: article.section,
                    duration: article.duration
                }]
            };

            setTrack(track);
            setIsPlaying(true);
        } catch (error) {
            console.error("Failed to play article:", error);
            alert("Could not load article audio.");
        } finally {
            loading.hide();
        }
    };

    return (
        <div className="space-y-6">
            <div></div> {/* spacer */}

            {/* Daily Digest Card */}
            <div className="rounded-2xl border rule bg-white/90 dark:bg-black/40 p-5">
                <div className="kicker">Good day</div>
                <h2 className="headline text-2xl">Your daily episode is ready</h2>
                <p className="byline">A hand-picked digest from your sources, in a conversational 2-voice tone.</p>
                <div className="mt-4 flex items-center gap-3">
                    <button
                        onClick={playDigest}
                        className="px-4 py-2 rounded-lg bg-slate-900 text-white dark:bg-[#c05b4d] dark:text-white disabled:opacity-50 font-bold"
                    >
                        Play Digest
                    </button>
                    <span className="byline">≈ {Math.round(digestEpisode.duration / 60)} min</span>
                </div>
            </div>

            {/* Individual Articles List */}
            <section>
                <div className="kicker">Top news today</div>
                <div className="rule mb-3" />
                <div className="space-y-3">
                    {MY_MOCK_ARTICLES.map(a => (
                        <NewsCard
                            key={a.id}
                            item={a}
                            onPlay={() => playArticle(a)} // <-- Passes specific article
                        />
                    ))}
                </div>
            </section>
        </div>
    );
}