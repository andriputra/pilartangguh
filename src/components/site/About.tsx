import type { SectionData } from "@/lib/content";
import Reveal from "./Reveal";
import { ABOUT_ICONS, ArrowUpRight } from "./icons";

export default function About({
  about,
  waUrl,
}: {
  about: SectionData["about"];
  waUrl: string;
}) {
  return (
    <section id="profil" className="scroll-mt-24 py-20 sm:py-28">
      <div className="container-site">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="eyebrow">{about.eyebrow}</p>
            <h2 className="mt-4 font-display text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-[2.6rem]">
              {about.title}{" "}
              <span className="text-brand">{about.titleAccent}</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="lg:pt-10">
            <p className="max-w-md text-[15px] leading-relaxed text-ink/60">{about.body}</p>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-6 inline-flex items-center gap-2 border-b border-ink pb-1 text-sm font-bold transition-colors hover:border-brand hover:text-brand"
            >
              {about.cta}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {about.cards.map((card, i) => {
            const Icon = ABOUT_ICONS[card.icon] ?? ABOUT_ICONS.shield;
            return (
              <Reveal key={card.title} delay={0.1 + i * 0.1}>
                <div
                  className={`group h-full rounded-lg p-6 shadow-card transition-transform duration-300 hover:-translate-y-1 sm:p-7 ${
                    card.dark ? "bg-ink text-white" : "bg-white text-ink"
                  }`}
                >
                  <Icon
                    className={`h-6 w-6 ${card.dark ? "text-brand" : "text-brand"} transition-transform duration-300 group-hover:scale-110`}
                  />
                  <h3 className="mt-8 font-display text-lg font-bold">{card.title}</h3>
                  <p className={`mt-2 text-[13px] leading-relaxed ${card.dark ? "text-white/60" : "text-ink/55"}`}>
                    {card.body}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
