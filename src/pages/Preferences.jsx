import React, { useMemo, useState } from 'react';
import DualList from '../components/ui/DualList';
import { newspapers, sections } from '../utils/mockData';
import preferencesService from '../services/preferencesService';

export default function Preferences(){
    const user = JSON.parse(localStorage.getItem('currentUser')||'null');
    const initial = user?.preferences || { newspapers: [], sections: [], topics: [] };
    const [selSources, setSelSources] = useState(initial.newspapers);
    const [selSections, setSelSections] = useState(initial.sections);
    const [topics, setTopics] = useState(initial.topics||[]);
    const [input,setInput]=useState('');

    const allSources = useMemo(()=> newspapers.map(n=>n.name), []);
    const srcLeft = allSources.filter(s=>!selSources.includes(s)); const srcRight = selSources;
    const allSections = useMemo(()=> sections.map(s=>s.name), []);
    const secLeft = allSections.filter(s=>!selSections.includes(s)); const secRight = selSections;

    const save = async ()=>{
        const prefs = { newspapers: selSources, sections: selSections, topics };
        await preferencesService.updatePreferences(prefs);
    };

    const addTopic = ()=>{ if(input && !topics.includes(input) && topics.length<10){ setTopics([...topics,input]); setInput(''); } };

    return (
        <div className="space-y-8">
            <section>
                <div className="kicker">Sources</div>
                <h3 className="headline text-xl">Your newspapers</h3>
                <div className="rule my-3" />
                <DualList
                    leftTitle="Available"
                    rightTitle="Selected"
                    left={srcLeft}
                    right={srcRight}
                    onMoveRight={(x)=>setSelSources([...selSources, x])}
                    onMoveLeft={(x)=>setSelSources(selSources.filter(s=>s!==x))}
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
                    onMoveRight={(x)=>setSelSections([...selSections, x])}
                    onMoveLeft={(x)=>setSelSections(selSections.filter(s=>s!==x))}
                />
            </section>

            <section>
                <div className="kicker">Topics</div>
                <h3 className="headline text-xl">Specific interests</h3>
                <div className="rule my-3" />
                <div className="flex items-center gap-2">
                    <div className="kicker">{topics.length}/10</div>
                    <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Add topic" className="flex-1 px-4 py-3 rounded-lg border rule bg-white/70 dark:bg-black/30" />
                    <button onClick={addTopic} className="px-4 py-3 rounded-lg bg-slate-900 text-white dark:bg-amber-500 dark:text-black">Add</button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    {topics.map(t => (
                        <span key={t} className="px-3 py-1.5 rounded-full bg-slate-900 text-white dark:bg-amber-500 dark:text-black text-sm">{t} <button className="ml-2" onClick={()=>setTopics(topics.filter(x=>x!==t))}>✕</button></span>
                    ))}
                </div>
            </section>

            <div className="flex justify-end">
                <button onClick={save} className="px-4 py-3 rounded-lg bg-slate-900 text-white dark:bg-amber-500 dark:text-black">Save preferences</button>
            </div>
        </div>
    );
}
