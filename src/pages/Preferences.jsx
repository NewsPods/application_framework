import React, { useEffect, useMemo, useState } from 'react';
import DualList from '../components/ui/DualList';
import { newspapers, sections } from '../utils/mockData';
import preferencesService from '../services/preferencesService';

function normalizePrefs(payload) {
    if (!payload) return { newspapers: [], sections: [], topics: [] };

    // Case 1: backend returns rows (your current /api/preferences shape)
    if (Array.isArray(payload)) {
        const out = { newspapers: [], sections: [], topics: [] };
        for (const r of payload) {
            if (r.preference_type === 'newspaper') out.newspapers.push(r.preference_value);
            else if (r.preference_type === 'section') out.sections.push(r.preference_value);
            else if (r.preference_type === 'topic') out.topics.push(r.preference_value);
        }
        return out;
    }

    // Case 2: already grouped
    return {
        newspapers: payload.newspapers || [],
        sections: payload.sections || [],
        topics: payload.topics || [],
    };
}

export default function Preferences() {
    // Local state
    const [loading, setLoading] = useState(true);
    const [selSources, setSelSources] = useState([]);
    const [selSections, setSelSections] = useState([]);
    const [topics, setTopics] = useState([]);
    const [input, setInput] = useState('');

    // Available options (from your mockData catalogue)
    const allSources = useMemo(() => newspapers.map(n => n.name), []);
    const allSections = useMemo(() => sections.map(s => s.name), []);

    // Derive dual-list sides
    const srcLeft = allSources.filter(s => !selSources.includes(s));
    const srcRight = selSources;
    const secLeft = allSections.filter(s => !selSections.includes(s));
    const secRight = selSections;

    // Load from DB on mount
    useEffect(() => {
        (async () => {
            try {
                const data = await preferencesService.getPreferences();
                const norm = normalizePrefs(data);
                // Defensive: only keep values that still exist in the catalogues
                const validSources = norm.newspapers.filter(v => allSources.includes(v));
                const validSections = norm.sections.filter(v => allSections.includes(v));
                setSelSources(validSources);
                setSelSections(validSections);
                setTopics(norm.topics || []);
            } catch (e) {
                console.error('Failed to load preferences', e);
            } finally {
                setLoading(false);
            }
        })();
        // allSources/allSections are stable due to useMemo over static mockData
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const save = async () => {
        const prefs = { newspapers: selSources, sections: selSections, topics };
        const res = await preferencesService.updatePreferences(prefs);
        if (!res?.success) {
            console.error('Save preferences failed:', res?.error);
            return;
        }
        // Re-fetch to stay perfectly in sync with DB (and catch any server-side transforms)
        try {
            const data = await preferencesService.getPreferences();
            const norm = normalizePrefs(data);
            const validSources = norm.newspapers.filter(v => allSources.includes(v));
            const validSections = norm.sections.filter(v => allSections.includes(v));
            setSelSources(validSources);
            setSelSections(validSections);
            setTopics(norm.topics || []);
        } catch (e) {
            console.error('Post-save fetch failed:', e);
        }
    };

    const addTopic = () => {
        const v = (input || '').trim();
        if (v && !topics.includes(v) && topics.length < 10) {
            setTopics([...topics, v]);
            setInput('');
        }
    };

    if (loading) {
        return <div className="kicker">Loading your preferences…</div>;
    }

    return (
        <div className="space-y-8">
            <div>

            </div>
            <section>
                <div className="kicker">Sources</div>
                <h3 className="headline text-xl">Your newspapers</h3>
                <div className="rule my-3" />
                <DualList
                    leftTitle="Available"
                    rightTitle="Selected"
                    left={srcLeft}
                    right={srcRight}
                    onMoveRight={(x) => setSelSources([...selSources, x])}
                    onMoveLeft={(x) => setSelSources(selSources.filter(s => s !== x))}
                />
            </section>

            <section>
                <div className="kicker">Sections</div>
                <h3 className="headline text-xl">Newspaper sections</h3>
                <div className="rule my-3" />
                <DualList
                    leftTitle="Available"
                    rightTitle="Selected"
                    left={secLeft}
                    right={secRight}
                    onMoveRight={(x) => setSelSections([...selSections, x])}
                    onMoveLeft={(x) => setSelSections(selSections.filter(s => s !== x))}
                />
            </section>

            <section>
                <div className="kicker">Topics</div>
                <h3 className="headline text-xl">Specific interests</h3>
                <div className="rule my-3" />
                <div className="flex items-center gap-2">
                    <div className="kicker">{topics.length}/10</div>
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') addTopic(); }}
                        placeholder="Add topic"
                        className="flex-1 px-4 py-3 rounded-lg border rule bg-white/70 dark:bg-black/30"
                    />
                    <button
                        onClick={addTopic}
                        className="px-4 py-3 rounded-lg bg-slate-900 text-white dark:bg-amber-500 dark:text-black"
                    >
                        Add
                    </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    {topics.map(t => (
                        <span
                            key={t}
                            className="px-3 py-1.5 rounded-full bg-slate-900 text-white dark:bg-amber-500 dark:text-black text-sm"
                        >
              {t}{' '}
                            <button className="ml-2" onClick={() => setTopics(topics.filter(x => x !== t))}>✕</button>
            </span>
                    ))}
                </div>
            </section>

            <div className="flex justify-end">
                <button
                    onClick={save}
                    className="px-4 py-3 rounded-lg bg-slate-900 text-white dark:bg-amber-500 dark:text-black"
                >
                    Save preferences
                </button>
            </div>
        </div>
    );
}
