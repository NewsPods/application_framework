// src-main/pages/onboarding/CustomizeTopics.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { topicSuggestions } from '../../utils/mockData';
import PreferencesService from '../../services/preferencesService';
import { useLoading } from '../../hooks/LoadingProvider.jsx'; // 👈 added
import Storage from '../../services/storage';

export default function CustomizeTopics(){
    const nav = useNavigate();
    const loading = useLoading(); // 👈 overlay controller

    const [topics, setTopics] = useState([]);
    const [input, setInput] = useState('');

    const add = (val) => {
        if (!val) return;
        if (topics.length >= 10) return;
        if (topics.includes(val)) return;
        setTopics([...topics, val]);
        setInput('');
    };

    const remove = (t) => setTopics(topics.filter(x => x !== t));

    const finish = async () => {
        const newspapers = (await Storage.get('np_sources')) || [];
        const sections = (await Storage.get('np_sections')) || [];

        const prefs = { newspapers, sections, topics };

        loading.show('Saving your preferences…'); // 👈 show overlay
        try {
            const result = await PreferencesService.updatePreferences(prefs);
            if (result?.success) {
                // optional small delay for smoother UX
                await new Promise(r => setTimeout(r, 600));
                nav('/app');
            } else {
                console.error('❌ Error saving preferences:', result?.error);
                // still navigate if that's your desired flow
                nav('/app');
            }
        } finally {
            loading.hide(); // 👈 hide overlay
        }
    };

    const skip = async () => {
        loading.show('Taking you to your feed…');
        try {
            nav('/app');
        } finally {
            loading.hide();
        }
    };

    return (
        <div className="max-w-lg mx-auto px-4 pt-24 pb-24">
            <div className="kicker">Customize</div>
            <h2 className="headline text-3xl">Add specific topics</h2>
            <div className="rule my-4" />

            {/* Suggestions */}
            <div className="mb-3 flex flex-wrap gap-2">
                {topicSuggestions.map((s) => (
                    <button
                        key={s}
                        onClick={() => add(s)}
                        className="px-3 py-1.5 rounded-full border rule bg-white/70 dark:bg-black/30 text-sm"
                    >
                        + {s}
                    </button>
                ))}
            </div>

            {/* Input */}
            <div className="flex items-center gap-2">
                <div className="kicker">{topics.length}/10</div>
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g., Tesla, Virat Kohli…"
                    className="flex-1 px-4 py-3 rounded-lg border rule bg-white/70 dark:bg-black/30"
                />
                <button
                    onClick={() => add(input)}
                    className="px-4 py-3 rounded-lg bg-slate-900 text-white dark:bg-amber-500 dark:text-black"
                >
                    Add
                </button>
            </div>

            {/* Selected topics */}
            <div className="mt-3 flex flex-wrap gap-2">
                {topics.map((t) => (
                    <span
                        key={t}
                        className="px-3 py-1.5 rounded-full bg-slate-900 text-white dark:bg-amber-500 dark:text-black text-sm"
                    >
            {t}
                        <button className="ml-2" onClick={() => remove(t)}>✕</button>
          </span>
                ))}
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-between">
                <button
                    onClick={skip}
                    className="px-4 py-3 rounded-lg border rule"
                >
                    Skip
                </button>
                <button
                    onClick={finish}
                    className="px-4 py-3 rounded-lg bg-slate-900 text-white dark:bg-amber-500 dark:text-black"
                >
                    Finish
                </button>
            </div>
        </div>
    );
}
