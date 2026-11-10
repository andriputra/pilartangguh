# PilarTangguh — Website + CMS

Website company profile & katalog keselamatan kerja **pilartangguh.co.id** dengan CMS penuh.

- **Stack**: Next.js 14 (App Router, TypeScript, Tailwind CSS) · PostgreSQL + Prisma 6 · Framer Motion · Auth JWT (jose + bcryptjs) · PM2 + Caddy di VPS
- **Desain referensi**: `docs/design-reference.png` (rebuild 1:1)
- **Logo resmi**: `assets/logo-source.jpeg` → favicon & logo-mark di-generate via `node scripts/prepare-assets.js`

## Menjalankan lokal

```bash
cp .env.example .env        # isi DATABASE_URL & AUTH_SECRET
npm install
npm run setup               # prisma generate + db push + seed
npm run dev                 # http://localhost:3000
```

- Situs publik: `http://localhost:3000/`
- Admin CMS: `http://localhost:3000/admin/login` — login default seed: `admin@pilartangguh.co.id` / `PilarTangguh2026!` (ganti `SEED_ADMIN_PASSWORD` di `.env` sebelum seed produksi).

## CMS — yang bisa dikelola

| Menu | Isi |
|---|---|
| Konten Landing | Hero, Statistik, Ticker, Profil (kartu keunggulan), Katalog intro, Portal intro, CTA band, Footer, SEO |
| Produk & Kategori | CRUD produk (gambar via upload, badge, urutan, publish) + kategori untuk tab filter |
| Portal Tautan | Kartu jaringan (judul, deskripsi, URL, status ONLINE/SEGERA HADIR, kartu gelap, nomor) |
| Pengaturan | Nomor WhatsApp, pesan default WA, label chat bubble, teks kontak footer |

Upload gambar disimpan ke `public/uploads/` (di-resize webp ≤1600px oleh sharp). Folder ini **tidak masuk git** — saat deploy ulang, jangan hapus isi `public/uploads` di server.

## Scripts penting

```bash
npm run dev            # development
npm run build          # build produksi (output standalone di .next/standalone)
npm run setup          # generate prisma + db push + seed (idempotent)
npm run db:seed        # seed ulang saja
node scripts/prepare-assets.js  # regenerasi favicon/logo dari assets/logo-source.jpeg
```

## Dokumentasi

- `docs/DEPLOY.md` — langkah deploy ke VPS 203.194.114.127 (pilartangguh.co.id), PostgreSQL + PM2 + Caddy (additive-only).
- `docs/AGENT.md` — catatan arsitektur & konvensi untuk agent berikutnya.
