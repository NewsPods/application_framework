// src/pages/ShortReads.jsx
import React, { useEffect, useMemo, useState } from 'react';

/** Local helper: safe JSON fetch that always sends the token (no global overlap) */
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
    const ctype = res.headers.get('content-type') || '';
    const body = ctype.includes('application/json') ? await res.json() : await res.text();
    if (!res.ok) {
        const msg = typeof body === 'string' ? body : body?.error || `HTTP ${res.status}`;
        throw new Error(msg);
    }
    return body;
}

/** Compute IST day bounds from a UTC ISO timestamp, returning UTC ISO bounds */
function istDayBoundsFromIso(iso) {
    const dt = new Date(iso);             // UTC time from DB
    const istOffsetMin = 330;             // IST = UTC+5:30
    const utcMs = dt.getTime() - istOffsetMin * 60 * 1000; // shift to “IST clock” in UTC space
    const d = new Date(utcMs);
    const y = d.getUTCFullYear(), m = d.getUTCMonth(), day = d.getUTCDate();
    const startUtc = new Date(Date.UTC(y, m, day, 18, 30));       // 00:00 IST
    const endUtc   = new Date(Date.UTC(y, m, day + 1, 18, 30));   // 24:00 IST
    const istDateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { istDate: istDateStr, startUtc: startUtc.toISOString(), endUtc: endUtc.toISOString() };
}

/** Normalize preferences:
 * - If server returned array rows [{preference_type, preference_value, ...}], fold into buckets
 * - If server already returned {newspapers, sections, topics}, pass through
 */
function normalizePrefs(prefsPayload) {
    if (!prefsPayload) return { newspapers: [], sections: [], topics: [] };
    if (Array.isArray(prefsPayload)) {
        const out = { newspapers: [], sections: [], topics: [] };
        for (const r of prefsPayload) {
            if (r.preference_type === 'newspaper') out.newspapers.push(r.preference_value);
            else if (r.preference_type === 'section') out.sections.push(r.preference_value);
            else if (r.preference_type === 'topic') out.topics.push(r.preference_value);
        }
        return out;
    }
    // already normalized
    return {
        newspapers: prefsPayload.newspapers || [],
        sections: prefsPayload.sections || [],
        topics: prefsPayload.topics || [],
    };
}

export default function ShortReads() {
    const [loading, setLoading] = useState(true);
    const [label, setLabel] = useState('Short reads');
    const [prefs, setPrefs] = useState({ newspapers: [], sections: [], topics: [] });
    const [articles, setArticles] = useState([]);
    const [expanded, setExpanded] = useState({}); // { [article_id]: true }

    // 1) Load user preferences
    useEffect(() => {
        (async () => {
            try {
                const data = await fetchJSON('/preferences'); // your existing route
                // data: { success, preferences: rows[] } or normalized object (if you change it later)
                const norm = normalizePrefs(data?.preferences);
                setPrefs(norm);
            } catch (err) {
                console.error('Failed to fetch preferences:', err);
                setPrefs({ newspapers: [], sections: [], topics: [] });
            }
        })();
    }, []);

    // 2) Load latest-available-day feed based on prefs; fallback to general feed (recent 50)
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const sections = prefs.sections || [];
                const sources  = prefs.newspapers || [];

                const qs = (obj) => {
                    const p = new URLSearchParams();
                    if (obj.sections?.length) p.set('sections', obj.sections.join(','));
                    if (obj.sources?.length)  p.set('sources',  obj.sources.join(','));
                    if (obj.startUtc) p.set('startUtc', obj.startUtc);
                    if (obj.endUtc)   p.set('endUtc',   obj.endUtc);
                    return `?${p.toString()}`;
                };

                // Probe across all time to find newest matching article (server orders by created_at DESC)
                const wideStart = '1970-01-01T00:00:00.000Z';
                const wideEnd   = '2100-01-01T00:00:00.000Z';
                const probe = await fetchJSON(`/articles/search${qs({ sections, sources, startUtc: wideStart, endUtc: wideEnd })}`);

                if (Array.isArray(probe) && probe.length > 0) {
                    // Found matches → load that whole IST day
                    const latestIso = probe[0].created_at;
                    const { istDate, startUtc, endUtc } = istDayBoundsFromIso(latestIso);
                    const dayRows = await fetchJSON(`/articles/search${qs({ sections, sources, startUtc, endUtc })}`);
                    setArticles(dayRows || []);
                    setLabel(`Short reads — ${istDate}`);
                } else {
                    // Fallback: general feed (most recent 50 across everything)
                    const general = await fetchJSON(`/articles/search${qs({ startUtc: wideStart, endUtc: wideEnd })}`);
                    setArticles((general || []).slice(0, 50));
                    setLabel('general feed');
                }
            } catch (err) {
                console.error('Failed to load short reads:', err);
                try {
                    // Robust fallback to general feed
                    const fallback = await fetchJSON('/articles/search?startUtc=1970-01-01T00:00:00.000Z&endUtc=2100-01-01T00:00:00.000Z');
                    setArticles((fallback || []).slice(0, 50));
                    setLabel('general feed');
                } catch {
                    setArticles([]);
                    setLabel('general feed');
                }
            } finally {
                setLoading(false);
            }
        })();
        // Trigger when prefs change
    }, [prefs.sections.join(','), prefs.newspapers.join(',')]);

    const header = useMemo(() => (
        <>
            <div className="kicker">{label}</div>
            <h2 className="headline text-2xl">Skim the paper</h2>
            <div className="rule mb-2" />
        </>
    ), [label]);

    if (loading) {
        return (
            <div className="space-y-4">
                {header}
                <div className="byline">Loading…</div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>

            </div>
            {header}
            {articles.length === 0 && (
                <div className="byline">No articles available right now.</div>
            )}
            {articles.map(a => {
                const id = a.article_id;
                const isOpen = !!expanded[id];
                const text = a.description || '';
                const preview = text.slice(0, 240);
                const sectionsAgg = Array.isArray(a.sections) && a.sections.length ? a.sections.join(', ') : (a.section || '');

                return (
                    <article key={id} className="rounded-xl border rule bg-white/80 dark:bg-black/30 p-4">
                        <div className="kicker">
                            {a.news_source}{sectionsAgg ? ` • ${sectionsAgg}` : ''}
                        </div>
                        <h3 className="headline text-lg">{a.title}</h3>

                        <p className="mt-2 text-sm text-slate-700 dark:text-amber-50/80">
                            {isOpen ? (text || '—') : (preview + (text.length > 240 ? '…' : ''))}
                        </p>

                        {text.length > 240 && (
                            <button
                                onClick={() => setExpanded(prev => ({ ...prev, [id]: !isOpen }))}
                                className="inline-block mt-3 underline text-sm"
                            >
                                {isOpen ? 'Show less ↑' : 'Read full article →'}
                            </button>
                        )}
                    </article>
                );
            })}
        </div>
    );
}
