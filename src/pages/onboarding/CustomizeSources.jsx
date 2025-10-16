import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { newspapers } from '../../utils/mockData';
import Chip from '../../components/ui/Chip';

export default function CustomizeSources(){
    const nav = useNavigate();
    const [sel, setSel] = useState([]);
    const toggle = (name)=> setSel(s => s.includes(name) ? s.filter(x=>x!==name) : [...s, name]);
    const next = ()=>{ localStorage.setItem('np_sources', JSON.stringify(sel)); nav('/onboarding/sections'); };
    return (
        <div className="max-w-lg mx-auto px-4 pt-24 pb-20">
            <div className="kicker">Customize</div>
            <h2 className="headline text-3xl">Pick your newspapers</h2>
            <div className="rule my-4" />
            <div className="flex flex-wrap gap-2">
                {newspapers.map(n => (
                    <Chip key={n.id} selected={sel.includes(n.name)} onClick={()=>toggle(n.name)}>{n.icon} {n.name}</Chip>
                ))}
            </div>
            <div className="mt-6 flex justify-end">
                <button onClick={next} className="px-4 py-3 rounded-lg bg-slate-900 text-white dark:bg-amber-500 dark:text-black">Next</button>
            </div>
        </div>
    );
}