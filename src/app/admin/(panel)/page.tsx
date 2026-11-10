import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, SectionCard } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const QUICK = [
  { href: "/admin/content", title: "Konten Landing", desc: "Edit teks & gambar semua section halaman depan." },
  { href: "/admin/products", title: "Produk & Kategori", desc: "Kelola katalog peralatan beserta filter kategori di halaman /katalog." },
  { href: "/admin/portals", title: "Portal Tautan", desc: "Kelola kartu jaringan PilarTangguh (online / segera hadir)." },
  { href: "/admin/messages", title: "Pesan Masuk", desc: "Baca dan balas pesan dari formulir halaman /kontak." },
  { href: "/admin/settings", title: "Pengaturan", desc: "Nomor WhatsApp, pesan default, dan kontak." },
];

export default async function AdminDashboard() {
  const [products, categories, portals, contents, messages, unreadMessages] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.portalLink.count(),
    prisma.siteContent.count(),
    prisma.contactMessage.count(),
    prisma.contactMessage.count({ where: { read: false } }),
  ]);

  return (
    <div className="w-full">
      <PageHeader title="Dashboard" subtitle="Ringkasan konten website pilartangguh.co.id" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Section konten", value: contents },
          { label: "Produk", value: products },
          { label: "Kategori", value: categories },
          { label: "Portal tautan", value: portals },
          { label: "Pesan masuk", value: messages },
          { label: "Belum dibaca", value: unreadMessages },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-line bg-white px-4 py-4 shadow-card">
            <p className="font-display text-2xl font-extrabold text-brand">{s.value}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-ink/50">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {QUICK.map((q) => (
          <Link key={q.href} href={q.href} className="group">
            <SectionCard title={q.title}>
              <p className="text-[13px] text-ink/55">{q.desc}</p>
              <p className="mt-3 text-xs font-bold text-brand group-hover:underline">Kelola →</p>
            </SectionCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
