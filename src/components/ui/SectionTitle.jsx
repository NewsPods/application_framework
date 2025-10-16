export default function SectionTitle({children, sub}){
    return (
        <div className="mb-3">
            <div className="kicker">{sub}</div>
            <h3 className="headline text-2xl">{children}</h3>
            <div className="rule mt-2" />
        </div>
    );
}