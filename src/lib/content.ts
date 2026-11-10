export type StatItem = { value: string; label: string };
export type AboutCard = { icon: string; dark: boolean; title: string; body: string };

export const SECTION_KEYS = [
  "hero",
  "stats",
  "marquee",
  "about",
  "catalog",
  "network",
  "cta",
  "footer",
  "seo",
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export type SectionData = {
  hero: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    body: string;
    primaryCta: string;
    secondaryCta: string;
    image: string;
    badge: string;
    badgeSub: string;
    stampTitle: string;
    stampText: string;
  };
  stats: { items: StatItem[] };
  marquee: { items: string[] };
  about: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    body: string;
    cta: string;
    cards: AboutCard[];
  };
  catalog: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    body: string;
  };
  network: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    body: string;
  };
  cta: { eyebrow: string; title: string; titleAccent: string; button: string };
  footer: { tagline: string; copyright: string; built: string };
  seo: { title: string; description: string; ogImage: string };
};

export const DEFAULT_CONTENT: SectionData = {
  hero: {
    eyebrow: "KESELAMATAN DIMULAI DARI SINI",
    title: "Perlindungan kerja",
    titleAccent: "yang lebih tangguh.",
    body: "Pilartangguh membantu Anda membangun lingkungan kerja yang lebih aman lewat peralatan keselamatan yang tepat, terpercaya, dan siap digunakan.",
    primaryCta: "Lihat katalog",
    secondaryCta: "Konsultasi via WhatsApp",
    image: "/images/hero.jpg",
    badge: "RESCUE EQUIPMENT",
    badgeSub: "One Stop Shopping",
    stampTitle: "Standar kerja",
    stampText: "lebih percaya diri",
  },
  stats: {
    items: [
      { value: "10+", label: "Kategori perlindungan" },
      { value: "100%", label: "Fokus pada keselamatan" },
      { value: "24/7", label: "Siap membantu Anda" },
    ],
  },
  marquee: {
    items: ["SAFETY EQUIPMENT", "WORKPLACE PROTECTION", "PILARTANGGUH"],
  },
  about: {
    eyebrow: "01 — TENTANG PILARTANGGUH",
    title: "Karena setiap orang berhak pulang",
    titleAccent: "dengan selamat.",
    body: "Pilartangguh hadir untuk menjadi partner yang bisa diandalkan dalam menjaga keselamatan di tempat kerja. Kami percaya perlindungan yang baik bukan sekadar perlengkapan, tapi bagian dari budaya kerja yang bertumbuh.",
    cta: "Bicara dengan tim kami",
    cards: [
      {
        icon: "shield",
        dark: true,
        title: "Proteksi tepat",
        body: "Perlengkapan yang dirancang untuk kebutuhan nyata di lapangan.",
      },
      {
        icon: "cube",
        dark: false,
        title: "Siap digunakan",
        body: "Praktis, jelas, dan mudah menjadi bagian dari rutinitas kerja.",
      },
      {
        icon: "check",
        dark: false,
        title: "Partner terpercaya",
        body: "Solusi keselamatan dengan komunikasi yang responsif.",
      },
    ],
  },
  catalog: {
    eyebrow: "02 — PILIH PERLINDUNGANNYA",
    title: "Peralatan yang menjaga",
    titleAccent: "langkah tetap aman.",
    body: "Contoh pilihan peralatan keselamatan untuk kebutuhan operasional Anda. Temukan perlindungan yang sesuai, lalu konsultasikan dengan tim kami.",
  },
  network: {
    eyebrow: "03 — JARINGAN PILARTANGGUH",
    title: "Temukan ruang",
    titleAccent: "lainnya.",
    body: "Satu tempat untuk mengakses berbagai website dan inisiatif yang tumbuh bersama Pilartangguh.",
  },
  cta: {
    eyebrow: "MULAI REKOMENDASI?",
    title: "Mulai dari percakapan",
    titleAccent: "yang sederhana.",
    button: "Hubungi via WhatsApp",
  },
  footer: {
    tagline: "Partner keselamatan untuk tempat kerja yang lebih baik.",
    copyright: "© 2025 PilarTangguh. All rights reserved.",
    built: "Built for safer work.",
  },
  seo: {
    title: "PilarTangguh — Perlindungan kerja yang lebih tangguh",
    description:
      "Pilartangguh menyediakan peralatan keselamatan kerja (helm, rompi, sepatu, sarung tangan) yang tepat, terpercaya, dan siap digunakan.",
    ogImage: "/images/hero.jpg",
  },
};

export const DEFAULT_SETTINGS: Record<string, string> = {
  whatsapp_number: "6281234567890",
  whatsapp_message:
    "Halo tim PilarTangguh, saya butuh konsultasi peralatan keselamatan kerja.",
  chat_label: "Chat dengan kami",
  contact_email: "pilartangguh.co.id",
};
