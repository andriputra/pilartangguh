"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { CloseIcon, MenuIcon } from "./icons";

const NAV = [
  { href: "/#profil", label: "Profil" },
  { href: "/#katalog", label: "Katalog" },
  { href: "/#portal", label: "Portal tautan" },
];

export default function Header({ waUrl }: { waUrl: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-line bg-cream/90 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="container-site flex h-16 items-center justify-between sm:h-20">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/images/logo-mark.png" alt="Logo PilarTangguh" width={34} height={34} className="rounded-full" priority />
          <span className="font-display text-lg font-extrabold tracking-tight">
            PILAR<span className="text-brand">TANGGUH</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-ink/70 transition-colors hover:text-brand"
            >
              {item.label}
            </a>
          ))}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost !py-2 text-sm"
          >
            Hubungi kami
          </a>
        </nav>

        <button
          type="button"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          onClick={() => setOpen(!open)}
          className="rounded-md border border-ink/15 bg-white/70 p-2 md:hidden"
        >
          {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <motion.nav
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-b border-line bg-cream px-5 pb-4 pt-2 md:hidden"
        >
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block border-b border-line/60 py-3 text-sm font-medium last:border-0"
            >
              {item.label}
            </a>
          ))}
          <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn-primary mt-3 w-full justify-center">
            Hubungi kami
          </a>
        </motion.nav>
      )}
    </motion.header>
  );
}
