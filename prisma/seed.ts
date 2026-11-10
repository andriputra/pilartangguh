import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_CONTENT, DEFAULT_SETTINGS, SECTION_KEYS } from "../src/lib/content";

const prisma = new PrismaClient();

async function main() {
  for (const key of SECTION_KEYS) {
    await prisma.siteContent.upsert({
      where: { key },
      update: {},
      create: { key, data: DEFAULT_CONTENT[key] as object },
    });
  }

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }

  const email = process.env.SEED_ADMIN_EMAIL || "admin@pilartangguh.co.id";
  const password = process.env.SEED_ADMIN_PASSWORD || "PilarTangguh2026!";
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Admin PilarTangguh",
      passwordHash: await bcrypt.hash(password, 10),
    },
  });

  const categories = [
    { slug: "kepala", name: "Kepala" },
    { slug: "visibility", name: "Visibility" },
    { slug: "kaki", name: "Kaki" },
    { slug: "tangan", name: "Tangan" },
  ];
  const catIds: Record<string, string> = {};
  for (let i = 0; i < categories.length; i++) {
    const c = categories[i];
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, order: i },
      create: { ...c, order: i },
    });
    catIds[c.slug] = row.id;
  }

  const products = [
    {
      name: "Helm Safety Pro",
      slug: "helm-safety-pro",
      badge: "Best seller",
      category: "kepala",
      image: "/images/products/helm.jpg",
      description: "Helm safety dengan cangkang tahan benturan dan busa peredam ganda.",
    },
    {
      name: "Rompi High Visibility",
      slug: "rompi-high-visibility",
      badge: "High visibility",
      category: "visibility",
      image: "/images/products/rompi.jpg",
      description: "Rompi reflektif untuk visibilitas maksimal di area kerja dan gudang.",
    },
    {
      name: "Sepatu Safety Defender",
      slug: "sepatu-safety-defender",
      badge: "Anti-slip",
      category: "kaki",
      image: "/images/products/sepatu.jpg",
      description: "Sepatu safety dengan pelat baja, sol anti-slip, dan kenyamanan harian.",
    },
    {
      name: "Sarung Tangan Guard",
      slug: "sarung-tangan-guard",
      badge: "Grip kuat",
      category: "tangan",
      image: "/images/products/sarung.jpg",
      description: "Sarung tangan kerja dengan grip kuat dan proteksi abrasi.",
    },
  ];
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { order: i },
      create: {
        name: p.name,
        slug: p.slug,
        badge: p.badge,
        image: p.image,
        description: p.description,
        order: i,
        categoryId: catIds[p.category],
      },
    });
  }

  const portals: { title: string; description: string; url: string; tag?: string; status: string; dark: boolean; number: number }[] = [
    {
      title: "Agen Benang Bandung",
      description: "Portal kebutuhan benang dan tekstil",
      url: "https://agenbenangbandung.net",
      status: "ONLINE",
      dark: true,
      number: 1,
    },
    {
      title: "Go Manic",
      description: "Eksplorasi platform Go Manic",
      url: "https://gomanic.pilartangguh.co.id",
      status: "ONLINE",
      dark: false,
      number: 2,
    },
    {
      title: "RWCaper",
      description: "Area portal mitra RWCaper",
      url: "",
      tag: "Podcast",
      status: "SEGERA HADIR",
      dark: false,
      number: 3,
    },
    {
      title: "Bincang TPT",
      description: "Ruang diskusi tekstil dan produk",
      url: "",
      tag: "Podcast",
      status: "SEGERA HADIR",
      dark: false,
      number: 4,
    },
  ];
  for (let i = 0; i < portals.length; i++) {
    const p = portals[i];
    const existing = await prisma.portalLink.findFirst({ where: { title: p.title } });
    if (existing) {
      await prisma.portalLink.update({ where: { id: existing.id }, data: { order: i, tag: p.tag } });
    } else {
      await prisma.portalLink.create({ data: { ...p, order: i } });
    }
  }

  console.log("Seed selesai.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
