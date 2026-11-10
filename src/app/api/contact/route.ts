import { prisma } from "@/lib/prisma";

// Batas ringan per IP supaya formulir publik tidak dibanjiri bot.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits: Record<string, number[]> = {};

function tooMany(ip: string) {
  const now = Date.now();
  const recent = (hits[ip] || []).filter((t: number) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits[ip] = recent;
    return true;
  }
  recent.push(now);
  hits[ip] = recent;
  const keys = Object.keys(hits);
  if (keys.length > 500) {
    for (const key of keys) {
      if (!hits[key].some((t: number) => now - t < WINDOW_MS)) delete hits[key];
    }
  }
  return false;
}

function clean(value: unknown, max: number) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, max);
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  // honeypot: pengisian field tersembunyi = bot, balas diam-diam agar tidak memancing spam berulang
  if (clean(body.company, 20)) return Response.json({ ok: true });

  if (tooMany(ip)) {
    return Response.json({ error: "Terlalu banyak pesan dari perangkat ini. Coba lagi beberapa menit lagi." }, { status: 429 });
  }

  const name = clean(body.name, 120);
  const contact = clean(body.contact, 120);
  const subject = clean(body.subject, 140);
  const message = clean(body.message, 2000);

  if (name.length < 2) return Response.json({ error: "Nama minimal 2 karakter." }, { status: 400 });
  if (contact.length < 6) return Response.json({ error: "Email atau nomor WhatsApp tidak valid." }, { status: 400 });
  if (message.length < 10) return Response.json({ error: "Pesan minimal 10 karakter." }, { status: 400 });

  const saved = await prisma.contactMessage.create({
    data: { name, contact, subject: subject || null, message },
  });

  await prisma.notification.create({
    data: {
      type: "contact",
      message: `Pesan baru dari ${name} (${contact})${subject ? ` — ${subject}` : ""}`,
      link: "/admin/messages",
    },
  });

  return Response.json({ ok: true, id: saved.id });
}
