"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import type { SectionData } from "@/lib/content";
import { ChevronLeftIcon, ChevronRightIcon, GridIcon, ListIcon, SearchIcon, WhatsAppIcon } from "./icons";

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  badge: string | null;
  description: string | null;
  code: string | null;
  price: string | null;
  specs: string[];
  createdAt: string;
  category: { name: string };
};

type Sort = "newest" | "az" | "za" | "category";
type View = "grid" | "list";

const ease = [0.22, 1, 0.36, 1] as const;

export default function CatalogBoard({
  products,
  categories,
  text,
  waBase,
  waUrl,
}: {
  products: CatalogProduct[];
  categories: { id: string; name: string }[];
  text: SectionData["catalogPage"];
  waBase: string;
  waUrl: string;
}) {
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [view, setView] = useState<View>("grid");
  const [page, setPage] = useState(1);

  const perPage = Math.max(3, Number(text.perPage) || 6);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products) map[p.category.name] = (map[p.category.name] || 0) + 1;
    return map;
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter((p) => {
      const inCategory = active === "all" || p.category.name === active;
      const haystack = [p.name, p.code, p.category.name, p.description, ...p.specs].join(" ").toLowerCase();
      return inCategory && (!q || haystack.includes(q));
    });

    const order = categories.map((c) => c.name);
    return [...list].sort((a, b) => {
      if (sort === "az") return a.name.localeCompare(b.name, "id");
      if (sort === "za") return b.name.localeCompare(a.name, "id");
      if (sort === "category") {
        const diff = order.indexOf(a.category.name) - order.indexOf(b.category.name);
        return diff !== 0 ? diff : a.name.localeCompare(b.name, "id");
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [active, categories, products, query, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  useEffect(() => {
    setPage(1);
  }, [active, query, sort]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const shown = filtered.slice((page - 1) * perPage, page * perPage);

  const results = text.resultsLabel
    .replace("{shown}", String(filtered.length))
    .replace("{total}", String(products.length));

  function waLink(name: string) {
    return `${waBase}${encodeURIComponent(`Halo tim PilarTangguh, saya ingin menanyakan ${name}. Bisa dibantu?`)}`;
  }

  const categoryList = (
    <>
      {(["all", ...categories.map((c) => c.name)] as string[]).map((tab) => {
        const on = active === tab;
        return (
          <button
            key={tab}
            type="button"
            aria-pressed={on}
            onClick={() => setActive(tab)}
            className={`relative flex w-full items-center justify-between rounded-md px-3.5 py-2.5 text-left text-[13px] font-semibold transition-colors ${
              on ? "text-white" : "text-ink/70 hover:text-ink"
            }`}
          >
            {on && (
              <motion.span layoutId="catalog-cat-active" className="absolute inset-0 rounded-md bg-ink" transition={{ type: "spring", stiffness: 360, damping: 32 }} />
            )}
            <span className="relative z-10">{tab === "all" ? text.allLabel : tab}</span>
            <span className={`relative z-10 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${on ? "bg-white/20 text-white" : "bg-sand text-ink/50"}`}>
              {tab === "all" ? products.length : counts[tab] || 0}
            </span>
          </button>
        );
      })}
    </>
  );

  return (
    <section id="katalog" className="scroll-mt-24 pb-20 pt-4 sm:pt-6">
      <div className="container-site grid gap-6 lg:grid-cols-[248px_1fr] lg:gap-8">
        {/* SIDEBAR */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="hidden rounded-lg border border-line bg-white p-4 shadow-card lg:block">
            <h2 className="px-1 pb-2 font-display text-[13px] font-extrabold uppercase tracking-wider text-ink/70">{text.sidebarTitle}</h2>
            <LayoutGroup>
              <div className="space-y-0.5">{categoryList}</div>
            </LayoutGroup>
          </div>

          <div className="hidden rounded-lg bg-ink p-5 text-white shadow-card lg:block">
            <p className="font-display text-[15px] font-bold leading-snug">{text.helpTitle}</p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-white/60">{text.helpBody}</p>
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn mt-4 w-full justify-center !bg-brand !py-2.5 !text-xs text-white hover:!bg-brand-dark">
              <WhatsAppIcon className="h-4 w-4" />
              {text.helpButton}
            </a>
          </div>
        </aside>

        <div>
          {/* chips mobile */}
          <div className="-mx-5 overflow-x-auto px-5 pb-1 lg:hidden">
            <LayoutGroup>
              <div className="flex w-max gap-2">
                {(["all", ...categories.map((c) => c.name)] as string[]).map((tab) => {
                  const on = active === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActive(tab)}
                      className={`relative shrink-0 rounded-md px-3.5 py-2 text-[12.5px] font-semibold transition-colors ${
                        on ? "text-white" : "bg-white text-ink/70"
                      }`}
                    >
                      {on && (
                        <motion.span layoutId="catalog-cat-active-mobile" className="absolute inset-0 rounded-md bg-ink" transition={{ type: "spring", stiffness: 360, damping: 32 }} />
                      )}
                      <span className="relative z-10">
                        {tab === "all" ? text.allLabelShort : tab}
                        <span className={`ml-1.5 text-[10px] ${on ? "text-white/60" : "text-ink/40"}`}>{tab === "all" ? products.length : counts[tab] || 0}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>
          </div>

          {/* TOOLBAR */}
          <div className="mt-3 flex flex-col gap-3 rounded-lg border border-line bg-white px-4 py-3 shadow-card sm:flex-row sm:items-center sm:justify-between lg:mt-0">
            <p className="text-[12.5px] text-ink/55">
              {results}
              {active !== "all" && <> · kategori <span className="font-bold text-ink">{active}</span></>}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[10rem] flex-1 sm:flex-none">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={text.searchPlaceholder}
                  aria-label="Cari peralatan"
                  className="input !py-2 !pl-9 !text-[12.5px] sm:w-56"
                />
              </div>
              <label className="flex items-center gap-2 text-[12px] font-semibold text-ink/50">
                <span className="hidden sm:inline">{text.sortLabel}</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                  aria-label="Urutkan produk"
                  className="input !w-auto !py-2 !text-[12.5px]"
                >
                  <option value="newest">{text.sortNewest}</option>
                  <option value="az">{text.sortAz}</option>
                  <option value="za">{text.sortZa}</option>
                  <option value="category">{text.sortCategory}</option>
                </select>
              </label>
              <div className="flex rounded-md border border-line bg-sand/60 p-0.5">
                {([
                  ["grid", GridIcon],
                  ["list", ListIcon],
                ] as [View, typeof GridIcon][]).map(([mode, Icon]) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={view === mode}
                    aria-label={mode === "grid" ? text.viewGrid : text.viewList}
                    onClick={() => setView(mode)}
                    className={`flex items-center gap-1.5 rounded-[5px] px-2.5 py-1.5 text-[11.5px] font-bold transition-colors ${
                      view === mode ? "bg-white text-ink shadow-card" : "text-ink/45 hover:text-ink"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{mode === "grid" ? text.viewGrid : text.viewList}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* HASIL */}
          {shown.length > 0 ? (
            <motion.div layout className={`mt-5 grid gap-4 ${view === "grid" ? "sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}>
              <AnimatePresence mode="popLayout">
                {shown.map((p, i) =>
                  view === "grid" ? (
                    <motion.article
                      key={p.id}
                      layout
                      initial={{ opacity: 0, y: 22, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.38, delay: Math.min(i, 6) * 0.04, ease }}
                      className="group flex flex-col overflow-hidden rounded-lg border border-line bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
                    >
                      <Link href={`/katalog/${p.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-sand">
                        {p.image ? (
                          <Image
                            src={p.image}
                            alt={p.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 340px"
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center text-xs text-muted">Belum ada gambar</span>
                        )}
                        {p.badge && (
                          <span className="absolute left-3 top-3 rounded-sm bg-brand px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                            {p.badge}
                          </span>
                        )}
                        {p.code && (
                          <span className="absolute right-3 top-3 rounded-sm bg-white/90 px-2 py-1 text-[10px] font-bold tracking-wide text-ink/70 backdrop-blur">
                            {p.code}
                          </span>
                        )}
                      </Link>

                      <div className="flex flex-1 flex-col p-5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">{p.category.name}</p>
                        <h3 className="mt-1.5 font-display text-[16px] font-bold leading-snug">
                          <Link href={`/katalog/${p.slug}`} className="transition-colors hover:text-brand">
                            {p.name}
                          </Link>
                        </h3>
                        {p.description && <p className="mt-2 text-[13px] leading-relaxed text-ink/55">{p.description}</p>}

                        {p.specs.length > 0 && (
                          <ul className="mt-3 space-y-1">
                            {p.specs.slice(0, 3).map((s) => (
                              <li key={s} className="flex items-start gap-2 text-[12px] text-ink/55">
                                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        )}

                        <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-3.5">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">{text.priceLabel}</p>
                            <p className="mt-0.5 text-[13px] font-bold leading-snug">{p.price || text.priceFallback}</p>
                          </div>
                          <a
                            href={waLink(p.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn !bg-ink !px-3 !py-2 !text-[11.5px] text-white hover:!bg-brand"
                          >
                            <WhatsAppIcon className="h-3.5 w-3.5" />
                            {text.askLabel}
                          </a>
                        </div>
                      </div>
                    </motion.article>
                  ) : (
                    <motion.article
                      key={p.id}
                      layout
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.34, delay: Math.min(i, 6) * 0.04, ease }}
                      className="group flex gap-4 overflow-hidden rounded-lg border border-line bg-white p-4 shadow-card transition-all duration-300 hover:border-brand/40 hover:shadow-lift"
                    >
                      <Link href={`/katalog/${p.slug}`} className="relative block h-24 w-32 shrink-0 overflow-hidden rounded-md bg-sand sm:h-28 sm:w-40">
                        {p.image ? (
                          <Image src={p.image} alt={p.name} fill sizes="160px" className="object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
                        ) : (
                          <span className="flex h-full items-center justify-center text-[10px] text-muted">Tanpa gambar</span>
                        )}
                      </Link>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-sm bg-brand-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-dark">{p.category.name}</span>
                          {p.badge && <span className="rounded-sm bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">{p.badge}</span>}
                          {p.code && <span className="text-[10.5px] font-bold tracking-wide text-ink/40">{p.code}</span>}
                        </div>
                        <h3 className="mt-1.5 font-display text-[15.5px] font-bold leading-snug">
                          <Link href={`/katalog/${p.slug}`} className="transition-colors hover:text-brand">
                            {p.name}
                          </Link>
                        </h3>
                        {p.description && <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-ink/55">{p.description}</p>}
                        {p.specs.length > 0 && (
                          <p className="mt-2 hidden text-[11.5px] text-ink/45 sm:block">{p.specs.join(" · ")}</p>
                        )}
                      </div>

                      <div className="flex w-28 shrink-0 flex-col items-end justify-between gap-2 border-l border-line pl-4">
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">{text.priceLabel}</p>
                          <p className="mt-0.5 text-[12.5px] font-bold leading-snug">{p.price || text.priceFallback}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <Link href={`/katalog/${p.slug}`} className="text-[11.5px] font-bold text-ink/60 transition-colors hover:text-brand">
                            {text.detailLabel}
                          </Link>
                          <a href={waLink(p.name)} target="_blank" rel="noopener noreferrer" className="btn !bg-ink !px-2.5 !py-1.5 !text-[11px] text-white hover:!bg-brand">
                            {text.askLabel}
                          </a>
                        </div>
                      </div>
                    </motion.article>
                  )
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 rounded-lg border border-dashed border-line bg-white px-6 py-14 text-center"
            >
              <p className="font-display text-lg font-bold">{text.emptyTitle}</p>
              <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-ink/55">{text.emptyBody}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActive("all");
                    setQuery("");
                  }}
                  className="btn-ghost !py-2 !text-xs"
                >
                  {text.resetLabel}
                </button>
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn-primary !py-2 !text-xs">
                  {text.recommendLabel}
                </a>
              </div>
            </motion.div>
          )}

          {/* PAGINASI */}
          {totalPages > 1 && (
            <nav aria-label="Navigasi halaman katalog" className="mt-7 flex items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((n) => Math.max(1, n - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 rounded-md border border-line bg-white px-3 py-2 text-[12px] font-bold text-ink/70 transition hover:border-ink/30 disabled:opacity-40"
              >
                <ChevronLeftIcon className="h-3.5 w-3.5" />
                {text.pagePrev}
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-current={n === page ? "page" : undefined}
                  onClick={() => setPage(n)}
                  className={`h-9 w-9 rounded-md text-[12.5px] font-bold transition-colors ${
                    n === page ? "bg-ink text-white" : "border border-line bg-white text-ink/60 hover:text-ink"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((n) => Math.min(totalPages, n + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 rounded-md border border-line bg-white px-3 py-2 text-[12px] font-bold text-ink/70 transition hover:border-ink/30 disabled:opacity-40"
              >
                {text.pageNext}
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </button>
            </nav>
          )}

          <p className="mt-8 flex items-start gap-2.5 rounded-md bg-sand/70 px-4 py-3.5 text-[12.5px] leading-relaxed text-ink/60">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            {text.note}
          </p>
        </div>
      </div>
    </section>
  );
}
