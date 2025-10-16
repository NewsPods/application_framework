import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sections as ALL } from '../../utils/mockData';

export default function CustomizeSections(){
    const nav = useNavigate(); const [sel, setSel] = useState([]);
    const toggle = id => setSel(s => s.includes(id) ? s.filter(x=>x!==id) : [...s,id]);
    const next = ()=>{ localStorage.setItem('np_sections', JSON.stringify(sel)); nav('/onboarding/topics'); };
    return (
        <div className="max-w-lg mx-auto px-4 pt-24 pb-20">
            <div className="kicker">Customize</div>
            <h2 className="headline text-3xl">Choose sections</h2>
            <div className="rule my-4" />
            <div className="space-y-2">
                {ALL.map(s => (
                    <label key={s.id} className="flex items-center gap-3 px-3 py-2 rounded border rule bg-white/70 dark:bg-black/30">
                        <input type="checkbox" checked={sel.includes(s.name)} onChange={()=>toggle(s.name)} />
                        <span>{s.name}</span>
                    </label>
                ))}
            </div>
            <div className="mt-6 flex justify-end">
                <button onClick={next} className="px-4 py-3 rounded-lg bg-slate-900 text-white dark:bg-amber-500 dark:text-black">Next</button>
            </div>
        </div>
    );
}