"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { SectionData } from "@/lib/content";
import { ArrowRight, ArrowUpRight, ChatIcon } from "./icons";

const ease = [0.22, 1, 0.36, 1] as const;

export default function Hero({
  hero,
  stats,
  waUrl,
}: {
  hero: SectionData["hero"];
  stats: SectionData["stats"]["items"];
  waUrl: string;
}) {
  return (
    <section className="relative overflow-hidden pb-16 pt-28 sm:pt-36 lg:pb-24">
      <div className="container-site grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="eyebrow flex items-center gap-3"
          >
            <span className="h-px w-8 bg-brand" />
            {hero.eyebrow}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease }}
            className="mt-5 font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-[4.2rem]"
          >
            {hero.title}
            <br />
            <span className="text-brand">{hero.titleAccent}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16, ease }}
            className="mt-6 max-w-md text-[15px] leading-relaxed text-ink/60"
          >
            {hero.body}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24, ease }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <a href="/#katalog" className="btn-primary">
              {hero.primaryCta}
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-ink/80 transition hover:text-brand"
            >
              <ChatIcon className="h-4 w-4" />
              {hero.secondaryCta}
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.36 }}
            className="mt-12 flex gap-8 sm:gap-12"
          >
            {stats.map((s, i) => (
              <div key={s.label} className={i > 0 ? "border-l border-ink/15 pl-8 sm:pl-12" : ""}>
                <p className="font-display text-2xl font-extrabold sm:text-3xl">{s.value}</p>
                <p className="mt-1 text-[11px] leading-snug text-ink/50 sm:text-xs">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92, rotate: -3 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease }}
          className="relative mx-auto w-full max-w-md lg:max-w-none"
        >
          <div className="relative rotate-2 rounded-sm bg-white p-3 pb-10 shadow-polaroid transition-transform duration-500 hover:rotate-0 sm:p-4 sm:pb-12">
            <Image
              src={hero.image}
              alt="Peralatan keselamatan kerja PilarTangguh"
              width={1024}
              height={1280}
              priority
              className="aspect-[4/5] w-full rounded-sm object-cover"
            />
            <p className="absolute bottom-3 right-4 font-display text-[10px] uppercase tracking-widest text-ink/30 sm:bottom-4 sm:right-5">
              Equipment
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 24, rotate: 8 }}
            animate={{ opacity: 1, x: 0, rotate: 6 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="absolute -right-2 -top-6 w-44 rounded-md bg-brand p-4 text-white shadow-lift sm:-right-6 sm:-top-8"
          >
            <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest">
              PILARTANGGUH
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
            <p className="mt-3 font-display text-lg font-extrabold uppercase leading-tight">{hero.badge}</p>
            <p className="mt-1 text-[10px] font-medium opacity-90">({hero.badgeSub})</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="absolute -bottom-5 -left-2 flex items-center gap-3 rounded-md bg-ink px-4 py-3 text-white shadow-lift sm:-left-6"
          >
            <Image src="/images/logo-mark.png" alt="" width={28} height={28} className="rounded-full" />
            <div>
              <p className="text-[10px] text-white/60">{hero.stampTitle}</p>
              <p className="font-display text-sm font-bold">{hero.stampText}</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
