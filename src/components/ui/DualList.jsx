import React from 'react';

export default function DualList({ leftTitle='Available', rightTitle='Selected', left=[], right=[], onMoveLeft, onMoveRight }){
    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="border rule rounded-lg p-3 bg-white/60 dark:bg-black/20">
                <div className="kicker mb-2">{leftTitle}</div>
                <div className="space-y-2 max-h-64 overflow-auto">
                    {left.map((it)=> (
                        <button key={it} onClick={()=>onMoveRight(it)} className="w-full text-left px-3 py-2 rounded border rule hover:bg-white/70 dark:hover:bg-white/10">{it}</button>
                    ))}
                </div>
            </div>
            <div className="border rule rounded-lg p-3 bg-white/60 dark:bg-black/20">
                <div className="kicker mb-2">{rightTitle}</div>
                <div className="space-y-2 max-h-64 overflow-auto">
                    {right.map((it)=> (
                        <button key={it} onClick={()=>onMoveLeft(it)} className="w-full text-left px-3 py-2 rounded border rule bg-slate-900 text-white dark:bg-amber-500 dark:text-black">{it} <span className="float-right">✕</span></button>
                    ))}
                </div>
            </div>
        </div>
    );
}