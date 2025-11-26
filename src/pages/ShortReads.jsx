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

// --- HARDCODED DATE RANGE ---
const TARGET_START = '2025-11-25T00:00:00.000Z';
const TARGET_END   = '2025-11-25T23:59:59.999Z';

export default function ShortReads() {
    // Data State
    const [articles, setArticles] = useState([]);
    const [prefs, setPrefs] = useState(null);

    // Pagination & Logic State
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [fetchingMore, setFetchingMore] = useState(false);
    const [isFallback, setIsFallback] = useState(false);

    const [expanded, setExpanded] = useState({});

    // 1. Load User Preferences on Mount
    useEffect(() => {
        const init = async () => {
            try {
                const data = await preferencesService.getPreferences();
                let sources = [], sections = [];

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

    // 2. Fetch Logic
    useEffect(() => {
        if (!prefs) return;

        const fetchArticles = async () => {
            const isInitial = offset === 0;
            if (isInitial) setLoading(true);
            else setFetchingMore(true);

            try {
                const p = new URLSearchParams();
                p.set('limit', PAGE_SIZE.toString());
                p.set('offset', offset.toString());

                // --- HARDCODED DATE PARAMS ---
                p.set('startUtc', TARGET_START);
                p.set('endUtc', TARGET_END);

                // Apply prefs ONLY if we are NOT in fallback mode
                const shouldUsePrefs = !isFallback && (prefs.sources.length > 0 || prefs.sections.length > 0);

                if (shouldUsePrefs) {
                    if (prefs.sections.length) p.set('sections', prefs.sections.join(','));
                    if (prefs.sources.length)  p.set('sources', prefs.sources.join(','));
                }

                const data = await fetchJSON(`/articles/search?${p.toString()}`);

                // Fallback Logic
                if (isInitial && data.length === 0 && shouldUsePrefs) {
                    console.log("No matches for preferences on target date. Switching to Fallback.");
                    setIsFallback(true);
                    return;
                }

                if (data.length < PAGE_SIZE) {
                    setHasMore(false);
                }

                if (isInitial) {
                    setArticles(data);
                } else {
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

        fetchArticles();

    }, [prefs, offset, isFallback]);


    // 3. Infinite Scroll Observer
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


    const header = useMemo(() => (
        <>
            <div className="kicker">
                {isFallback ? 'Global Feed' : 'Your Briefing'}
            </div>
            <h2 className="headline text-2xl">
                {isFallback ? 'Top Stories' : 'Short reads'}
            </h2>
            <div className="byline mb-4">From Nov 25, 2025</div>
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
                <div className="byline">No articles available for this date.</div>
            )}

            {articles.map((a, index) => {
                const id = a.article_id;
                const isOpen = !!expanded[id];
                const text = a.description || '';
                const preview = text.slice(0, 180);
                const isLong = text.length > 180;
                const isLastElement = index === articles.length - 1;

                // Calculate relative time string
                const timeAgo = (() => {
                    if (!a.created_at) return '';
                    return new Date(a.created_at).toLocaleDateString();
                })();

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
                <div className="text-center py-4 byline animate-pulse">Loading older articles...</div>
            )}

            {!hasMore && articles.length > 0 && (
                <div className="text-center py-6 byline">You're all caught up.</div>
            )}
        </div>
    );
}