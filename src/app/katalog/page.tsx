import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSections, getSettings, waLink } from "@/lib/site";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import WaFloat from "@/components/site/WaFloat";
import CatalogBoard from "@/components/site/CatalogBoard";
import CtaBand from "@/components/site/CtaBand";
import Reveal from "@/components/site/Reveal";
import { ArrowUpRight } from "@/components/site/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const sections = await getSections();
  const title = sections.catalogPage.seoTitle;
  const description = sections.catalogPage.seoDescription;
  return {
    title,
    description,
    openGraph: { title, description, images: [sections.catalogPage.image], type: "website" },
  };
}

export default async function CatalogPage() {
  const [sections, settings] = await Promise.all([getSections(), getSettings()]);
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { published: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: { category: { select: { name: true } } },
    }),
    prisma.category.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } }),
  ]);

  const page = sections.catalogPage;
  const waUrl = waLink(settings.whatsapp_number, settings.whatsapp_message);
  const waBase = `https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, "")}?text=`;

  return (
    <>
      <Header waUrl={waUrl} />
      <WaFloat waUrl={waUrl} label={settings.chat_label} />
      <main>
        {/* KOP KATALOG */}
        <section className="border-b border-line pb-8 pt-28 sm:pt-32">
          <div className="container-site">
            <Reveal>
              <nav aria-label="Remah breadcrumbs" className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-ink/40">
                <Link href="/" className="transition-colors hover:text-brand">
                  Beranda
                </Link>
                <ArrowUpRight className="h-3 w-3 rotate-45" />
                <span className="text-brand">Katalog</span>
              </nav>
            </Reveal>

            <div className="mt-6 grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
              <Reveal>
                <p className="eyebrow flex items-center gap-3">
                  <span className="h-px w-8 bg-brand" />
                  {page.eyebrow}
                </p>
                <h1 className="mt-4 font-display text-[2.1rem] font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
                  {page.title}{" "}
                  <span className="text-brand">{page.titleAccent}</span>
                </h1>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="max-w-md text-[14px] leading-relaxed text-ink/55">{page.body}</p>
              </Reveal>
            </div>

            <Reveal delay={0.16}>
              <dl className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-line pt-5">
                {[
                  { label: "Kategori", value: String(categories.length) },
                  { label: "Produk tayang", value: String(products.length) },
                  { label: "Update katalog", value: new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" }) },
                ].map((s, i) => (
                  <div key={s.label} className={i > 0 ? "border-l border-ink/15 pl-8" : ""}>
                    <dt className="text-[10.5px] uppercase tracking-[0.18em] text-ink/40">{s.label}</dt>
                    <dd className="mt-0.5 font-display text-[15px] font-extrabold">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </section>

        <CatalogBoard
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            image: p.image,
            badge: p.badge,
            description: p.description,
            code: p.code,
            price: p.price,
            specs: p.specs,
            createdAt: p.createdAt.toISOString(),
            category: { name: p.category.name },
          }))}
          categories={categories}
          text={page}
          waBase={waBase}
          waUrl={waUrl}
        />
      </main>
      <CtaBand cta={sections.cta} waUrl={waUrl} />
      <Footer footer={sections.footer} waUrl={waUrl} contact={settings.contact_email} />
    </>
  );
}
