import Image from "next/image";
import type { SectionData } from "@/lib/content";

export default function Footer({ footer, waUrl, contact }: { footer: SectionData["footer"]; waUrl: string; contact: string }) {
  const year = new Date().getFullYear();
  const copyright = footer.copyright.replace(/\d{4}/, String(year));
  return (
    <footer className="bg-ink py-14 text-white sm:py-16">
      <div className="container-site">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <Image src="/images/logo-mark.png" alt="Logo PilarTangguh" width={32} height={32} className="rounded-full" />
              <span className="font-display text-base font-extrabold tracking-tight">
                PILAR<span className="text-brand">TANGGUH</span>
              </span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/50">{footer.tagline}</p>
          </div>
          <div>
            <h3 className="text-sm font-bold">Navigasi</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/55">
              <li><a href="/#profil" className="transition-colors hover:text-brand">Profil</a></li>
              <li><a href="/#katalog" className="transition-colors hover:text-brand">Katalog</a></li>
              <li><a href="/#portal" className="transition-colors hover:text-brand">Portal tautan</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold">Kontak</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/55">
              <li>
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-brand">
                  WhatsApp
                </a>
              </li>
              <li>
                <a href="https://pilartangguh.co.id" className="transition-colors hover:text-brand">
                  {contact}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>{copyright}</p>
          <p>{footer.built}</p>
        </div>
      </div>
    </footer>
  );
}
