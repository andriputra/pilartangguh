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
          products={products.map((p) => ({ ...p, category: { name: p.category.name } }))}
          waBase={`https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, "")}?text=`}
        />
        <Network network={sections.network} portals={portals} />
        <CtaBand cta={sections.cta} waUrl={waUrl} />
      </main>
      <Footer footer={sections.footer} waUrl={waUrl} contact={settings.contact_email} />
    </>
  );
}
