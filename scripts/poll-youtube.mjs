// Polls YouTube RSS feeds of portal channels, stores new videos,
// creates in-app notifications, and optionally sends a WhatsApp blast via Fonnte.
// Run: node scripts/poll-youtube.mjs   (reads .env from the project root)

import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// load .env from the project root (plain node runtime, no dotenv dependency)
if (existsSync(join(root, ".env"))) {
  for (const line of readFileSync(join(root, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

const prisma = new PrismaClient();

function decodeXml(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function parseEntries(xml) {
  const out = [];
  for (const block of xml.split("<entry>").slice(1)) {
    const pick = (re) => block.match(re)?.[1] ?? "";
    const externalId = pick(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    if (!externalId) continue;
    out.push({
      externalId,
      title: decodeXml(pick(/<title>([^<]*)<\/title>/)) || "Video tanpa judul",
      publishedAt: new Date(pick(/<published>([^<]+)<\/published>/) || Date.now()),
      url: `https://www.youtube.com/watch?v=${externalId}`,
    });
  }
  return out;
}

async function fetchFeed(channelId) {
  const url = process.env.YT_FEED_BASE
    ? `${process.env.YT_FEED_BASE}?channel_id=${channelId}` // test hook (fixture server)
    : `https://www.youtube.com/feed/videos.xml?channel_id=${channelId}`;
  const res = await fetch(url, {
    headers: { "user-agent": "PilartangguhBot/1.0 (+https://pilartangguh.co.id)" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  if (!xml.includes("<feed") || !xml.includes("youtube.com")) {
    throw new Error("Respons bukan RSS YouTube (kemungkinan diblokir/redirect) — jalankan dari server VPS.");
  }
  return xml;
}

async function sendWhatsApp(text) {
  const token = process.env.FONNTE_TOKEN;
  if (!token) {
    console.log("[poll] FONNTE_TOKEN tidak diisi — notifikasi WhatsApp dilewati (bell CMS tetap terisi).");
    return false;
  }
  const target = process.env.FONNTE_TARGET || (await prisma.setting.findUnique({ where: { key: "whatsapp_number" } }))?.value;
  if (!target) {
    console.warn("[poll] Tidak ada nomor target WhatsApp (FONNTE_TARGET / setting whatsapp_number).");
    return false;
  }
  const res = await fetch(process.env.FONNTE_URL || "https://api.fonnte.com/send", {
    method: "POST",
    headers: { Authorization: token },
    body: new URLSearchParams({ target, message: text }),
    signal: AbortSignal.timeout(20000),
  });
  const body = await res.text();
  console.log(`[poll] Fonnte -> HTTP ${res.status}: ${body.slice(0, 200)}`);
  return res.ok;
}

async function main() {
  const portals = await prisma.portalLink.findMany({ where: { youtubeChannelId: { not: null } } });
  if (portals.length === 0) {
    console.log("[poll] Belum ada portal dengan YouTube Channel ID — lewati polling.");
    return;
  }

  const allNew = [];
  for (const portal of portals) {
    let entries;
    try {
      entries = parseEntries(await fetchFeed(portal.youtubeChannelId));
    } catch (e) {
      console.error(`[poll] Gagal menarik feed "${portal.title}": ${e.message}`);
      continue;
    }
    const known = new Set((await prisma.video.findMany({ where: { portalId: portal.id }, select: { externalId: true } })).map((v) => v.externalId));
    const fresh = entries.filter((e) => !known.has(e.externalId)).sort((a, b) => a.publishedAt - b.publishedAt);

    for (const v of fresh) {
      await prisma.video.create({ data: { externalId: v.externalId, title: v.title, url: v.url, publishedAt: v.publishedAt, portalId: portal.id } });
      await prisma.notification.create({
        data: { type: "video", message: `Video baru di ${portal.title}: ${v.title}`, link: v.url },
      });
      allNew.push({ portal: portal.title, ...v });
      console.log(`[poll] + ${portal.title}: ${v.title}`);
    }
  }

  if (allNew.length > 0) {
    const lines = allNew.map((v) => `• ${v.portal}: ${v.title}\n  ${v.url}`);
    await sendWhatsApp(`🎬 *Ada video terbaru di PilarTangguh!*\n\n${lines.join("\n\n")}`);
  } else {
    console.log("[poll] Tidak ada video baru.");
  }
}

main()
  .catch((e) => {
    console.error("[poll] Error:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
