import type { SectionData } from "@/lib/content";
import Reveal from "./Reveal";
import { ExternalIcon } from "./icons";

export type PortalItem = {
  id: string;
  title: string;
  description: string;
  image: string | null;
  imageAlt: string | null;
  url: string | null;
  tag: string | null;
  status: string;
  number: number;
  dark: boolean;
  videos?: { title: string; url: string }[];
};

export default function Network({ network, portals }: { network: SectionData["network"]; portals: PortalItem[] }) {
  const featured = portals.filter((portal) => portal.status.toUpperCase() === "ONLINE");
  const upcoming = portals.filter((portal) => portal.status.toUpperCase() !== "ONLINE");

  return (
    <section id="portal" className="scroll-mt-24 py-20 sm:py-24">
      <div className="container-site">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="eyebrow">{network.eyebrow}</p>
            <h2 className="mt-4 font-display text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-[2.6rem]">
              {network.title}{" "}<span className="text-brand">{network.titleAccent}</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="lg:pt-8">
            <p className="max-w-md text-[15px] leading-relaxed text-ink/60">{network.body}</p>
          </Reveal>
        </div>

        {featured.length > 0 && (
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3" data-portal-grid>
            {featured.map((portal, index) => (
              <Reveal key={portal.id} delay={index * 0.05} className="min-w-0">
                <article className={`group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border shadow-card transition-[transform,box-shadow] duration-300 hover:shadow-lg motion-safe:hover:-translate-y-1 ${portal.dark ? "border-ink bg-ink text-white" : "border-line/70 bg-white text-ink"}`}>
                  <div className="flex aspect-video w-full items-center justify-center border-b border-line/50 bg-white">
                    {portal.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={portal.image} alt={portal.imageAlt || portal.title} width={1400} height={788} loading="lazy" decoding="async" className="h-full w-full object-contain" />
                    ) : (
                      <span className="px-6 text-center font-display text-2xl font-extrabold tracking-tight text-ink/20">{portal.title}</span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex min-h-6 flex-wrap items-center justify-between gap-2">
                      <div className={`flex flex-wrap items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] ${portal.dark ? "text-white/60" : "text-ink/50"}`}>
                        <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{portal.status}</span>
                        {portal.tag && <span className={`rounded-sm border px-1.5 py-0.5 ${portal.dark ? "border-white/20" : "border-line"}`}>{portal.tag}</span>}
                      </div>
                      <span className="font-display text-xs font-extrabold text-brand">{String(portal.number).padStart(2, "0")}</span>
                    </div>
                    <h3 className="mt-4 break-words font-display text-xl font-bold leading-snug">{portal.title}</h3>
                    <p className={`mt-2 break-words text-[13px] leading-relaxed ${portal.dark ? "text-white/60" : "text-ink/55"}`}>{portal.description}</p>
                    {portal.videos?.[0] && (
                      <a href={portal.videos[0].url} target="_blank" rel="noopener noreferrer" className="mt-3 line-clamp-2 text-xs font-semibold leading-relaxed text-brand hover:underline focus-visible:outline-brand">
                        <span className="font-normal">Episode terbaru · </span>{portal.videos[0].title}
                      </a>
                    )}
                    <div className="mt-auto pt-5">
                      <div className={`flex items-center justify-between gap-3 border-t pt-4 ${portal.dark ? "border-white/10" : "border-line/70"}`}>
                        {portal.url ? (
                          <>
                            <span className={`min-w-0 truncate text-[10px] ${portal.dark ? "text-white/45" : "text-ink/45"}`}>{portal.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
                            <a href={portal.url} target="_blank" rel="noopener noreferrer" aria-label={`Kunjungi ${portal.title}`} className="inline-flex shrink-0 items-center gap-2 rounded-md bg-brand px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                              Kunjungi <ExternalIcon className="h-3.5 w-3.5" aria-hidden="true" />
                            </a>
                          </>
                        ) : <span className={`text-xs ${portal.dark ? "text-white/50" : "text-ink/45"}`}>Tautan belum tersedia</span>}
                      </div>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="mt-5 space-y-3" data-portal-upcoming>
            {upcoming.map((portal, index) => (
              <Reveal key={portal.id} delay={index * 0.05}>
                <article className="flex flex-col gap-3 rounded-lg border border-line bg-sand/50 px-5 py-4 sm:flex-row sm:items-center sm:gap-5">
                  <span className="inline-flex shrink-0 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink/55">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand" />{portal.status}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words font-display text-sm font-bold">{portal.title}</h3>
                      {portal.tag && <span className="rounded-sm border border-line px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ink/50">{portal.tag}</span>}
                    </div>
                    <p className="mt-1 break-words text-xs leading-relaxed text-ink/55">{portal.description}</p>
                    {portal.videos?.[0] && <a href={portal.videos[0].url} target="_blank" rel="noopener noreferrer" className="mt-2 block text-xs font-semibold text-brand hover:underline">Episode terbaru · {portal.videos[0].title}</a>}
                  </div>
                  <span className="hidden font-display text-xs font-extrabold text-ink/30 sm:block">{String(portal.number).padStart(2, "0")}</span>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
