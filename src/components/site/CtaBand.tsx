"use client";

import { motion } from "framer-motion";
import type { SectionData } from "@/lib/content";
import { ArrowUpRight, WhatsAppIcon } from "./icons";

export default function CtaBand({ cta, waUrl }: { cta: SectionData["cta"]; waUrl: string }) {
  return (
    <section className="bg-brand py-16 sm:py-20">
      <div className="container-site flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.22em] text-ink/70">
            <span className="h-px w-8 bg-ink/50" />
            {cta.eyebrow}
          </p>
          <h2 className="mt-4 font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-[2.6rem]">
            {cta.title}
            <br />
            {cta.titleAccent}
          </h2>
        </motion.div>

        <motion.a
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.15 }}
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn bg-white text-ink shadow-lift hover:-translate-y-0.5 hover:bg-ink hover:text-white"
        >
          <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
          {cta.button}
          <ArrowUpRight className="h-4 w-4" />
        </motion.a>
      </div>
    </section>
  );
}
