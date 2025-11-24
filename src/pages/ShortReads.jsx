import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import preferencesService from '../services/preferencesService';
import { useLoading } from '../hooks/LoadingProvider';

// Helper: Secure fetch wrapper
async function fetchJSON(path, opts = {}) {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    const url = path.startsWith('http') ? path : `${base}${path}`;
    const token = localStorage.getItem('authToken');

    const res = await fetch(url, {
        ...opts,
        headers: {
            'Content-Type': 'application/json',
            ...(opts.headers || {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
}

const PAGE_SIZE = 20;

export default function ShortReads() {
    // Data State
    const [articles, setArticles] = useState([]);
    const [prefs, setPrefs] = useState(null);

    // Pagination & Logic State
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true); // Initial load
    const [fetchingMore, setFetchingMore] = useState(false); // Scroll load
    const [isFallback, setIsFallback] = useState(false); // True if prefs yielded 0 results

    const [expanded, setExpanded] = useState({});

    // 1. Load User Preferences on Mount
    useEffect(() => {
        const init = async () => {
            try {
                const data = await preferencesService.getPreferences();
                let sources = [], sections = [];

                // Normalize data structure
                if(Array.isArray(data)) {
                    data.forEach(p => {
                        if(p.preference_type === 'newspaper') sources.push(p.preference_value);
                        if(p.preference_type === 'section') sections.push(p.preference_value);
                    });
                } else {
                    sources = data.newspapers || [];
                    sections = data.sections || [];
                }
                setPrefs({ sources, sections });
            } catch (e) {
                console.error("Prefs load error", e);
                setPrefs({ sources: [], sections: [] });
            }
        };
        init();
    }, []);

    // 2. Fetch Logic (Triggered when prefs load OR offset changes)
    useEffect(() => {
        if (!prefs) return; // Wait for prefs to be ready

        const fetchArticles = async () => {
            // Determine if we are doing an initial load or a "load more"
            const isInitial = offset === 0;
            if (isInitial) setLoading(true);
            else setFetchingMore(true);

            try {
                // Construct Query Params
                const p = new URLSearchParams();
                p.set('limit', PAGE_SIZE.toString());
                p.set('offset', offset.toString());

                // Apply prefs ONLY if we are NOT in fallback mode
                // AND we actually have preferences to apply
                const shouldUsePrefs = !isFallback && (prefs.sources.length > 0 || prefs.sections.length > 0);

                if (shouldUsePrefs) {
                    if (prefs.sections.length) p.set('sections', prefs.sections.join(','));
                    if (prefs.sources.length)  p.set('sources', prefs.sources.join(','));
                }

                // API Call
                const data = await fetchJSON(`/articles/search?${p.toString()}`);

                // --- Fallback Logic (Only on first page) ---
                if (isInitial && data.length === 0 && shouldUsePrefs) {
                    console.log("No matches for preferences. Switching to Fallback Mode (Latest News).");
                    setIsFallback(true);
                    // We don't need to do anything else;
                    // changing isFallback to true will trigger this useEffect again automatically
                    // because isFallback is in the dependency array (implicitly via logic flow? No, we need to force it).
                    // Actually, safer to just recurse call immediately to avoid flicker:
                    return retryFallback();
                }

                // Normal Data Handling
                if (data.length < PAGE_SIZE) {
                    setHasMore(false);
                }

                if (isInitial) {
                    setArticles(data);
                } else {
                    // Filter duplicates just in case offset drifted
                    setArticles(prev => {
                        const existingIds = new Set(prev.map(a => a.article_id));
                        const newItems = data.filter(a => !existingIds.has(a.article_id));
                        return [...prev, ...newItems];
                    });
                }

            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
                setFetchingMore(false);
            }
        };

        const retryFallback = async () => {
            // Manual fallback fetch (offset 0, no prefs)
            try {
                const p = new URLSearchParams();
                p.set('limit', PAGE_SIZE.toString());
                p.set('offset', '0');
                const data = await fetchJSON(`/articles/search?${p.toString()}`);
                setArticles(data);
                if(data.length < PAGE_SIZE) setHasMore(false);
            } finally {
                setLoading(false);
            }
        };

        fetchArticles();

    }, [prefs, offset, isFallback]);


    // 3. Infinite Scroll Observer
    // This ref is attached to the LAST element in the list.
    const observer = useRef();
    const lastArticleElementRef = useCallback(node => {
        if (loading || fetchingMore) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setOffset(prevOffset => prevOffset + PAGE_SIZE);
            }
        });

        if (node) observer.current.observe(node);
    }, [loading, fetchingMore, hasMore]);


    // --- UI Render Helpers ---
    const header = useMemo(() => (
        <>
            <div className="kicker">
                {isFallback ? 'Global Feed' : 'Your Briefing'}
            </div>
            <h2 className="headline text-2xl">
                {isFallback ? 'Top Stories' : 'Short reads'}
            </h2>
            {isFallback && (
                <p className="byline mb-2">
                    We couldn't find fresh news matching your specific filters today, so here are the latest top stories.
                </p>
            )}
            <div className="rule mb-4" />
        </>
    ), [isFallback]);

    if (loading && offset === 0) {
        return (
            <div className="space-y-4 pt-2">
                {header}
                <div className="animate-pulse space-y-4">
                    {[1,2,3].map(i => (
                        <div key={i} className="h-32 bg-slate-200 dark:bg-white/5 rounded-xl border rule" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-10">
            {header}

            {articles.length === 0 && !loading && (
                <div className="byline">No articles available right now.</div>
            )}

            {articles.map((a, index) => {
                const id = a.article_id;
                const isOpen = !!expanded[id];
                const text = a.description || '';
                const preview = text.slice(0, 180);
                const isLong = text.length > 180;
                const isLastElement = index === articles.length - 1;

                // --- NEW TIME LOGIC ---
                const timeAgo = (() => {
                    if (!a.created_at) return '';
                    const date = new Date(a.created_at);
                    const now = new Date();
                    const diffMs = now - date;
                    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

                    if (diffHrs < 1) return 'Just now';
                    if (diffHrs < 24) return `${diffHrs}h ago`;
                    return date.toLocaleDateString(); // e.g. 11/24/2025
                })();
                // ----------------------

                return (
                    <article
                        ref={isLastElement ? lastArticleElementRef : null}
                        key={`${id}-${index}`}
                        className="rounded-xl border rule bg-white/80 dark:bg-black/30 p-4 transition-all"
                    >
                        <div className="flex justify-between items-start">
                            <div className="kicker mb-1">
                                {a.news_source}
                                {a.sections && a.sections.length > 0 && ` • ${a.sections[0]}`}
                            </div>

                            {/* UPDATED DISPLAY */}
                            <div className="byline">{timeAgo}</div>
                        </div>

                        <h3 className="headline text-lg mb-2">{a.title}</h3>

                        <p className="text-sm text-slate-700 dark:text-[#a8a49d] leading-relaxed">
                            {isOpen ? text : `${preview}${isLong ? '...' : ''}`}
                        </p>

                        {isLong && (
                            <button
                                onClick={() => setExpanded(prev => ({ ...prev, [id]: !isOpen }))}
                                className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                            >
                                {isOpen ? 'Show Less' : 'Read More'}
                            </button>
                        )}
                    </article>
                );
            })}

            {fetchingMore && (
                <div className="text-center py-4 byline animate-pulse">
                    Loading older articles...
                </div>
            )}

            {!hasMore && articles.length > 0 && (
                <div className="text-center py-6 byline">
                    You're all caught up.
                </div>
            )}
        </div>
    );
}