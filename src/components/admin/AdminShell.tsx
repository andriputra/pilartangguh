"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ToastProvider } from "@/components/admin/ui";
import NotificationBell from "@/components/admin/NotificationBell";
import { CloseIcon, CubeIcon, EditIcon, ExternalIcon, GridIcon, LinkIcon, LogOutIcon, MailIcon, MenuIcon, SettingsIcon } from "@/components/site/icons";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: GridIcon },
  { href: "/admin/content", label: "Konten Landing", icon: EditIcon },
  { href: "/admin/products", label: "Produk & Kategori", icon: CubeIcon },
  { href: "/admin/portals", label: "Portal Tautan", icon: LinkIcon },
  { href: "/admin/messages", label: "Pesan Masuk", icon: MailIcon },
  { href: "/admin/settings", label: "Pengaturan", icon: SettingsIcon },
];

export default function AdminShell({ children, userName }: { children: ReactNode; userName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const sidebar = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const desktop = window.matchMedia("(min-width: 1024px)");
    const overflow = document.body.style.overflow;
    const main = content.current;
    const trigger = menuButton.current;
    document.body.style.overflow = "hidden";
    if (main) main.inert = true;
    sidebar.current?.querySelector<HTMLButtonElement>("[data-close-menu]")?.focus();

    function onResize() {
      if (desktop.matches) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;
      const items = Array.from(sidebar.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? []).filter(item => item.getClientRects().length > 0);
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    desktop.addEventListener("change", onResize);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      if (main) main.inert = false;
      desktop.removeEventListener("change", onResize);
      document.removeEventListener("keydown", onKeyDown);
      if (trigger?.offsetParent) trigger.focus();
    };
  }, [open]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-cream">
        {open && <div aria-hidden="true" className="fixed inset-0 z-[70] bg-ink/40 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}
        <aside
          ref={sidebar}
          id="admin-sidebar"
          aria-label="Menu admin"
          role={open ? "dialog" : undefined}
          aria-modal={open ? true : undefined}
          className={`fixed inset-y-0 left-0 z-[80] flex h-dvh w-64 shrink-0 flex-col border-r border-line bg-white px-4 py-5 shadow-lift transition-[transform,visibility] duration-200 motion-reduce:transition-none lg:sticky lg:top-0 lg:visible lg:translate-x-0 lg:shadow-none ${open ? "visible translate-x-0" : "invisible -translate-x-full"}`}
        >
          <div className="mb-6 flex shrink-0 items-center justify-between border-b border-line pb-5">
            <Link href="/admin" aria-label="PilarTangguh dashboard" onClick={() => setOpen(false)} className="flex min-w-0 items-center gap-2.5 rounded-md px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
              <Image src="/images/logo-mark.png" alt="" width={30} height={30} className="shrink-0 rounded-full" />
              <span className="font-display text-sm font-extrabold">PILAR<span className="text-brand">TANGGUH</span></span>
            </Link>
            <button data-close-menu type="button" onClick={() => setOpen(false)} aria-label="Tutup menu" className="rounded-md p-2 text-ink/60 hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand lg:hidden">
              <CloseIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Navigasi admin" className="min-h-0 flex-1 space-y-1 overflow-y-auto py-1">
            {NAV.map((item) => {
              const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand ${active ? "bg-brand text-white shadow-sm" : "text-ink/70 hover:bg-brand/5 hover:text-brand"}`}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <NotificationBell onNavigate={() => setOpen(false)} />
          </nav>
          <div className="mt-5 shrink-0 border-t border-line pt-4">
            <div className="flex min-w-0 items-center gap-2.5 px-1">
              <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand/10 bg-brand/10 text-sm font-bold text-brand">{userName.trim().charAt(0).toUpperCase()}</span>
              <div className="min-w-0">
                <p title={userName} className="truncate text-xs font-semibold text-ink">{userName}</p>
                <p className="mt-0.5 text-[10px] text-ink/50">Administrator</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a href="/" target="_blank" rel="noopener noreferrer" className="flex min-h-9 items-center justify-center gap-2 rounded-md border border-line px-2 text-[11px] font-semibold text-ink/70 transition-colors hover:border-brand/30 hover:bg-brand/5 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                <ExternalIcon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />Lihat situs
              </a>
              <button type="button" onClick={logout} className="flex min-h-9 items-center justify-center gap-2 rounded-md px-2 text-[11px] font-semibold text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                <LogOutIcon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />Keluar
              </button>
            </div>
          </div>
        </aside>
        <div ref={content} className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-cream/90 px-4 backdrop-blur lg:hidden">
            <button ref={menuButton} type="button" onClick={() => setOpen(true)} aria-label="Buka menu" aria-expanded={open} aria-controls="admin-sidebar" className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-white text-ink/70 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
              <MenuIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </button>
            <span className="font-display text-xs font-extrabold">PILAR<span className="text-brand">TANGGUH</span> CMS</span>
            <span className="w-9" />
          </header>
          <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
