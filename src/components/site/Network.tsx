import type { SectionData } from "@/lib/content";
import Reveal from "./Reveal";
import { ExternalIcon } from "./icons";

export type PortalItem = {
  id: string;
  title: string;
  description: string;
  url: string | null;
  tag: string | null;
  status: string;
  number: number;
  dark: boolean;
  videos?: { title: string; url: string }[];
};

export default function Network({ network, portals }: { network: SectionData["network"]; portals: PortalItem[] }) {
  return (
    <section id="portal" className="scroll-mt-24 py-20 sm:py-28">
      <div className="container-site">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="eyebrow">{network.eyebrow}</p>
            <h2 className="mt-4 font-display text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-[2.6rem]">
              {network.title}{" "}
              <span className="text-brand">{network.titleAccent}</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="lg:pt-8">
            <p className="max-w-md text-[15px] leading-relaxed text-ink/60">{network.body}</p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {portals.map((p, i) => {
            const online = p.status.toUpperCase() === "ONLINE" && Boolean(p.url);
            const Wrapper: React.ElementType = online ? "a" : "div";
            return (
              <Reveal key={p.id} delay={0.05 * i}>
                <Wrapper
                  {...(online ? { href: p.url!, target: "_blank", rel: "noopener noreferrer" } : {})}
                  className={`group flex h-full min-h-[190px] flex-col rounded-lg p-5 shadow-card transition-transform duration-300 hover:-translate-y-1 sm:p-6 ${
                    p.dark ? "bg-ink text-white" : "bg-white text-ink"
                  } ${online ? "cursor-pointer" : "cursor-default"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] ${p.dark ? "text-white/70" : "text-ink/50"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-500" : "bg-brand"}`} />
                      {p.status}
                      {p.tag && (
                        <span className={`ml-1 rounded-sm border px-1.5 py-0.5 tracking-[0.12em] ${p.dark ? "border-white/20 text-white/70" : "border-line text-ink/50"}`}>
                          {p.tag}
                        </span>
                      )}
                    </span>
                    <span className="font-display text-sm font-extrabold text-brand">
                      {String(p.number).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-8 font-display text-lg font-bold leading-snug">{p.title}</h3>
                  <p className={`mt-1.5 text-[12.5px] leading-relaxed ${p.dark ? "text-white/55" : "text-ink/55"}`}>
                    {p.description}
                  </p>
                  {p.videos?.[0] &&
                    (online ? (
                      <p className={`mt-2.5 flex items-start gap-1.5 text-[11.5px] font-semibold leading-snug ${p.dark ? "text-brand" : "text-brand"}`}>
                        <span className="mt-px">▶</span>
                        <span className="line-clamp-2">{p.videos[0].title}</span>
                      </p>
                    ) : (
                      <a
                        href={p.videos[0].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`mt-2.5 flex items-start gap-1.5 text-[11.5px] font-semibold leading-snug transition-colors ${
                          p.dark ? "text-brand hover:text-white" : "text-brand hover:text-brand-dark"
                        }`}
                      >
                        <span className="mt-px">▶</span>
                        <span className="line-clamp-2">{p.videos[0].title}</span>
                      </a>
                    ))}
                  <div className="mt-auto flex items-end justify-between pt-4">
                    <span className={`text-[10px] ${p.dark ? "text-brand" : online ? "text-brand" : "text-ink/40"}`}>
                      {online ? p.url?.replace(/^https?:\/\//, "") : "URL segera hadir"}
                    </span>
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                        online
                          ? "bg-brand text-white group-hover:bg-brand-dark"
                          : p.dark
                            ? "bg-white/10 text-white/40"
                            : "bg-sand text-ink/30"
                      }`}
                    >
                      <ExternalIcon className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Wrapper>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
