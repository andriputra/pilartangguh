# Deploy PilarTangguh ke VPS (pilartangguh.co.id)

Target: `203.194.114.127` · domain utama `https://pilartangguh.co.id` · server **shared**.

**Prinsip: additive-only.** Jangan hentikan/restart service lain, jangan mengubah blok Caddy/DB milik tetangga, selalu backup sebelum menyentuh config. RAM 2,2 GB + swap 2 GB — build dibatasi heap 1,5 GB.

## Topologi nyata server (baca dulu)

| Komponen | Bentuk nyata | Implikasi untuk deploy |
| --- | --- | --- |
| OS / resource | Ubuntu 24.04, 1 vCPU, 2,2 GB RAM, swapfile `/swapfile2` 2 GB | build pakai `NODE_OPTIONS=--max-old-space-size=1536` |
| PostgreSQL 16 | container Docker **`validity-postgres`**, port hanya dipublish ke `127.0.0.1:5432`, superuser `validity_app` | app PilarTangguh memakai host `127.0.0.1:5432`; DB `pilartangguh` + role `pilartangguh` dibuat di cluster yang sama (tanpa install Postgres kedua) |
| Caddy | container Docker **`validity-caddy`**, config read-only mount `/opt/validity/Caddyfile` | reload = `docker exec validity-caddy caddy reload …`, bukan `systemctl reload caddy` |
| Jaringan | Caddy jalan di network bridge, jadi untuk menyentuh proses di host memakai IP gateway docker **`172.18.0.1`** (pola yang sudah dipakai `maternicare-api` via `172.17.0.1:3001`) | app Next harus bind `0.0.0.0:3100` + UFW `allow 3100/tcp from 172.16.0.0/12` |
| Tetangga | `validity.pilartangguh.co.id` (container `validity-app:3000`), `maternicare.pilartangguh.co.id` (PM2 `maternicare-api`, static `/srv/maternicare-web`) | tidak boleh ikut restart; verifikasi mereka tetap 200 setelah deploy |
| App PilarTangguh | PM2 di host: `pilartangguh` (web, port 3100) + `pilartangguh-poller` (RSS YouTube tiap 30 menit) | `pm2 save` agar ikut recovered saat reboot |

Struktur folder di server:

```
/opt/pilartangguh/src   <- git checkout (npm ci, prisma, build, sumber poller)
/opt/pilartangguh/app   <- runtime standalone Next (dijalankan PM2)
/opt/pilartangguh/logs  <- log PM2
/opt/pilartangguh/.env  <- rahasia produksi, chmod 600, di-symlink ke src & app
/opt/pilartangguh-backups <- backup Caddyfile / ufw / pm2 / db sebelum perubahan
```

---

## 0. DNS

A record `pilartangguh.co.id` (dan `www`) -> `203.194.114.127`. Cek dari server: `getent hosts pilartangguh.co.id`. Port 80/443 harus terbuka — Caddy sudah menanganinya untuk tetangga.

## 1. Database (reuse `validity-postgres`)

Jalankan **di VPS**. Password dibuat di file, tidak lewat perintah interaktif:

```bash
mkdir -p /opt/pilartangguh
[ -f /opt/pilartangguh/.db_password ] || openssl rand -base64 24 | tr -d '/+=' > /opt/pilartangguh/.db_password
chmod 600 /opt/pilartangguh/.db_password

DB_PASS=$(cat /opt/pilartangguh/.db_password)

docker exec validity-postgres psql -U validity_app -d postgres -v ON_ERROR_STOP=1 -At <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'pilartangguh') THEN
    CREATE ROLE pilartangguh LOGIN PASSWORD '${DB_PASS}';
  ELSE
    ALTER ROLE pilartangguh WITH LOGIN PASSWORD '${DB_PASS}';
  END IF;
END
\$\$;
SQL

docker exec validity-postgres psql -U validity_app -d postgres -Atc \
  "SELECT 1 FROM pg_database WHERE datname='pilartangguh'" < /dev/null | grep -q 1 || \
  docker exec validity-postgres createdb -U validity_app -O pilartangguh pilartangguh < /dev/null
```

> Jangan pakai `docker exec -i` untuk perintah yang stdin-nya bukan skrip heredoc — `-i` menyedot sisa pipeline sehingga skrip berhenti diam-diam.

Uji kredensial dari dalam cluster (5432 tidak dipublish ke jaringan, jadi koneksi dari mesin lain akan timeout):

```bash
docker exec validity-postgres psql "postgresql://pilartangguh:${DB_PASS}@127.0.0.1:5432/pilartangguh" \
  -Atc "SELECT 'connect ok: ' || current_database() || ' as ' || current_user" < /dev/null
```

## 2. File `.env` produksi (di VPS, jangan commit)

```bash
umask 077
cat > /opt/pilartangguh/.env <<ENV
DATABASE_URL="postgresql://pilartangguh:$(cat /opt/pilartangguh/.db_password)@127.0.0.1:5432/pilartangguh?schema=public"
AUTH_SECRET="$(openssl rand -base64 32)"
NEXT_PUBLIC_SITE_URL="https://pilartangguh.co.id"
SEED_ADMIN_EMAIL="admin@pilartangguh.co.id"
SEED_ADMIN_PASSWORD="$(openssl rand -hex 8)"
FONNTE_TOKEN=""
FONNTE_TARGET=""
FONNTE_URL="https://api.fonnte.com/send"
ENV
chmod 600 /opt/pilartangguh/.env
```

Password login CMS = nilai `SEED_ADMIN_PASSWORD` di file tersebut (`grep '^SEED_ADMIN_PASSWORD' /opt/pilartangguh/.env`). Seed hanya dijalankan sekali (marker `/opt/pilartangguh/.seeded`), jadi mengubah nilai ini setelah seed pertama tidak mengubah password admin — ganti lewat CMS.

## 3. Build + jalankan (skrip)

`scripts/deploy-vps.sh` melakukan langkah 3–7 secara idempoten: pull `origin/main` (berhenti kalau working tree server kotor), symlink `.env` ke `src` dan `app`, `npm ci`, `prisma generate`, `prisma db push`, `next build` dengan heap dibatasi, susun folder `app/` (rsync `--exclude uploads` supaya gambar hasil upload tidak pernah hilang), seed sekali, `pm2 startOrReload --update-env` + `pm2 save`, lalu health check `/`, `/katalog`, `/kontak`, `/admin/login`.

```bash
# di VPS
git clone --branch main https://github.com/andriputra/pilartangguh.git /opt/pilartangguh/src
bash /opt/pilartangguh/src/scripts/deploy-vps.sh
```

Repo harus sudah di-push. Branch lain: `DEPLOY_BRANCH=xxx bash scripts/deploy-vps.sh` (GitHub Actions mengirim variabel ini lewat input *Run workflow*).

## 4. Caddy: arahkan domain utama ke app

Backup **sebelum** mengedit. Hanya blok apex (yang sekarang redirect sementara ke validity) yang berubah — blok lain dibiarkan utuh:

```bash
# di VPS
TS=$(date +%F-%H%M); mkdir -p /opt/pilartangguh-backups
cp -a /opt/validity/Caddyfile "/opt/pilartangguh-backups/Caddyfile.$TS"
```

Ganti blok ini di `/opt/validity/Caddyfile` (baris 6-10, backup ada di `/opt/pilartangguh-backups/`):

```
pilartangguh.co.id, www.pilartangguh.co.id {
	redir https://validity.pilartangguh.co.id{uri} permanent
}
```

menjadi:

```
pilartangguh.co.id, www.pilartangguh.co.id {
	encode gzip zstd
	reverse_proxy 172.18.0.1:3100
}
```

Lalu:

```bash
# di VPS
ufw allow from 172.16.0.0/12 to any port 3100 proto tcp comment 'docker caddy to pilartangguh'
docker exec validity-caddy caddy validate --config /etc/caddy/Caddyfile
docker exec validity-caddy caddy reload --config /etc/caddy/Caddyfile
```

> **Gotcha penting:** `/opt/validity/Caddyfile` di-bind-mount **satu file** (ro) ke `/etc/caddy/Caddyfile` di container. Container menyimpan *inode*, bukan path. Jadi:
>
> - **Selalu tulis in-place** — `cp Caddyfile.new /opt/validity/Caddyfile` atau editor yang menyimpan ke file yang sama. Jangan `mv` (mengganti inode), jangan `rsync --inplace` yang membuat file sementara.
> - Tanda inode sudah tertukar: isi host & isi mount berbeda → `stat -c %i /opt/validity/Caddyfile` vs `docker exec validity-caddy stat -c %i /etc/caddy/Caddyfile` (atau bandingkan `sed -n '6,11p'` keduanya).
> - Kalau terlanjur `mv`: `docker exec validity-caddy caddy reload --config <tmp>` **hanya** memperbaiki config yang sedang jalan; setiap restart/update container akan memuat inode lama lagi. Pemulihan permanen = recreate mount dengan `docker restart validity-caddy` (beberapa detik, proxy validity + maternicare ikut tersendat sebentar) — mintakan izin dulu karena ini service bersama.
> - `docker cp validity-caddy:/etc/caddy/Caddyfile …` bisa menipu: ia mengikuti path source mount di host, jadi isinya bisa terlihat "sudah baru" padahal inode di container masih lama. Bandingkan lewat `stat`/`sed` di dalam container, bukan `docker cp`.

`172.18.0.1` = IP gateway network tempat `validity-caddy` berada (terverifikasi: `docker inspect -f {{json .NetworkSettings.Networks}} validity-caddy` → `Gateway: 172.18.0.1`). Cek bila berubah:

```bash
docker network inspect $(docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}' validity-caddy) \
  -f '{{range .IPAM.Config}}{{.Gateway}}{{end}}'
```

Sertifikat Let's Encrypt apex sudah terbit saat blok redirect aktif, jadi HTTPS langsung jalan tanpa menunggu issuance.

## 5. PM2

```bash
pm2 ls                                  # pilartangguh (online) + pilartangguh-poller (cron)
curl -sI http://127.0.0.1:3100          # 200
tail -30 /root/.pm2/logs/pilartangguh-out.log   # "Ready on http://0.0.0.0:3100"
tail -10 /opt/pilartangguh/logs/poller-out.log
```

> `pm2 logs` bisa menunggu (mode tail) meskipun `--nostream` dipakai — untuk cek cepat lewat SSH lebih baik `tail` file log-nya langsung.

> **Poller YouTube**: `pilartangguh-poller` menjalankan `scripts/poll-youtube.mjs` dari `/opt/pilartangguh/src` tiap 30 menit (butuh `node_modules` + `.env` di sana). Wajar kalau `pm2 ls` menampilkannya **stopped** — ini batch job: jalan, selesai, lalu `cron_restart` menaikkan lagi tiap 30 menit. Isi **YouTube Channel ID** per podcast lewat CMS → Portal Tautan; selama belum ada, log berisi "Belum ada portal dengan YouTube Channel ID — lewati polling." Notifikasi WA hanya aktif bila `FONNTE_TOKEN` diisi; tanpa itu cukup bell CMS. Cek manual: `cd /opt/pilartangguh/src && node scripts/poll-youtube.mjs`.

## 6. Verifikasi

- `https://pilartangguh.co.id` → landing tampil, tombol WA mengarah ke nomor seed.
- `https://pilartangguh.co.id/katalog` → kop ringkas + statistik kategori/produk, sidebar kategori dengan jumlah item (di layar kecil jadi chip), sakelar Grid/List, pemilih urutan, pencarian nama/kode/spesifikasi, paginasi, kartu produk menampilkan chip kode + 3 poin spesifikasi + harga, tombol "Tanya" dan judul produk membuka halaman detail.
- `https://pilartangguh.co.id/katalog/helm-safety-pro` → gambar, kode, blok harga + dua tombol WA, tabel spesifikasi, 3 produk terkait. Slug lain / produk disembunyikan → 404.
- `https://pilartangguh.co.id/kontak` → kartu kanal (WA/email/jam), peta Google Maps termuat, FAQ terbuka-tutup, kirim formulir → muncul di CMS → Pesan Masuk + bell notifikasi.
  - Kalau POST `/api/contact` balas 500: cek `pm2 logs pilartangguh` — biasanya tabel `ContactMessage` belum dibuat (`npx prisma db push`).
- `https://pilartangguh.co.id/admin/login` → login dengan `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.
- Edit satu section di CMS (termasuk tab Halaman Katalog / Halaman Kontak) → refresh halaman → konten berubah.
- Upload gambar produk → file muncul di `/opt/pilartangguh/app/public/uploads/` dan **tetap ada** setelah deploy berikutnya.
- **Tetangga tidak terganggu**: `https://validity.pilartangguh.co.id` dan `https://maternicare.pilartangguh.co.id` tetap 200, container `validity-*` tidak pernah di-restart.

## 7. Auto-deploy (GitHub Actions -> VPS)

`.github/workflows/deploy.yml` jalan saat push ke `main` (bisa juga manual lewat *Run workflow*). Ia SSH ke VPS sebagai `root` lalu memanggil `scripts/deploy-vps.sh`.

Secrets yang perlu diisi di **GitHub -> repo -> Settings -> Secrets and variables -> Actions**:

| Secret | Nilai |
| --- | --- |
| `VPS_HOST` | `203.194.114.127` |
| `VPS_USER` | `root` |
| `SSH_PRIVATE_KEY` | isi penuh private key yang sudah diotorisasi di server (di laptop: `~/.ssh/github-actions-vps`) |

> Key harus ber-newline LF dan sudah ada di `authorized_keys` `root@VPS`. Kalau digantikan key baru, tempel public key-nya ke server. Deploy via Actions dan via SSH manual memakai skrip yang sama, jadi keduanya idempoten.

## 8. Update manual (tanpa Actions)

```bash
# di VPS
bash /opt/pilartangguh/src/scripts/deploy-vps.sh
```

> `db push` menambah kolom katalog (`code`, `price`, `specs String[]`) tanpa menghapus data. Produk lama nilainya kosong → spesifikasi tidak dirender dan harga menampilkan teks fallback; isi per produk lewat CMS → Produk & Kategori. Seed (`prisma/seed.ts`) hanya mengisi produk yang **baru dibuat**, jadi jangan andalkan seed untuk melengkapi produk yang sudah tayang.

## 9. Backup & rollback

```bash
# di VPS — sebelum menyentuh Caddy/DB
mkdir -p /opt/pilartangguh-backups
cp -a /opt/validity/Caddyfile /opt/pilartangguh-backups/Caddyfile.$(date +%F-%H%M)
docker exec validity-postgres pg_dump -U validity_app pilartangguh > /opt/pilartangguh-backups/db-$(date +%F).sql
tar czf /opt/pilartangguh-backups/uploads-$(date +%F).tar.gz -C /opt/pilartangguh/app public/uploads

# rollback Caddy (cp = tulis in-place, inode mount ikut terupdate; jangan mv)
cp -a /opt/pilartangguh-backups/Caddyfile.<TS> /opt/validity/Caddyfile
docker exec validity-caddy caddy reload --config /etc/caddy/Caddyfile

# rollback kode
cd /opt/pilartangguh/src && git checkout <sha> && bash scripts/deploy-vps.sh
```
