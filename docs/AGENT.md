# Catatan untuk Agent Berikutnya

Dokumen handoff. Baca bersama `README.md` dan `docs/DEPLOY.md`. Referensi desain visual: `docs/design-reference.png`.

## Peta file

```
prisma/schema.prisma        # 6 model: User, SiteContent, Category, Product, PortalLink, Setting
prisma/seed.ts              # seed idempotent (upsert) — konten default = desain mock
scripts/prepare-assets.js   # generate favicon/apple-icon/logo-mark + konversi foto vibe_images → public/images
src/middleware.ts           # guard /admin & /api/admin (verifikasi JWT HS256 di edge, pakai jose langsung)
src/lib/
  auth.ts                   # sign/verify token, cookie `pt_admin_token` (httpOnly, 12h), getSession/requireAdmin
  api.ts                    # guard() helper utk route handler + slugify
  content.ts                # SECTION_KEYS + DEFAULT_CONTENT (satu sumber kebenaran utk teks landing)
  settings.ts / site.ts     # loader sisi server: getSections(), getSettings(), waLink()
  prisma.ts                 # singleton PrismaClient
src/app/page.tsx            # landing (server, force-dynamic) — rangkai semua section
src/app/admin/login/        # form login (client)
src/app/admin/(panel)/      # CMS: layout (session) + page dashboard + content + products + portals + settings
src/app/api/                # auth/login, auth/logout, admin/{content,settings,products,categories,portals,upload}
src/components/site/        # Header, Hero, Marquee, About, Catalog, Network, CtaBand, Footer, WaFloat, Reveal, icons
src/components/admin/       # ui.tsx (Toast/Modal/Confirm/fields/ImageUpload/useApi), AdminShell.tsx
```

## Keputusan arsitektur (dan alasannya)

1. **SiteContent = JSON per section.** Teks landing disimpan 1 baris per section (`hero`, `stats`, `marquee`, `about`, `catalog`, `network`, `cta`, `footer`, `seo`) dengan blob JSON. Editor CMS (`content/page.tsx`) punya form per section; `DEFAULT_CONTENT` di `src/lib/content.ts` adalah fallback bila baris hilang — jangan hapus konstanta itu.
2. **Auth manual JWT (jose + cookie), bukan NextAuth.** Ringan, tanpa tabel session, cocok utk 1 admin. Middleware edge tidak boleh import `@/lib/auth` (next/headers tidak ada di edge) — makanya `middleware.ts` verifikasi token sendiri dengan `jose`.
3. **`output: "standalone"`** utk deploy PM2 di VPS 2GB RAM (lihat `ecosystem.config.js`, port 3100, bind 127.0.0.1).
4. **Landing `force-dynamic`** — perubahan CMS langsung tampil tanpa revalidate; query-nya ringan (6 findMany).
5. **Upload gambar** ditulis ke `public/uploads/` (webp ≤1600px via sharp). Di git di-ignore; di server folder ini harus di-rsync dengan `--exclude uploads` (lihat DEPLOY.md §7).
6. **Prisma dipin di v6** (`prisma@^6.19`). Jangan upgrade ke v7 tanpa menyesuaikan konfigurasi (v7 butuh driver adapter + prisma.config.ts).

## Konvensi UI

- Warna: `cream` (bg) / `sand` (section selang-seling) / `ink` (hitam) / `brand` orange `#F26B21`. Font: Archivo (display) + Inter (body) via next/font.
- Animasi: framer-motion — `Reveal` (whileInView, once), stagger hero, `layoutId` tab katalog, AnimatePresence popLayout. Hormati `prefers-reduced-motion`.
- Admin: form compact (padding kecil, teks 11-13px), toast sukses/gagal di SETIAP submit, konfirmasi modal utk hapus (tanpa `alert/confirm` browser), sidebar desktop + drawer mobile.
- Tombol WA memakai logo resmi WhatsApp (path simple-icons) di `icons.tsx`.
- Jangan tambah elemen UI yang tidak ada di `design-reference.png` tanpa diminta.

## Cara menambah section CMS baru (resep)

1. Tambah key + tipe + isi default di `src/lib/content.ts` (`SECTION_KEYS`, `SectionData`, `DEFAULT_CONTENT`).
2. Seed otomatis ikut (upsert per key).
3. Tambah tab di `TABS` + blok form di `src/app/admin/(panel)/content/page.tsx`.
4. Render di komponen site, ambil prop dari `sections.<key>` di `src/app/page.tsx`.

## Status verifikasi terakhir (2026-11-10)

- `npx tsc --noEmit` bersih; `npm run build` sukses (semua route ter-generate).
- **Sudah diverifikasi runtime terhadap DB dev lokal** (`pilartangguh` di Postgres 18 lokal, kredensial di `.env` — jangan commit): login benar (200) & salah (401), edit konten hero langsung tampil di halaman publik, API admin terblokir tanpa sesi (401), list products/portals/settings OK, upload gambar → webp di `public/uploads` tersaji, create+delete produk via API OK, semua halaman `/admin/*` render 200.
- **Belum diverifikasi visual di browser** (viewport in-app browser 0×0 saat sesi ini) — layout mobile & animasi perlu dicek manual: `npm run dev` lalu buka `http://localhost:3003` (port bisa berbeda).
- ESLint: `@typescript-eslint/no-explicit-any` diturunkan ke `warn` (dipakai di editor generik & repeater).

## Kontak & domain

- Domain: pilartangguh.co.id · VPS: 203.194.114.127 (shared dengan app validity/maternicare — jangan sentuh service lain).
- Portal jaringan yang ditampilkan di section 03 (Agen Benang, Go Manic, dst) datanya dari tabel `PortalLink`, bukan hardcode.
