export type StatItem = { value: string; label: string };
export type AboutCard = { icon: string; dark: boolean; title: string; body: string };
export type ContactChannel = { icon: string; title: string; lines: string; href: string };
export type FaqItem = { q: string; a: string };

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
  "catalogPage",
  "contactPage",
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
  catalogPage: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    body: string;
    image: string;
    searchPlaceholder: string;
    note: string;
    emptyTitle: string;
    emptyBody: string;
    seoTitle: string;
    seoDescription: string;
    sidebarTitle: string;
    allLabel: string;
    allLabelShort: string;
    resetLabel: string;
    recommendLabel: string;
    helpTitle: string;
    helpBody: string;
    helpButton: string;
    resultsLabel: string;
    sortLabel: string;
    sortNewest: string;
    sortAz: string;
    sortZa: string;
    sortCategory: string;
    viewGrid: string;
    viewList: string;
    perPage: string;
    pagePrev: string;
    pageNext: string;
    codeLabel: string;
    priceLabel: string;
    priceFallback: string;
    askLabel: string;
    detailLabel: string;
    detailBack: string;
    detailTrust1: string;
    detailTrust2: string;
    detailStockNote: string;
    detailAllLabel: string;
    detailDescTitle: string;
    detailSpecsTitle: string;
    detailRelatedTitle: string;
    detailCta: string;
    detailConsult: string;
  };
  contactPage: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    body: string;
    channels: ContactChannel[];
    formTitle: string;
    formBody: string;
    formSubmit: string;
    formSuccess: string;
    addressTitle: string;
    address: string;
    hoursTitle: string;
    hours: string;
    mapsQuery: string;
    faqTitle: string;
    faqBody: string;
    faqs: FaqItem[];
    seoTitle: string;
    seoDescription: string;
  };
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
  catalogPage: {
    eyebrow: "KATALOG PERALATAN",
    title: "Semua perlindungan",
    titleAccent: "dalam satu tempat.",
    body: "Telusuri seluruh peralatan keselamatan kerja Pilartangguh per kategori. Saring sesuai kebutuhan operasional Anda, lalu kirim pertanyaan langsung lewat WhatsApp — tim kami membantu memilih ukuran, standar, dan jumlahnya.",
    image: "/images/hero.jpg",
    searchPlaceholder: "Cari nama peralatan…",
    note: "Spesifikasi, standar keamanan, dan harga disesuaikan per kebutuhan — konsultasikan lewat WhatsApp.",
    emptyTitle: "Produk belum ditemukan",
    emptyBody: "Coba kata kunci lain atau pilih kategori berbeda. Belum yakin butuh apa? Tim kami siap merekomendasikan.",
    seoTitle: "Katalog Peralatan Keselamatan Kerja — PilarTangguh",
    seoDescription:
      "Katalog lengkap peralatan keselamatan kerja PilarTangguh: helm, rompi, sepatu safety, sarung tangan, harness, dan perlengkapan rescue per kategori.",
    sidebarTitle: "Kategori Produk",
    allLabel: "Semua kategori",
    allLabelShort: "Semua",
    resetLabel: "Reset filter",
    recommendLabel: "Minta rekomendasi",
    helpTitle: "Butuh bantuan memilih?",
    helpBody: "Sebutkan jenis pekerjaan, jumlah personil, dan lokasi kerja Anda — kami bantu arahkan spesifikasinya.",
    helpButton: "Konsultasi via WhatsApp",
    resultsLabel: "Menampilkan {shown} dari {total} peralatan",
    sortLabel: "Urutkan",
    sortNewest: "Terbaru",
    sortAz: "Nama A-Z",
    sortZa: "Nama Z-A",
    sortCategory: "Per kategori",
    viewGrid: "Grid",
    viewList: "List",
    perPage: "6",
    pagePrev: "Sebelumnya",
    pageNext: "Berikutnya",
    codeLabel: "Kode",
    priceLabel: "Harga",
    priceFallback: "Harga menyesuaikan jumlah & lokasi",
    askLabel: "Tanya",
    detailLabel: "Lihat detail",
    detailBack: "Kembali ke katalog",
    detailTrust1: "Dipilih untuk pemakaian lapangan",
    detailTrust2: "Konsultasi ukuran & jumlah",
    detailStockNote: "Tersedia untuk pesanan satuan & grosir",
    detailAllLabel: "Lihat semua produk",
    detailDescTitle: "Deskripsi produk",
    detailSpecsTitle: "Spesifikasi",
    detailRelatedTitle: "Produk terkait",
    detailCta: "Tanya produk ini",
    detailConsult: "Konsultasi jumlah & ukuran",
  },
  contactPage: {
    eyebrow: "HUBUNGI KAMI",
    title: "Mari mulai dari",
    titleAccent: "percakapan yang jelas.",
    body: "Ceritakan kebutuhan perlindungan di tempat kerja Anda — jumlah personil, lokasi, dan jenis risikonya. Tim Pilartangguh menjawab lewat WhatsApp, email, atau pesan di formulir ini.",
    channels: [
      {
        icon: "wa",
        title: "WhatsApp",
        lines: "Respons cepat pada jam kerja",
        href: "",
      },
      {
        icon: "mail",
        title: "Email",
        lines: "Untuk penawaran & dokumen resmi",
        href: "",
      },
      {
        icon: "clock",
        title: "Jam layanan",
        lines: "Senin–Sabtu, 08.00–17.00 WIB",
        href: "",
      },
    ],
    formTitle: "Kirim pesan",
    formBody: "Isi formulir ini dan kami membalas secepatnya. Sebutkan kebutuhan paling mendesak agar rekomendasi lebih tepat.",
    formSubmit: "Kirim pesan",
    formSuccess: "Pesan Anda terkirim. Tim PilarTangguh akan segera menghubungi Anda.",
    addressTitle: "Lokasi layanan",
    address: "Pengiriman dan konsultasi mencakup Bandung dan seluruh Indonesia.",
    hoursTitle: "Jam operasional",
    hours: "Senin–Sabtu: 08.00–17.00 WIB\nMinggu & libur: via WhatsApp",
    mapsQuery: "Bandung, Jawa Barat",
    faqTitle: "Pertanyaan yang sering|kami dengar.",
    faqBody: "Kalau jawabannya belum cukup, tanyakan langsung — lebih cepat kami arahkan ke produk yang tepat.",
    faqs: [
      {
        q: "Apakah bisa pesan satuan dulu?",
        a: "Bisa. Untuk sebagian produk kami sediakan satuan agar Anda bisa mengecek kualitasnya lebih dulu sebelum memesan dalam jumlah besar.",
      },
      {
        q: "Bagaimana proses konsultasi kebutuhan keselamatan?",
        a: "Ceritakan jenis pekerjaan, jumlah personil, dan lokasi kerja lewat WhatsApp atau formulir. Kami bantu arahkan kategori, spesifikasi, dan estimasi jumlahnya.",
      },
      {
        q: "Apakah barang dikirim ke luar kota?",
        a: "Ya, pengiriman dilakukan ke seluruh Indonesia dengan ekspedisi yang aman. Berat dan volume disesuaikan agar ongkos kirim lebih efisien.",
      },
      {
        q: "Bagaimana jika ukuran tidak cocok?",
        a: "Sampaikan ukuran personil sebelum pemesanan agar rekomendasi sejak awal tepat. Untuk keluhan ukuran setelah pengiriman, hubungi kami secepatnya untuk solusi penukaran sesuai ketersediaan stok.",
      },
    ],
    seoTitle: "Kontak & Konsultasi Keselamatan Kerja — PilarTangguh",
    seoDescription:
      "Hubungi PilarTangguh untuk konsultasi peralatan keselamatan kerja: WhatsApp, email, alamat layanan, jam operasional, dan formulir pesan.",
  },
};

export const DEFAULT_SETTINGS: Record<string, string> = {
  whatsapp_number: "6281234567890",
  whatsapp_message:
    "Halo tim PilarTangguh, saya butuh konsultasi peralatan keselamatan kerja.",
  chat_label: "Chat dengan kami",
  contact_email: "pilartangguh.co.id",
};
