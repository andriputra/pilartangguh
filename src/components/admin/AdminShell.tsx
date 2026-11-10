"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ToastProvider } from "@/components/admin/ui";
import NotificationBell from "@/components/admin/NotificationBell";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "▦" },
  { href: "/admin/content", label: "Konten Landing", icon: "✎" },
  { href: "/admin/products", label: "Produk & Kategori", icon: "⬢" },
  { href: "/admin/portals", label: "Portal Tautan", icon: "⌘" },
  { href: "/admin/messages", label: "Pesan Masuk", icon: "✉" },
  { href: "/admin/settings", label: "Pengaturan", icon: "⚙" },
];

export default function AdminShell({ children, userName }: { children: ReactNode; userName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const nav = (
    <nav className="space-y-1">
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-md px-3.5 py-2.5 text-[13px] font-semibold transition-colors ${
              active ? "bg-brand text-white shadow-card" : "text-ink/70 hover:bg-sand hover:text-ink"
            }`}
          >
            <span className="w-4 text-center">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
      <NotificationBell />
    </nav>
  );

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-cream">
        {/* sidebar desktop */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-white px-4 py-5 lg:flex">
          <Link href="/admin" className="mb-8 flex items-center gap-2.5 px-1">
            <Image src="/images/logo-mark.png" alt="Logo" width={30} height={30} className="rounded-full" />
            <span className="font-display text-sm font-extrabold">
              PILAR<span className="text-brand">TANGGUH</span>
            </span>
          </Link>
          {nav}
          <div className="mt-auto border-t border-line pt-4">
            <p className="truncate px-1 text-[11px] text-ink/50">{userName}</p>
            <div className="mt-2 flex gap-2 px-1">
              <a href="/" target="_blank" rel="noopener noreferrer" className="btn-ghost !px-3 !py-1.5 !text-[11px]">
                Lihat situs
              </a>
              <button type="button" onClick={logout} className="btn !px-3 !py-1.5 !text-[11px] !text-red-600 hover:bg-red-50">
                Keluar
              </button>
            </div>
          </div>
        </aside>

        {/* mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-[80] lg:hidden">
            <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-64 bg-white px-4 py-5 shadow-lift">
              <div className="mb-6 flex items-center gap-2.5 px-1">
                <Image src="/images/logo-mark.png" alt="Logo" width={30} height={30} className="rounded-full" />
                <span className="font-display text-sm font-extrabold">
                  PILAR<span className="text-brand">TANGGUH</span>
                </span>
              </div>
              {nav}
              <div className="mt-6 border-t border-line pt-4">
                <a href="/" target="_blank" rel="noopener noreferrer" className="btn-ghost !px-3 !py-1.5 !text-[11px]">
                  Lihat situs
                </a>
                <button type="button" onClick={logout} className="btn !px-3 !py-1.5 !text-[11px] !text-red-600">
                  Keluar
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* main */}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-cream/90 px-4 backdrop-blur lg:hidden">
            <button type="button" onClick={() => setOpen(true)} aria-label="Buka menu" className="rounded-md border border-line bg-white px-3 py-1.5 text-sm font-bold">
              ☰
            </button>
            <span className="font-display text-xs font-extrabold">
              PILAR<span className="text-brand">TANGGUH</span> CMS
            </span>
            <span className="w-10" />
          </header>
          <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
