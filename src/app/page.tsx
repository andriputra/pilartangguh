import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSections, getSettings, waLink } from "@/lib/site";
import Header from "@/components/site/Header";
import Hero from "@/components/site/Hero";
import Marquee from "@/components/site/Marquee";
import About from "@/components/site/About";
import Catalog from "@/components/site/Catalog";
import Network from "@/components/site/Network";
import CtaBand from "@/components/site/CtaBand";
import Footer from "@/components/site/Footer";
import WaFloat from "@/components/site/WaFloat";

export const dynamic = "force-dynamic";

function shuffle<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Menyelang-seling produk per kategori supaya baris pertama tidak didominasi satu kategori.
function spreadByCategory<T extends { category: { name: string } }>(items: T[]): T[] {
  const labels: string[] = [];
  const buckets: T[][] = [];
  for (const item of items) {
    let index = labels.indexOf(item.category.name);
    if (index === -1) {
      index = buckets.length;
      labels.push(item.category.name);
      buckets.push([]);
    }
    buckets[index].push(item);
  }

  const lists = buckets.map(shuffle);
  const cursors = lists.map(() => 0);
  const out: T[] = [];
  for (;;) {
    let picked = false;
    for (let i = 0; i < lists.length; i++) {
      if (cursors[i] < lists[i].length) {
        out.push(lists[i][cursors[i]]);
        cursors[i] += 1;
        picked = true;
      }
    }
    if (!picked) return out;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const sections = await getSections();
  return {
    title: sections.seo.title,
    description: sections.seo.description,
    openGraph: {
      title: sections.seo.title,
      description: sections.seo.description,
      images: [sections.seo.ogImage],
      type: "website",
    },
  };
}

export default async function HomePage() {
  const [sections, settings] = await Promise.all([getSections(), getSettings()]);
  const [products, categories, portals] = await Promise.all([
    prisma.product.findMany({
      where: { published: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: { category: { select: { name: true } } },
    }),
    prisma.category.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } }),
    prisma.portalLink.findMany({
      where: { published: true },
      orderBy: [{ order: "asc" }, { number: "asc" }],
      include: { videos: { orderBy: { publishedAt: "desc" }, take: 1, select: { title: true, url: true, externalId: true, publishedAt: true } } },
    }),
  ]);

  const waUrl = waLink(settings.whatsapp_number, settings.whatsapp_message);

  return (
    <>
      <Header waUrl={waUrl} />
      <WaFloat waUrl={waUrl} label={settings.chat_label} />
      <main>
        <Hero hero={sections.hero} stats={sections.stats.items} waUrl={waUrl} />
        <Marquee items={sections.marquee.items} />
        <About about={sections.about} waUrl={waUrl} />
        <Catalog
          catalog={sections.catalog}
          categories={categories}
          products={spreadByCategory(products).map((p) => ({ ...p, category: { name: p.category.name } }))}
          waBase={`https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, "")}?text=`}
        />
        <Network network={sections.network} portals={portals} />
        <CtaBand cta={sections.cta} waUrl={waUrl} />
      </main>
      <Footer footer={sections.footer} waUrl={waUrl} contact={settings.contact_email} />
    </>
  );
}
