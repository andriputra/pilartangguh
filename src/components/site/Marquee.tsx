export default function Marquee({ items }: { items: string[] }) {
  const group = (
    <div className="flex shrink-0 items-center">
      {items.map((item, i) => (
        <span key={i} className="flex items-center">
          <span className="mx-10 font-display text-xs font-semibold uppercase tracking-[0.3em] text-ink/40 sm:mx-16">
            {item}
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
        </span>
      ))}
    </div>
  );

  return (
    <div className="overflow-hidden border-y border-line bg-sand/60 py-4" aria-hidden>
      <div className="marquee-track">
        {group}
        {group}
      </div>
    </div>
  );
}
