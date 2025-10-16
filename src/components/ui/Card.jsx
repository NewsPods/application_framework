export default function Card({children, className=''}){
    return <div className={`rounded-xl border rule bg-white/90 dark:bg-black/40 backdrop-blur p-4 ${className}`}>{children}</div>;
}