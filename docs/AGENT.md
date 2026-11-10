# Catatan untuk Agent Berikutnya

Dokumen handoff. Baca bersama `README.md` dan `docs/DEPLOY.md`. Referensi desain visual: `docs/design-reference.png`.

## Peta file

```
prisma/schema.prisma        # 9 model: User, SiteContent, Category, Product, PortalLink(+tag,+youtubeChannelId), Video, Notification, Setting, ContactMessage
prisma/seed.ts              # seed idempotent (upsert) — konten default = desain mock
scripts/poll-youtube.mjs    # RSS poller video YouTube → Video + Notification (+Fonnte WA opsional); node polos
scripts/deploy-vps.sh       # skrip deploy DI VPS: git reset ke origin/main, symlink .env, npm ci, db push, build (heap dibatasi), rsync standalone (--exclude uploads), seed sekali, pm2 startOrReload, health check
scripts/prepare-assets.js   # generate favicon/apple-icon/logo-mark + konversi foto vibe_images → public/images
.github/workflows/deploy.yml # auto-deploy: push ke main → SSH (appleboy/ssh-action) → jalankan scripts/deploy-vps.sh
src/middleware.ts           # guard /admin & /api/admin (verifikasi JWT HS256 di edge, pakai jose langsung)
src/lib/
  auth.ts                   # sign/verify token, cookie `pt_admin_token` (httpOnly, 12h), getSession/requireAdmin
  api.ts                    # guard() helper utk route handler + slugify
  content.ts                # SECTION_KEYS + DEFAULT_CONTENT (satu sumber kebenaran utk teks landing + /katalog + /kontak)
  settings.ts / site.ts     # loader sisi server: getSections(), getSettings(), waLink()
  prisma.ts                 # singleton PrismaClient
src/app/page.tsx            # landing (server, force-dynamic) — rangkai semua section
src/app/katalog/page.tsx    # halaman katalog (server, force-dynamic): kop + statistik kecil + CatalogBoard + CtaBand
src/app/katalog/[slug]/page.tsx # detail produk (server, force-dynamic): gambar + harga + deskripsi + spesifikasi + produk terkait, 404 bila slug tak tayang
src/app/kontak/page.tsx     # halaman kontak (server, force-dynamic): hero + kanal + ContactForm/peta + FaqList
src/app/admin/login/        # form login (client)
src/app/admin/(panel)/      # CMS: layout (session) + dashboard + content + products + portals + messages + settings + notifications
src/app/api/                # auth/{login,logout}, contact (publik), admin/{content,settings,products,categories,portals,messages,messages/[id],notifications,videos/poll,upload}
src/components/site/        # Header, Hero, Marquee, About, Catalog, Network, CtaBand, Footer, WaFloat, Reveal, icons + CatalogBoard (client: sidebar/sort/view/paginasi), ContactForm, FaqList
src/components/admin/       # ui.tsx (Toast/Modal/Confirm/fields/ImageUpload/useApi), AdminShell.tsx, NotificationBell.tsx
```

## Keputusan arsitektur (dan alasannya)

1. **SiteContent = JSON per section.** Teks landing & halaman statis disimpan 1 baris per section (`hero`, `stats`, `marquee`, `about`, `catalog`, `network`, `cta`, `footer`, `seo`, `catalogPage`, `contactPage`) dengan blob JSON. Editor CMS (`content/page.tsx`) punya form per section; `DEFAULT_CONTENT` di `src/lib/content.ts` adalah fallback bila baris hilang — jangan hapus konstanta itu.
2. **Auth manual JWT (jose + cookie), bukan NextAuth.** Ringan, tanpa tabel session, cocok utk 1 admin. Middleware edge tidak boleh import `@/lib/auth` (next/headers tidak ada di edge) — makanya `middleware.ts` verifikasi token sendiri dengan `jose`.
3. **`output: "standalone"`** utk deploy PM2 di VPS RAM 2,2 GB (lihat `ecosystem.config.js`, port 3100). Bind `0.0.0.0` — bukan kelalaian: Caddy jalan di container Docker dan mengakses host lewat IP gateway bridge (`172.18.0.1:3100`), sehingga `127.0.0.1` tidak akan terjangkau; akses luar diblokir UFW yang hanya mengizinkan rentang network Docker (`172.16.0.0/12`).
4. **Semua halaman publik `force-dynamic`** — perubahan CMS langsung tampil tanpa revalidate; query-nya ringan (beberapa findMany/count).
5. **Upload gambar** ditulis ke `public/uploads/` (webp ≤1600px via sharp). Di git di-ignore; di server folder ini harus di-rsync dengan `--exclude uploads` (lihat DEPLOY.md §7).
6. **Prisma dipin di v6** (`prisma@^6.19`). Jangan upgrade ke v7 tanpa menyesuaikan konfigurasi (v7 butuh driver adapter + prisma.config.ts).
7. **Formulir /kontak = 1 route publik** `POST /api/contact` (di luar `/api/admin`, jadi tidak kena guard middleware). Proteksi: validasi panjang, honeypot `company` (bot dibalas 200 diam-diam supaya tidak mengulang), dan limiter in-memory 5 pesan/10 menit per IP — cukup utk PM2 single-instance; kalau nanti pindah serverless, ganti dengan penyimpanan terpusat. Setiap pesan disimpan di `ContactMessage` **sekaligus** `Notification` agar bell CMS berbunyi tanpa halaman inbox terpisah.
8. **Katalog = data, bukan teks landing.** Kolom `Product.code`, `Product.price` (String — bebas format "Rp … / pcs"), dan `Product.specs String[]` (scalar list Postgres) menggerakkan kartu, chip, dan tabel spesifikasi di halaman detail. `price` sengaja **tidak** diberi nilai default/angka karangan: kosong → tampil `catalogPage.priceFallback`. Label UI katalog (sidebar, opsi sort, tombol grid/list, label harga, judul blok detail, dst.) semua ada di section `catalogPage` — jangan hardcode string UI di `CatalogBoard.tsx`.
9. **Semua teks UI katalog lewat `catalogPage`.** Bila menambah kontrol baru di `CatalogBoard`, tambahkan dulu key + default di `src/lib/content.ts`, lalu field-nya di tab "Halaman Katalog" (`content/page.tsx`) supaya klien tetap bisa mengubah kata-katanya.
10. **`getSections()` menggabungkan blob DB di atas `DEFAULT_CONTENT`** (`src/lib/site.ts`, shallow merge per section). Karena itu menambah key baru di `content.ts` tidak memerlukan reseed atau migrasi konten — key yang belum ada di baris DB tetap terisi default. Konsekuensinya: menghapus key dari default tidak menghapus nilainya dari DB, dan merge hanya satu tingkat (jangan simpan config bertingkat dalam satu section).

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
4. Render di komponen site, ambil prop dari `sections.<key>` (di `src/app/page.tsx` atau halaman baru seperti `src/app/katalog/page.tsx`).
5. Setelah menambah model/kolom: `npx prisma db push` (dev) dan catat langkah yang sama di DEPLOY.md §7 (produksi).

## Cara menambah halaman publik baru (resep, contoh /katalog & /kontak)

1. `src/app/<slug>/page.tsx`: server component, `export const dynamic = "force-dynamic"`, `generateMetadata()` dari section-nya sendiri (`seoTitle`/`seoDescription`).
2. Rangkaikan dari komponen yang sudah ada: `Header`, `WaFloat`, `Marquee`, `CtaBand`, `Footer` — jangan bikin shell layout baru. Kop halaman cukup `<section>` dengan breadcrumb + eyebrow + h1 (lihat `katalog/page.tsx`), bukan hero besar.
3. Bagian interaktif (filter, form, accordion) dibuat komponen `"use client"` terpisah di `src/components/site/` dan terima data hasil query dari halaman.
4. Tambah entri `NAV` di `src/components/site/Header.tsx` (flag `section: true` utk anchor beranda, `false` utk rute baru — rute aktif otomatis ditandai garis orange) dan daftar Navigasi di `src/components/site/Footer.tsx`.

## Status verifikasi terakhir (2026-11-10)

### Revisi /katalog jadi katalog produk sungguhan (terbaru)
- `Product` dapat kolom `code`, `price` (String bebas format), `specs String[]`; seed + backfill DB lokal terisi (4 produk, `price` sengaja null). API `POST /api/admin/products` & `PATCH /api/admin/products/[id]` ikut menyimpan ketiganya — `specs` menerima array **atau** textarea ber-baris (dibersihkan via `specList()` di `src/lib/api.ts`: trim, buang baris kosong, maks 20).
- CMS → Produk & Kategori: field Kode, Harga, Spesifikasi (textarea 1 baris = 1 poin) + kolom Kode & Spesifikasi di tabel.
- `/katalog` sekarang: kop ringkas (breadcrumb + statistik kategori/produk tayang/update otomatis), sidebar kategori sticky (pill jumlah + kartu bantu gelap), chip kategori di mobile, toolbar (hasil, cari, urutkan Terbaru/A-Z/Z-A/Per kategori, Grid/List), kartu produk lengkap (badge + chip kode + 3 poin spesifikasi + harga + tombol Tanya), paginasi bernomor (`perPage` dari CMS, min 3), empty state, catatan kaki. `PageHero` dihapus — jangan dibangkitkan lagi.
- `/katalog/[slug]` baru: gambar + chip kepercayaan, kode, blok harga 2 tombol WA, deskripsi, tabel spesifikasi (poin `Label: Nilai` otomatis dua kolom), 3 produk terkait (kategori sama dulu), `notFound()` utk slug tak tayang.
- `getSections()` sekarang **merge** blob DB di atas `DEFAULT_CONTENT` (per section) — kunci baru di `content.ts` langsung terpakai walau baris `SiteContent` masih versi lama. Penting: jangan kembali ke penimpaan penuh blob.
- Semua label UI katalog (sidebar, opsi sort, grid/list, label harga/kode, fallback harga, blok detail, chip kepercayaan, tombol reset/rekomendasi) ada di section `catalogPage`; form-nya dikelompok per blok di tab "Halaman Katalog".
- Verifikasi: `tsc --noEmit` bersih, `npm run build` sukses (`ƒ /katalog` 158 kB, `ƒ /katalog/[slug]`), runtime dev port 3010 — POST create 201 dengan code/specs, PATCH 200 (textarea multi-baris → 3 poin, baris kosong dibuang), `/katalog` 200, `/katalog/helm-safety-pro` 200 (chip kode + harga fallback + spesifikasi), `/katalog/uji-halaman-1` 200, `/katalog/tidak-ada` 404, semua `/admin/*` 200 (307 tanpa sesi, API 401). Dengan 8 produk: paginasi + "Menampilkan 8 dari 8" muncul; 4 produk → tanpa paginasi. 4 produk uji + 3 produk uji halaman sudah dihapus lagi (sisa 4 produk seed asli). Screenshot browser OK kali ini (viewport 709×793, tanpa overflow horizontal); layout `lg:` (sidebar 248px, grid 3 kolom) diverifikasi lewat CSSOM karena viewport in-app tak bisa dilebarkan.

### Halaman /katalog + /kontak + inbox pesan
- `npx tsc --noEmit` bersih, `npm run build` sukses — route `ƒ /katalog` (156 kB) & `ƒ /kontak` (155 kB) ter-registrasi.
- Runtime (dev, DB lokal): `/katalog` & `/kontak` = 200; beranda ikut menampilkan tautan `/katalog` + `/kontak`; `/admin/messages` tanpa sesi → 307 ke `/admin/login?next=%2Fadmin%2Fmessages`, API `GET /api/admin/messages` tanpa sesi → 401.
- `POST /api/contact`: valid → 200 + baris `ContactMessage`; honeypot terisi → 200 tanpa menyimpan; field cacat → 400 dengan pesan. Inbox admin: list/unread count, `PATCH /:id` (baca), `PATCH` (all), `DELETE /:id` — semua 200, baris uji sudah dibersihkan (sisa 0 pesan, 0 notifikasi uji).
- CMS: `PUT /api/admin/content` key `catalogPage`/`contactPage` langsung terlihat di halaman publik (badge & field form uji muncul), meta title per halaman ikut berubah; baris konten uji dihapus lagi sehingga fallback ke `DEFAULT_CONTENT` (sisa 9 baris konten asli).
- Browser (in-app, lebar 528px): tidak ada overflow horizontal di kedua halaman; filter katalog bekerja (tab "Tangan" → "Menampilkan 1 dari 4 peralatan"), search + empty state + tombol "Reset filter" tampil; FAQ `aria-expanded` berpindah saat diklik; honeypot terukur di kiri -9979px (off-screen); iframe peta = `google.com/maps?q=…&output=embed`.
- **Catatan lingkungan**: saat halaman in-app browser `hidden`, `requestAnimationFrame` tidak jalan sama sekali → animasi framer-motion (exit/enter kartu katalog & tinggi panel FAQ) terlihat "membeku" di posisi awal. Itu artefak pengukuran, bukan bug kode — periksa dengan mata saat tab terlihat.
- Data produk tetap dari seed lama (4 produk, 1 per kategori) — tidak menambah data contoh baru; katalog diisi klien lewat CMS → Produk & Kategori.

### Fitur notifikasi video YouTube
- Poller `scripts/poll-youtube.mjs` (node polos, tanpa tsx): RSS `https://www.youtube.com/feed/videos.xml?channel_id=…` → tabel `Video` + `Notification` + opsional kirim WA via Fonnte (`FONNTE_TOKEN`/`FONNTE_TARGET`, default nomor setting `whatsapp_number`). Idempoten (unique `[portalId, externalId]`), sudah diuji end-to-end dengan fixture RSS lokal (parse, entity decode, dedup run-2, notifikasi, cleanup).
- URL feed yang benar adalah `/feed/videos.xml` (bukan `/feeds/`). Dari jaringan laptop Indonesia kadang kena interstitial HTML — poller mendeteksinya dan menyuruh jalankan dari VPS.
- Cron: app PM2 `pilartangguh-poller` (`cron_restart */30`, cwd `/opt/pilartangguh/src`, autorestart false).
- CMS: menu Notifikasi (`/admin/notifications`) + bell di sidebar (poll 60 dtk) + tombol "Cek YouTube sekarang" (`POST /api/admin/videos/poll` → spawn script).
- Situs: kartu portal menampilkan "▶ episode terbaru" bila ada video (link YouTube); untuk portal ONLINE (kartu = anchor) episode dirender teks biasa agar tidak nested-anchor.
- Kolom baru `PortalLink.youtubeChannelId` + `tag` (chip "Podcast" di kartu RWCaper & Bincang TPT) — keduanya diedit via CMS Portal Tautan.

### Verifikasi sebelumnya
- `npx tsc --noEmit` bersih; `npm run build` sukses (semua route ter-generate).
- **Sudah diverifikasi runtime terhadap DB dev lokal** (`pilartangguh` di Postgres 18 lokal, kredensial di `.env` — jangan commit): login benar (200) & salah (401), edit konten hero langsung tampil di halaman publik, API admin terblokir tanpa sesi (401), list products/portals/settings OK, upload gambar → webp di `public/uploads` tersaji, create+delete produk via API OK, semua halaman `/admin/*` render 200.
- **Verifikasi visual**: screenshot in-app browser kadang gagal (surface `hidden`, viewport 0×0). Kalau gagal, periksa struktur DOM + rect lewat `evaluate_script` dan pastikan utilitas Tailwind benar-benar ter-generate lewat CSSOM; layout mobile, animasi hover, dan transisi FAQ tetap perlu dilihat manual: `npm run dev` lalu buka `http://localhost:3003` (port bisa berbeda).
- ESLint: `@typescript-eslint/no-explicit-any` diturunkan ke `warn` (dipakai di editor generik & repeater).

## Kontak & domain

- Domain: pilartangguh.co.id · VPS: 203.194.114.127 (shared dengan app validity/maternicare — jangan sentuh service lain).
- Portal jaringan yang ditampilkan di section 03 (Agen Benang, Go Manic, dst) datanya dari tabel `PortalLink`, bukan hardcode.

### State deploy di server (per 2026-11-10)

- **Postgres DI-REUSE, bukan instance baru.** Yang dipakai adalah container `validity-postgres` (Postgres 16, dipublish hanya ke `127.0.0.1:5432`, superuser `validity_app`). Role + DB `pilartangguh` sudah dibuat di cluster itu; password role tersimpan di `/opt/pilartangguh/.db_password` (chmod 600) — jangan disalin ke repo atau ke log.
- **Caddy juga container** (`validity-caddy`), config-nya read-only mount `/opt/validity/Caddyfile`. Reload memakai `docker exec validity-caddy caddy reload --config /Caddyfile`; `systemctl reload caddy` tidak berlaku di server ini.
- **Rahasia produksi ada di `/opt/pilartangguh/.env`** (chmod 600) — `AUTH_SECRET`, `DATABASE_URL`, dan login CMS (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`). Skrip deploy men-symlink file ini ke `src/` dan `app/`, jadi satu sumber untuk build, runtime, dan poller.
- **Sudah tayang (2026-11-10, commit `f8dde8b`):** app jalan di PM2 `pilartangguh` (port 3100) + `pilartangguh-poller`, DB ter-push & ter-seed (4 produk / 4 kategori / 1 admin), dan apex `pilartangguh.co.id` + `www` di Caddy diarahkan ke `reverse_proxy 172.18.0.1:3100` menggantikan redirect lama. Aturan UFW `3100/tcp ALLOW 172.16.0.0/12` sudah dipasang; backup Caddyfile sebelum perubahan ada di `/opt/pilartangguh-backups/Caddyfile.2026-11-10-1308`. Mount Caddyfile di `validity-caddy` sudah dinormalkan dengan satu `docker restart validity-caddy` (inode host = inode container), jadi perubahan bertahan setelah reboot; validity + maternicare terverifikasi tetap layan setelah restart.
- **Masih perlu dikerjakan:** (1) isi **YouTube Channel ID** per portal di CMS agar poller menghasilkan video; (2) ganti nomor WhatsApp + teks landing/SEO asli klien lewat CMS (seed masih memakai nilai contoh); (3) belum ada form ganti password admin — kalau perlu, tambahkan route + field di Pengaturan.
- **Auto-deploy sudah terbukti end-to-end** (run 42769758581 = success, ±4 menit): secrets Actions `VPS_HOST` / `VPS_USER` / `SSH_PRIVATE_KEY` sudah diisi, dan deploy berikutnya hanya perlu `git push` ke `main`. Setelah deploy lewat Actions, app di-reload (PM2 restart count naik) tanpa menyentuh `maternicare-api` maupun container validity, dan marker `.seeded` mencegah seed ulang.
- Backup baseline server ada di `/opt/pilartangguh-backups/` (Caddyfile, `pm2 ls`, `docker ps`, `ufw status`) dan swap 2 GB sudah aktif (`/swapfile2`, terdaftar di `/etc/fstab`).
