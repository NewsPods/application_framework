export default function Chip({selected, children, onClick}){
    return (
        <button onClick={onClick} className={`px-3 py-1.5 rounded-full text-sm border ${selected? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-black':'bg-white/70 dark:bg-black/30 text-slate-800 dark:text-amber-100'} rule`}>{children}{selected && <span className="ml-2">✕</span>}</button>
    );
}