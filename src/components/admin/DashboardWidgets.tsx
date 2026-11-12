"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BellIcon, CubeIcon, EditIcon, GridIcon, LinkIcon, MailIcon } from "@/components/site/icons";

/* ---------- animated number ---------- */

export function CountUp({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const start = performance.now();
    const duration = 700;
    setDisplay(0);
    // setInterval (bukan rAF) agar animasi tetap jalan saat tab di background
    const id = setInterval(() => {
      const p = Math.min(1, (performance.now() - start) / duration);
      setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p >= 1) clearInterval(id);
    }, 40);
    return () => clearInterval(id);
  }, [value]);
  return <span className={className}>{display}</span>;
}

/* ---------- KPI stat card ---------- */

export type StatCardProps = {
  href: string;
  label: string;
  value: number;
  sub: string;
  icon: "cube" | "grid" | "link" | "mail" | "bell" | "edit";
  tone?: "brand" | "emerald" | "red" | "ink";
};

const ICONS = {
  cube: CubeIcon,
  grid: GridIcon,
  link: LinkIcon,
  mail: MailIcon,
  bell: BellIcon,
  edit: EditIcon,
};

const TONES: Record<NonNullable<StatCardProps["tone"]>, string> = {
  brand: "bg-brand-light text-brand",
  emerald: "bg-emerald-50 text-emerald-600",
  red: "bg-red-50 text-red-600",
  ink: "bg-sand text-ink/70",
};

export function StatCard({ href, label, value, sub, icon, tone = "brand" }: StatCardProps) {
  const Icon = ICONS[icon];
  return (
    <Link
      href={href}
      className="group rounded-lg border border-line bg-white px-4 py-3.5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <div className="flex items-center justify-between">
        <span className={`flex h-8 w-8 items-center justify-center rounded-md ${TONES[tone]}`}>
          <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <ArrowUpRight className="h-3.5 w-3.5 text-ink/20 transition-colors group-hover:text-brand" aria-hidden="true" />
      </div>
      <p className="mt-2.5 font-display text-[22px] font-extrabold leading-none tabular-nums">
        <CountUp value={value} />
      </p>
      <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-ink/50">{label}</p>
      <p className="mt-0.5 truncate text-[11px] text-ink/40">{sub}</p>
    </Link>
  );
}

/* ---------- product distribution panel (tabs: per kategori / status) ---------- */

export type CategoryRow = { name: string; total: number; published: number };

export function OverviewPanel({ rows, published, hidden }: { rows: CategoryRow[]; published: number; hidden: number }) {
  const [tab, setTab] = useState<"kategori" | "status">("kategori");
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(id);
  }, []);

  const max = Math.max(1, ...rows.map((r) => r.total));
  const total = published + hidden;
  const pubPct = total ? Math.round((published / total) * 100) : 0;

  return (
    <div className="rounded-lg border border-line bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
        <h2 className="text-sm font-bold">Sebaran produk</h2>
        <div className="flex gap-1 rounded-md bg-sand/70 p-1" role="tablist" aria-label="Tampilan sebaran">
          {(
            [
              { id: "kategori", label: "Per kategori" },
              { id: "status", label: "Status tayang" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`rounded px-3 py-1 text-[11px] font-bold transition-colors ${
                tab === t.id ? "bg-white text-ink shadow-sm" : "text-ink/50 hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-4">
        {tab === "kategori" ? (
          rows.length === 0 ? (
            <p className="py-4 text-center text-[12px] text-ink/40">Belum ada kategori.</p>
          ) : (
            <div className="space-y-2.5">
              {rows.map((r) => (
                <div key={r.name} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate text-[12px] font-semibold text-ink/70 sm:w-40" title={r.name}>
                    {r.name}
                  </span>
                  <div className="h-6 flex-1 overflow-hidden rounded-md bg-sand/60">
                    <div
                      className="h-full rounded-md bg-gradient-to-r from-brand to-brand-dark transition-[width] duration-700 ease-out"
                      style={{ width: mounted ? `${Math.max(4, (r.total / max) * 100)}%` : "0%" }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right text-[12px] font-bold tabular-nums">
                    {r.total}
                    <span className="ml-1 font-normal text-ink/40">({r.published})</span>
                  </span>
                </div>
              ))}
              <p className="pt-1 text-[11px] text-ink/40">Angka dalam kurung = produk yang tayang.</p>
            </div>
          )
        ) : (
          <div className="flex flex-wrap items-center gap-6">
            <div
              className="relative h-32 w-32 shrink-0 rounded-full transition-all duration-700"
              style={{ background: mounted ? `conic-gradient(#F26B21 0% ${pubPct}%, #DDD8CF ${pubPct}% 100%)` : "conic-gradient(#DDD8CF 0% 100%)" }}
              role="img"
              aria-label={`${published} tayang, ${hidden} tersembunyi`}
            >
              <div className="absolute inset-[14px] flex flex-col items-center justify-center rounded-full bg-white">
                <span className="font-display text-xl font-extrabold tabular-nums">{total}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-ink/40">produk</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-brand" />
                <p className="text-[12px] font-semibold">
                  Tayang <span className="ml-1 tabular-nums text-ink/50">{published} produk · {pubPct}%</span>
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-line" />
                <p className="text-[12px] font-semibold">
                  Sembunyi <span className="ml-1 tabular-nums text-ink/50">{hidden} produk · {100 - pubPct}%</span>
                </p>
              </div>
              <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-brand hover:underline">
                Kelola status produk <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- activity feed with filter tabs ---------- */

export type ActivityItem = {
  id: string;
  kind: "produk" | "pesan" | "video";
  title: string;
  note: string;
  time: string;
  href: string;
};

const ACTIVITY_TABS = [
  { id: "all", label: "Semua" },
  { id: "produk", label: "Produk" },
  { id: "pesan", label: "Pesan" },
  { id: "video", label: "Video" },
] as const;

const ACTIVITY_ICONS = { produk: CubeIcon, pesan: MailIcon, video: LinkIcon };
const ACTIVITY_TONES = { produk: "bg-brand-light text-brand", pesan: "bg-emerald-50 text-emerald-600", video: "bg-sand text-ink/60" };

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  const [filter, setFilter] = useState<(typeof ACTIVITY_TABS)[number]["id"]>("all");
  const shown = filter === "all" ? items : items.filter((i) => i.kind === filter);

  return (
    <div className="rounded-lg border border-line bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
        <h2 className="text-sm font-bold">Aktivitas terakhir</h2>
        <div className="flex gap-1 rounded-md bg-sand/70 p-1" role="tablist" aria-label="Filter aktivitas">
          {ACTIVITY_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={filter === t.id}
              onClick={() => setFilter(t.id)}
              className={`rounded px-3 py-1 text-[11px] font-bold transition-colors ${
                filter === t.id ? "bg-white text-ink shadow-sm" : "text-ink/50 hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <ul className="divide-y divide-line/60">
        {shown.map((a) => {
          const Icon = ACTIVITY_ICONS[a.kind];
          return (
            <li key={a.id}>
              <Link href={a.href} className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-brand/5">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${ACTIVITY_TONES[a.kind]}`}>
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold">{a.title}</p>
                  <p className="truncate text-[11.5px] text-ink/45">{a.note}</p>
                </span>
                <span className="shrink-0 text-[11px] font-semibold tabular-nums text-ink/40">{a.time}</span>
              </Link>
            </li>
          );
        })}
        {shown.length === 0 && <li className="px-5 py-6 text-center text-[12px] text-ink/40">Belum ada aktivitas pada filter ini.</li>}
      </ul>
    </div>
  );
}
