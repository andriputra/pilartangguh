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

- Situs publik: `http://localhost:3000/`, `/katalog`, `/kontak`
- Admin CMS: `http://localhost:3000/admin/login` — login default seed: `admin@pilartangguh.co.id` / `PilarTangguh2026!` (ganti `SEED_ADMIN_PASSWORD` di `.env` sebelum seed produksi).

## CMS — yang bisa dikelola

| Menu | Isi |
|---|---|
| Konten Landing | Hero, Statistik, Ticker, Profil (kartu keunggulan), Katalog intro, **Halaman Katalog**, Portal intro, **Halaman Kontak**, CTA band, Footer, SEO |
| Produk & Kategori | CRUD produk (gambar via upload, badge, **kode produk, harga, spesifikasi per baris**, deskripsi, urutan, publish) + kategori untuk tab filter beranda & halaman /katalog |
| Portal Tautan | Kartu jaringan (judul, deskripsi, URL, label tag mis. "Podcast", status ONLINE/SEGERA HADIR, kartu gelap, nomor, **YouTube Channel ID**) |
| Pesan Masuk | Inbox formulir /kontak: daftar + panel detail, tandai terbaca/belum, balas via WA atau email, hapus |
| Pengaturan | Nomor WhatsApp, pesan default WA, label chat bubble, teks kontak footer |
| Notifikasi | Bell di sidebar — daftar video YouTube baru & pesan kontak masuk; tombol "Cek YouTube sekarang" |

## Halaman katalog & kontak

Dua halaman publik di luar beranda, desainnya senada (palette cream/sand/ink/brand, ticker, CTA band) dan seluruh teks serta label UI-nya dikelola lewat tab **Halaman Katalog** / **Halaman Kontak** di Konten Landing.

- `/katalog` — disusun seperti katalog produk pada umumnya: kop ringkas (breadcrumb, eyebrow, judul 2 baris, paragraf, baris statistik kategori/produk tayang/update), **sidebar kategori** yang menempel saat scroll (jumlah produk per kategori + kartu bantu gelap ber-tombol WhatsApp), **toolbar** (teks "Menampilkan X dari Y", pencarian pada nama/kode/spesifikasi, pemilih urutan Terbaru–A-Z–Z-A–Per kategori, sakelar tampilan Grid/List), **kartu produk** lengkap (gambar 4:3, badge, chip kode, kategori, nama, deskripsi, 3 poin spesifikasi, harga, tombol "Tanya"), **paginasi bernomor** (jumlah produk per halaman diatur dari CMS), kondisi hasil kosong, dan catatan kaki. Di layar kecil sidebar berubah jadi chip horizontal.
- `/katalog/{slug}` — halaman detail produk: gambar + chip kepercayaan, kategori, nama, kode, blok harga dengan dua tombol WhatsApp (tanya produk & konsultasi jumlah/ukuran), deskripsi, tabel spesifikasi (baris `Label: Nilai` otomatis jadi dua kolom), dan 3 produk terkait (didahulukan dari kategori yang sama). Produk yang tidak tayang → 404.
- `/kontak` — kop + kartu kanal (WhatsApp, email, jam layanan; ikon & isinya repeater CMS), grid formulir ↔ panel lokasi (embed Google Maps dari kueri peta yang bisa diedit, alamat, jam operasional), FAQ accordion animasi, CTA band.
- Formulir `/kontak` mengirim ke `POST /api/contact` ( publik ): validasi panjang, honeypot anti-bot, batas 5 pesan/10 menit per IP, disimpan di tabel `ContactMessage` **dan** memunculkan baris `Notification` sehingga bell CMS langsung berbunyi. Tanpa `FONNTE_TOKEN`, tidak ada WhatsApp keluar — hanya inbox CMS.
- Harga tidak pernah dikarang: kolom `price` bebas format ("Rp 185.000 / pcs"), dan bila kosong situs menampilkan teks fallback yang diatur di CMS (bawaan: "Harga menyesuaikan jumlah & lokasi"). Seed hanya mengisi kode & spesifikasi.

## Notifikasi video YouTube (podcast)

Setiap portal yang diisi **YouTube Channel ID** dipantau via RSS (`https://www.youtube.com/feed/videos.xml`). Alur:

1. Cron PM2 `pilartangguh-poller` menjalankan `node scripts/poll-youtube.mjs` tiap 30 menit (bisa manual: `npm run poll` atau tombol di halaman Notifikasi CMS).
2. Video baru → masuk tabel `Video` + baris `Notification`.
3. Kartu podcast di situs otomatis menampilkan "▶ {judul episode terbaru}" yang link ke YouTube.
4. Jika `FONNTE_TOKEN` diisi di `.env`, poller juga mengirim rekap ke WhatsApp (nomor `FONNTE_TARGET` / setting `whatsapp_number`). Tanpa token, notifikasi tetap masuk bell CMS.

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

- `docs/DEPLOY.md` — langkah deploy ke VPS 203.194.114.127 (pilartangguh.co.id): PM2 di host + Postgres & Caddy yang sudah ada sebagai container Docker (`validity-postgres`, `validity-caddy`) — jadi DB dibuat sebagai database baru di cluster existing, bukan instance baru. Termasuk auto-deploy GitHub Actions → SSH (`scripts/deploy-vps.sh`) dan prosedur backup/rollback. Prinsip: additive-only, service tetangga tidak di-restart.
- `docs/AGENT.md` — catatan arsitektur & konvensi untuk agent berikutnya.
