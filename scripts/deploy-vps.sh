#!/usr/bin/env bash
# Deploy PilarTangguh ke VPS (pilartangguh.co.id). Jalankan DI SERVER:
#   bash /opt/pilartangguh/src/scripts/deploy-vps.sh
# Dipakai juga oleh GitHub Actions (.github/workflows/deploy.yml).
#
# Prinsip: additive-only. Tidak menyentuh container/service app lain, tidak menghapus
# public/uploads (gambar hasil CMS), dan tidak pernah menjalankan seed ulang bila DB sudah terisi.
set -euo pipefail

ROOT=/opt/pilartangguh
SRC=$ROOT/src
APP=$ROOT/app
ENV_FILE=$ROOT/.env
REPO=https://github.com/andriputra/pilartangguh.git
BRANCH=${DEPLOY_BRANCH:-main}
PORT=${PORT:-3100}

log() { printf '\n\033[1;36m== %s\033[0m\n' "$1"; }

log "0. prasyarat"
command -v node >/dev/null || { echo "node tidak ada"; exit 1; }
[ -f "$ENV_FILE" ] || { echo "$ENV_FILE belum ada — isi DATABASE_URL/AUTH_SECRET/SEED_ADMIN_* dulu"; exit 1; }
node -v; free -m | awk '/Mem|Swap/{print}'

log "1. sumber kode ($BRANCH)"
if [ ! -d "$SRC/.git" ]; then
  mkdir -p "$ROOT"
  git clone --branch "$BRANCH" "$REPO" "$SRC"
fi
cd "$SRC"
git fetch origin "$BRANCH"
if [ -n "$(git status --porcelain)" ]; then
  echo "working tree $SRC kotor — deploy dibatalkan supaya tidak menimpa perubahan manual di server:"
  git status --porcelain | head -20
  exit 1
fi
git checkout "$BRANCH" >/dev/null
git reset --hard "origin/$BRANCH"
echo "HEAD: $(git log --oneline -1)"

log "2. env"
# .env dipakai build (NEXT_PUBLIC_*), runtime standalone (cwd = $APP), dan poller (cwd = $SRC).
ln -sf "$ENV_FILE" "$SRC/.env"
mkdir -p "$APP"
ln -sf "$ENV_FILE" "$APP/.env"
set -a; . "$ENV_FILE"; set +a
# Build membaca .env dari repo; symlink di $SRC dilindungi oleh .gitignore.
git check-ignore -q .env 2>/dev/null || { echo ".env di $SRC tidak di-ignore git — rsync/reset akan menimpanya"; exit 1; }

log "3. install + skema"
npm ci --no-audit --no-fund
npx prisma generate
npx prisma db push

log "4. build (standalone)"
NODE_OPTIONS=--max-old-space-size=1536 npm run build
[ -f .next/standalone/server.js ] || { echo "build tidak menghasilkan standalone/server.js"; exit 1; }

log "5. susun folder runtime (uploads dipertahankan)"
mkdir -p "$APP/.next" "$APP/public/uploads"
rsync -a --delete --exclude 'uploads' --exclude '.env' .next/standalone/ "$APP/"
rsync -a --delete .next/static/ "$APP/.next/static/"
rsync -a --delete --exclude 'uploads' public/ "$APP/public/"
mkdir -p "$APP/prisma" "$APP/node_modules"
cp -f prisma/schema.prisma "$APP/prisma/schema.prisma"
if [ -d node_modules/.prisma/client ]; then
  rsync -a --delete node_modules/.prisma/ "$APP/node_modules/.prisma/"
fi
cp -f ecosystem.config.js "$ROOT/ecosystem.config.js"
du -sh "$APP" 2>/dev/null | sed 's/^/  ukuran app: /'
echo "  file uploads: $(find "$APP/public/uploads" -type f | wc -l)"

log "6. seed pertama (sekali saja, lewat marker .seeded)"
# Seed idempoten dan tidak menimpa konten/user/setting yang sudah diubah (`update: {}`),
# tapi tetap hanya dijalankan sekali agar order produk hasil edit CMS tidak tertimpa.
if [ ! -f "$ROOT/.seeded" ]; then
  npx tsx prisma/seed.ts
  touch "$ROOT/.seeded"
else
  echo "  marker .seeded ada — dilewati"
fi

log "7. PM2"
pm2 startOrReload "$ROOT/ecosystem.config.js" --update-env
pm2 save
pm2 ls

log "8. health check lokal"
sleep 3
CODE=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/")
echo "  GET / -> $CODE"
for p in /katalog /kontak /admin/login; do
  echo "  GET $p -> $(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT$p")"
done
[ "$CODE" = "200" ] || { echo "app belum menjawab 200 di port $PORT — cek: pm2 logs pilartangguh --lines 60"; exit 1; }
echo
echo "OK DEPLOY $(git log --oneline -1)"
