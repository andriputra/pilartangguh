# Deploy PilarTangguh ke VPS (pilartangguh.co.id)

Target: `203.194.114.127` · domain `pilartangguh.co.id` · shared server (sudah ada Caddy + PostgreSQL 127.0.0.1:5432 + app lain).

**Prinsip: additive-only.** Jangan hentikan/restart service lain. Jangan ubah config Caddy/Postgres yang sudah ada — hanya tambahkan blok/file baru. RAM server 2GB, jadi build dilakukan dengan hemat.

---

## 0. DNS

Pastikan A record `pilartangguh.co.id` → `203.194.114.127` (dan `www` jika perlu). Cek: `dig +short pilartangguh.co.id` dari server.

## 1. Database (via SSH ke VPS)

```bash
ssh root@203.194.114.127

sudo -u postgres psql <<'SQL'
CREATE USER pilartangguh WITH PASSWORD 'GANTI_PASSWORD_KUAT';
CREATE DATABASE pilartangguh OWNER pilartangguh;
GRANT ALL PRIVILEGES ON DATABASE pilartangguh TO pilartangguh;
SQL
```

Ganti password Postgres 18 di VPS — gunakan minimal 20 karakter acak:
`openssl rand -base64 24`

## 2. Ambil kode & build

```bash
mkdir -p /opt/pilartangguh && cd /opt/pilartangguh
git clone git@github.com:<owner>/pilartangguh.git src   # atau rsync dari laptop
cd src

# .env produksi — JANGAN commit
cat > .env <<'ENV'
DATABASE_URL="postgresql://pilartangguh:GANTI_PASSWORD_KUAT@127.0.0.1:5432/pilartangguh?schema=public"
AUTH_SECRET="GANTI_DENGAN_openssl_rand_base64_32"
NEXT_PUBLIC_SITE_URL="https://pilartangguh.co.id"
SEED_ADMIN_EMAIL="admin@pilartangguh.co.id"
SEED_ADMIN_PASSWORD="GANTI_PASSWORD_ADMIN_CMS"
ENV

npm ci --no-audit --no-fund
npx prisma generate
npx prisma db push
npm run build
npx tsx prisma/seed.ts
```

> Catatan: `npm ci` + `next build` makan ±1GB RAM. Jika OOM, matikan sementara build app lain atau naikkan swap.

## 3. Susun folder runtime standalone

```bash
mkdir -p /opt/pilartangguh/app /opt/pilartangguh/logs
cp -r .next/standalone/. /opt/pilartangguh/app/
cp -r .next/static /opt/pilartangguh/app/.next/static
cp -r public /opt/pilartangguh/app/public
cp .env /opt/pilartangguh/app/.env
cp ecosystem.config.js /opt/pilartangguh/
```

`ecosystem.config.js` menaruh app di port **3100** (127.0.0.1 saja, tidak dibuka di UFW — diakses lewat Caddy).

## 4. PM2

```bash
pm2 start /opt/pilartangguh/ecosystem.config.js
pm2 save
pm2 logs pilartangguh --lines 30   # harus "Ready on http://127.0.0.1:3100"
curl -sI http://127.0.0.1:3100     # harus 200
```

## 5. Caddy (reverse proxy + auto-HTTPS)

Tambahkan blok **baru** di Caddyfile (jangan hapus site block lain). Backup dulu:

```bash
cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak-$(date +%F)

cat >> /etc/caddy/Caddyfile <<'CADDY'

pilartangguh.co.id, www.pilartangguh.co.id {
    encode gzip zstd
    reverse_proxy 127.0.0.1:3100
}
CADDY

caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

Caddy otomatis minta sertifikat Let's Encrypt saat request pertama (butuh port 80/443 terbuka & DNS sudah mengarah).

## 6. Verifikasi

- `https://pilartangguh.co.id` → landing tampil, tombol WA mengarah ke nomor seed.
- `https://pilartangguh.co.id/admin/login` → login dengan `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.
- Edit satu section di CMS → refresh halaman → konten berubah.
- Upload gambar produk → file muncul di `/opt/pilartangguh/app/public/uploads/`.

## 7. Update versi berikutnya

```bash
cd /opt/pilartangguh/src && git pull
npm ci && npx prisma generate && npx prisma db push && npm run build
# JANGAN hapus /opt/pilartangguh/app/public/uploads — salinan baru:
rsync -a --delete --exclude 'uploads' public/ /opt/pilartangguh/app/public/
rsync -a .next/standalone/. /opt/pilartangguh/app/
rsync -a --delete .next/static/ /opt/pilartangguh/app/.next/static/
pm2 reload pilartangguh
```

## Backup

```bash
sudo -u postgres pg_dump pilartangguh > /opt/pilartangguh/backup-db-$(date +%F).sql
tar czf /opt/pilartangguh/backup-uploads-$(date +%F).tar.gz -C /opt/pilartangguh/app public/uploads
```
