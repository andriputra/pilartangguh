import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");
const images = [
  { titles: ["Agen Benang Bandung"], image: "/images/portal-agen-benang-bandung.webp", imageAlt: "Kolase produk benang dan perlengkapan tekstil Agen Benang Bandung" },
  { titles: ["RWCaper", "RW Caper"], image: "/images/portal-rw-caper.webp", imageAlt: "Kolase percakapan podcast RW Caper bersama warga" },
  { titles: ["Bincang TPT"], image: "/images/portal-bincang-tpt.webp", imageAlt: "Kolase diskusi tekstil dan produk tekstil di podcast Bincang TPT" },
];

try {
  for (const item of images) {
    const portals = await prisma.portalLink.findMany({
      where: { image: null, OR: item.titles.map((title) => ({ title: { equals: title, mode: "insensitive" } })) },
      select: { id: true, title: true, imageAlt: true },
    });
    for (const portal of portals) {
      if (apply) {
        await prisma.portalLink.updateMany({
          where: { id: portal.id, image: null },
          data: { image: item.image, imageAlt: portal.imageAlt ?? item.imageAlt },
        });
      }
      console.log(`${apply ? "Applied" : "Preview"}: ${portal.title} -> ${item.image}`);
    }
  }
  if (!apply) console.log("Preview only. Add --apply to fill missing images; existing images and explicit removals are preserved.");
} finally {
  await prisma.$disconnect();
}
