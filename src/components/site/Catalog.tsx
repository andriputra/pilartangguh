"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import type { SectionData } from "@/lib/content";
import { ArrowUpRight } from "./icons";

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  badge: string | null;
  category: { name: string };
};

export default function Catalog({
  catalog,
  categories,
  products,
  waBase,
}: {
  catalog: SectionData["catalog"];
  categories: { id: string; name: string }[];
  products: CatalogProduct[];
  waBase: string;
}) {
  const [active, setActive] = useState<string>("all");
  const shown = useMemo(
    () => (active === "all" ? products : products.filter((p) => p.category.name === active)),
    [active, products]
  );

  return (
    <section id="katalog" className="scroll-mt-24 bg-sand/70 py-20 sm:py-28">
      <div className="container-site">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="eyebrow">{catalog.eyebrow}</p>
            <h2 className="mt-4 font-display text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-[2.6rem]">
              {catalog.title}{" "}
              <span className="text-brand">{catalog.titleAccent}</span>
            </h2>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="max-w-md self-end text-[15px] leading-relaxed text-ink/60"
          >
            {catalog.body}
          </motion.p>
        </div>

        <LayoutGroup>
          <div className="mt-10 flex flex-wrap gap-2" role="tablist" aria-label="Filter kategori">
            {["all", ...categories.map((c) => c.name)].map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={active === tab}
                onClick={() => setActive(tab)}
                className={`relative rounded-md px-4 py-2 text-[13px] font-semibold transition-colors ${
                  active === tab ? "text-white" : "bg-white text-ink/70 hover:text-ink"
                }`}
              >
                {active === tab && (
                  <motion.span
                    layoutId="catalog-tab"
                    className="absolute inset-0 rounded-md bg-ink"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{tab === "all" ? "Semua" : tab}</span>
              </button>
            ))}
          </div>

          <motion.div layout className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {shown.map((p, i) => (
                <motion.a
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  href={`${waBase}${encodeURIComponent(`Halo tim PilarTangguh, saya tertarik dengan ${p.name}. Bisa dibantu?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group overflow-hidden rounded-lg bg-white shadow-card transition-shadow hover:shadow-lift"
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {p.image ? (
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        sizes="(max-width: 640px) 45vw, 260px"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-sand text-xs text-muted">
                        Belum ada gambar
                      </div>
                    )}
                    {p.badge && (
                      <span className="absolute left-3 top-3 rounded-sm bg-brand px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                        {p.badge}
                      </span>
                    )}
                    <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-md bg-white text-ink shadow-card transition-colors group-hover:bg-ink group-hover:text-white">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="p-4 sm:p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
                      {p.category.name}
                    </p>
                    <div className="mt-1.5 flex items-start justify-between gap-2">
                      <h3 className="font-display text-[15px] font-bold leading-snug sm:text-base">{p.name}</h3>
                      <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-ink/40 transition-all group-hover:text-brand" />
                    </div>
                  </div>
                </motion.a>
              ))}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      </div>
    </section>
  );
}
