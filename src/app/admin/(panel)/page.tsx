import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SectionCard } from "@/components/admin/ui";
import { ActivityFeed, OverviewPanel, StatCard, type ActivityItem } from "@/components/admin/DashboardWidgets";
import { ArrowUpRight, ExternalIcon } from "@/components/site/icons";

export const dynamic = "force-dynamic";

const WIB = "Asia/Jakarta";

function timeAgo(date: Date, now: Date): string {
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hr lalu`;
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: WIB }).format(date);
}

function greeting(hour: number): string {
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

const QUICK_ACTIONS = [
  { href: "/admin/products", label: "Tambah produk", hint: "produk & kategori" },
  { href: "/admin/content", label: "Edit konten", hint: "halaman depan" },
  { href: "/admin/portals", label: "Kelola portal", hint: "jaringan & video" },
  { href: "/admin/settings", label: "Pengaturan", hint: "WhatsApp & kontak" },
];

export default async function AdminDashboard() {
  const now = new Date();
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: WIB }).format(now));
  const dateLabel = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: WIB }).format(now);

  const [
    productTotal,
    productPublished,
    categoryCount,
    portalTotal,
    portalOnline,
    videoTotal,
    contentTotal,
    messageTotal,
    unreadMessages,
    categoriesWithCounts,
    latestProducts,
    latestMessages,
    notifications,
    missingImage,
    missingCode,
    missingSpecs,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { published: true } }),
    prisma.category.count(),
    prisma.portalLink.count(),
    prisma.portalLink.count({ where: { status: "ONLINE" } }),
    prisma.video.count(),
    prisma.siteContent.count(),
    prisma.contactMessage.count(),
    prisma.contactMessage.count({ where: { read: false } }),
    prisma.category.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { products: true } }, products: { where: { published: true }, select: { id: true } } },
    }),
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { category: { select: { name: true } } },
    }),
    prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 4 }),
    prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 4 }),
    prisma.product.count({ where: { OR: [{ image: null }, { image: "" }] } }),
    prisma.product.count({ where: { OR: [{ code: null }, { code: "" }] } }),
    prisma.product.count({ where: { specs: { equals: [] } } }),
  ]);

  const hiddenProducts = productTotal - productPublished;

  const activity: ActivityItem[] = [
    ...latestProducts.map((p) => ({
      id: `produk-${p.id}`,
      kind: "produk" as const,
      title: p.name,
      note: `Ditambahkan di kategori ${p.category.name}`,
      time: timeAgo(p.createdAt, now),
      createdAt: p.createdAt,
      href: "/admin/products",
    })),
    ...latestMessages.map((m) => ({
      id: `pesan-${m.id}`,
      kind: "pesan" as const,
      title: m.subject || `Pesan dari ${m.name}`,
      note: m.message.length > 70 ? `${m.message.slice(0, 70)}…` : m.message,
      time: timeAgo(m.createdAt, now),
      createdAt: m.createdAt,
      href: "/admin/messages",
    })),
    ...notifications.map((n) => ({
      id: `notif-${n.id}`,
      kind: "video" as const,
      title: n.message,
      note: "Notifikasi sistem",
      time: timeAgo(n.createdAt, now),
      createdAt: n.createdAt,
      href: n.link || "/admin/notifications",
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8)
    .map((item) => ({ id: item.id, kind: item.kind, title: item.title, note: item.note, time: item.time, href: item.href }));

  const completeness = [
    { label: "Produk dengan gambar", done: productTotal - missingImage, total: productTotal, href: "/admin/products" },
    { label: "Produk dengan kode", done: productTotal - missingCode, total: productTotal, href: "/admin/products" },
    { label: "Produk dengan spesifikasi", done: productTotal - missingSpecs, total: productTotal, href: "/admin/products" },
  ];

  return (
    <div className="w-full">
      {/* SAPA */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">{greeting(hour)}, Admin</p>
          <h1 className="mt-1.5 font-display text-xl font-extrabold">Ringkasan pilartangguh.co.id</h1>
          <p className="mt-1 text-[13px] text-ink/50">{dateLabel}</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost !px-3.5 !py-2 !text-xs"
          >
            <ExternalIcon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" /> Lihat situs
          </a>
          <Link href="/admin/products" className="btn-primary !px-3.5 !py-2 !text-xs">
            + Tambah produk
          </Link>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard href="/admin/content" label="Section konten" value={contentTotal} sub="halaman depan" icon="edit" tone="ink" />
        <StatCard href="/admin/products" label="Produk" value={productTotal} sub={`${productPublished} tayang · ${hiddenProducts} sembunyi`} icon="cube" />
        <StatCard href="/admin/products" label="Kategori" value={categoryCount} sub="filter katalog" icon="grid" tone="ink" />
        <StatCard href="/admin/portals" label="Portal tautan" value={portalTotal} sub={`${portalOnline} online`} icon="link" tone="ink" />
        <StatCard href="/admin/messages" label="Pesan masuk" value={messageTotal} sub="dari formulir /kontak" icon="mail" tone="ink" />
        <StatCard
          href="/admin/messages"
          label="Belum dibaca"
          value={unreadMessages}
          sub={unreadMessages > 0 ? "perlu ditindaklanjuti" : "semua sudah terbaca"}
          icon="bell"
          tone={unreadMessages > 0 ? "red" : "emerald"}
        />
      </div>

      {/* SEBARAN + PESAN */}
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OverviewPanel
            rows={categoriesWithCounts.map((c) => ({ name: c.name, total: c._count.products, published: c.products.length }))}
            published={productPublished}
            hidden={hiddenProducts}
          />
        </div>
        <SectionCard
          title="Pesan terbaru"
          actions={
            unreadMessages > 0 ? (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">{unreadMessages} belum dibaca</span>
            ) : (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">bersih</span>
            )
          }
        >
          <ul className="space-y-2.5">
            {latestMessages.map((m) => (
              <li key={m.id}>
                <Link href="/admin/messages" className="group flex gap-2.5 rounded-md p-1.5 -m-1.5 transition-colors hover:bg-brand/5">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${m.read ? "bg-line" : "bg-brand"}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-[12.5px] font-semibold">{m.name}</p>
                      <span className="shrink-0 text-[10.5px] tabular-nums text-ink/40">{timeAgo(m.createdAt, now)}</span>
                    </span>
                    <p className="mt-0.5 truncate text-[11.5px] text-ink/50">{m.subject ? `${m.subject} — ` : ""}{m.message}</p>
                  </span>
                </Link>
              </li>
            ))}
            {latestMessages.length === 0 && <li className="py-4 text-center text-[12px] text-ink/40">Belum ada pesan masuk.</li>}
          </ul>
          <Link href="/admin/messages" className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-bold text-brand hover:underline">
            Lihat semua pesan <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </SectionCard>
      </div>

      {/* PRODUK TERBARU + KELENGKAPAN + PORTAL */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="Produk terbaru"
          actions={
            <Link href="/admin/products" className="text-[11px] font-bold text-brand hover:underline">
              Semua produk →
            </Link>
          }
        >
          <ul className="divide-y divide-line/60">
            {latestProducts.map((p) => (
              <li key={p.id}>
                <Link href="/admin/products" className="group flex items-center gap-3 py-2 transition-colors first:pt-0 last:pb-0 hover:text-brand">
                  <span className="h-10 w-8 shrink-0 overflow-hidden rounded-md bg-sand">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-[12.5px] font-semibold">{p.name}</p>
                      <span className="shrink-0 text-[10.5px] tabular-nums text-ink/40">{timeAgo(p.createdAt, now)}</span>
                    </span>
                    <p className="mt-0.5 flex items-center gap-2 text-[11px] text-ink/45">
                      {p.category.name}
                      <span className={`rounded-full px-1.5 py-px text-[9.5px] font-bold ${p.published ? "bg-emerald-50 text-emerald-700" : "bg-sand text-ink/50"}`}>
                        {p.published ? "Tayang" : "Sembunyi"}
                      </span>
                    </p>
                  </span>
                </Link>
              </li>
            ))}
            {latestProducts.length === 0 && <li className="py-4 text-center text-[12px] text-ink/40">Belum ada produk.</li>}
          </ul>
        </SectionCard>

        <SectionCard title="Kelengkapan katalog">
          <div className="space-y-3.5">
            {completeness.map((row) => {
              const pct = row.total ? Math.round((row.done / row.total) * 100) : 0;
              return (
                <div key={row.label}>
                  <div className="flex items-baseline justify-between text-[12px]">
                    <span className="font-semibold text-ink/70">{row.label}</span>
                    <span className={`font-bold tabular-nums ${pct === 100 ? "text-emerald-600" : "text-ink/50"}`}>
                      {row.done}/{row.total}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sand">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${pct === 100 ? "bg-emerald-500" : "bg-brand"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {productTotal > 0 && completeness.some((c) => c.done < c.total) ? (
              <Link href="/admin/products" className="inline-flex items-center gap-1.5 pt-1 text-[12px] font-bold text-brand hover:underline">
                Lengkapi data produk <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <p className="pt-1 text-[11.5px] text-emerald-700">Data katalog sudah lengkap. Kerja bagus!</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Portal & jaringan">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-display text-2xl font-extrabold tabular-nums">
                {portalOnline}
                <span className="text-[13px] font-bold text-ink/40"> / {portalTotal} online</span>
              </p>
              <p className="mt-1 text-[11.5px] text-ink/45">{videoTotal} video YouTube terindeks</p>
            </div>
            <Link href="/admin/portals" className="btn-ghost !px-3 !py-1.5 !text-[11px] shrink-0">
              Kelola
            </Link>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-sand">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-brand-dark transition-all duration-700"
              style={{ width: portalTotal ? `${Math.round((portalOnline / portalTotal) * 100)}%` : "0%" }}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((q) => (
              <Link
                key={q.href + q.label}
                href={q.href}
                className="group rounded-md border border-line px-2.5 py-2 transition-colors hover:border-brand/40 hover:bg-brand/5"
              >
                <p className="text-[11.5px] font-bold group-hover:text-brand">{q.label}</p>
                <p className="mt-0.5 text-[10.5px] text-ink/40">{q.hint}</p>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* AKTIVITAS */}
      <div className="mt-4">
        <ActivityFeed items={activity} />
      </div>
    </div>
  );
}
