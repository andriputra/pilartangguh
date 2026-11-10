import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSections, getSettings, waLink } from "@/lib/site";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import WaFloat from "@/components/site/WaFloat";
import CtaBand from "@/components/site/CtaBand";
import Reveal from "@/components/site/Reveal";
import { ArrowUpRight, CheckIcon, ChevronLeftIcon, CubeIcon, ShieldIcon, WhatsAppIcon } from "@/components/site/icons";

export const dynamic = "force-dynamic";

type Params = { params: { slug: string } };

async function load(slug: string) {
  return prisma.product.findFirst({ where: { slug, published: true }, include: { category: { select: { name: true } } } });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const product = await load(params.slug);
  if (!product) return { title: "Produk tidak ditemukan — PilarTangguh" };
  const sections = await getSections();
  const description = product.description || sections.catalogPage.seoDescription;
  return {
    title: `${product.name} — ${sections.catalogPage.seoTitle.replace(/ — .*$/, "")}`,
    description,
    openGraph: { title: product.name, description, images: [product.image || sections.catalogPage.image], type: "article" },
  };
}

export default async function ProductDetailPage({ params }: Params) {
  const product = await load(params.slug);
  if (!product) notFound();

  const [sections, settings, related] = await Promise.all([
    getSections(),
    getSettings(),
    prisma.product.findMany({
      where: { published: true, id: { not: product.id } },
      orderBy: [{ categoryId: "asc" }, { order: "asc" }],
      take: 7,
      include: { category: { select: { name: true } } },
    }),
  ]);

  const sameCategory = related.filter((p) => p.categoryId === product.categoryId);
  const suggestions = [...sameCategory, ...related.filter((p) => p.categoryId !== product.categoryId)].slice(0, 3);

  const page = sections.catalogPage;
  const waUrl = waLink(settings.whatsapp_number, settings.whatsapp_message);
  const waBase = `https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, "")}?text=`;
  const askLink = `${waBase}${encodeURIComponent(`Halo tim PilarTangguh, saya ingin menanyakan ${product.name}${product.code ? ` (kode ${product.code})` : ""}. Bisa dibantu?`)}`;
  const consultLink = `${waBase}${encodeURIComponent(`Halo tim PilarTangguh, saya butuh konsultasi jumlah & ukuran untuk ${product.name}.`)}`;

  return (
    <>
      <Header waUrl={waUrl} />
      <WaFloat waUrl={waUrl} label={settings.chat_label} />
      <main>
        <section className="border-b border-line pb-14 pt-28 sm:pt-32">
          <div className="container-site">
            <div className="flex items-center justify-between gap-4">
              <nav aria-label="Remah breadcrumbs" className="flex min-w-0 items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-ink/40">
                <Link href="/" className="transition-colors hover:text-brand">Beranda</Link>
                <ArrowUpRight className="h-3 w-3 rotate-45" />
                <Link href="/katalog" className="transition-colors hover:text-brand">Katalog</Link>
                <ArrowUpRight className="h-3 w-3 rotate-45" />
                <span className="truncate text-brand">{product.name}</span>
              </nav>
              <Link href="/katalog" className="hidden shrink-0 items-center gap-1.5 text-[12px] font-bold text-ink/60 transition-colors hover:text-brand sm:flex">
                <ChevronLeftIcon className="h-3.5 w-3.5" />
                {page.detailBack}
              </Link>
            </div>

            <div className="mt-7 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
              {/* GAMBAR */}
              <Reveal>
                <div className="relative overflow-hidden rounded-lg border border-line bg-white p-3 shadow-card sm:p-4">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-sand">
                    {product.image ? (
                      <Image src={product.image} alt={product.name} fill sizes="(max-width: 1024px) 100vw, 620px" className="object-cover" priority />
                    ) : (
                      <span className="flex h-full items-center justify-center text-sm text-muted">Belum ada gambar</span>
                    )}
                    {product.badge && (
                      <span className="absolute left-3 top-3 rounded-sm bg-brand px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                        {product.badge}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 px-1 pb-1">
                    {[
                      { icon: ShieldIcon, text: page.detailTrust1 },
                      { icon: CubeIcon, text: page.detailTrust2 },
                    ].map((row) => (
                      <span key={row.text} className="flex items-center gap-2 rounded-md bg-sand/70 px-3 py-2 text-[11.5px] font-semibold text-ink/60">
                        <row.icon className="h-3.5 w-3.5 text-brand" />
                        {row.text}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>

              {/* INFO */}
              <div>
                <Reveal>
                  <p className="eyebrow">{product.category.name}</p>
                  <h1 className="mt-3 font-display text-[1.9rem] font-extrabold leading-[1.1] tracking-tight sm:text-[2.4rem]">{product.name}</h1>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-ink/50">
                    {product.code && (
                      <span>
                        {page.codeLabel}: <b className="font-bold tracking-wide text-ink">{product.code}</b>
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <CheckIcon className="h-3.5 w-3.5 text-brand" />
                      {page.detailStockNote}
                    </span>
                  </div>
                </Reveal>

                <Reveal delay={0.08}>
                  <div className="mt-6 rounded-lg border border-line bg-white px-5 py-4 shadow-card">
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-ink/40">{page.priceLabel}</p>
                    <p className="mt-1 font-display text-lg font-extrabold">{product.price || page.priceFallback}</p>
                    <div className="mt-4 flex flex-wrap gap-2.5">
                      <a href={askLink} target="_blank" rel="noopener noreferrer" className="btn-primary !py-2.5 !text-[13px]">
                        <WhatsAppIcon className="h-4 w-4" />
                        {page.detailCta}
                      </a>
                      <a href={consultLink} target="_blank" rel="noopener noreferrer" className="btn-ghost !py-2.5 !text-[13px]">
                        {page.detailConsult}
                      </a>
                    </div>
                  </div>
                </Reveal>

                {product.description && (
                  <Reveal delay={0.14}>
                    <div className="mt-7">
                      <h2 className="font-display text-[15px] font-extrabold uppercase tracking-wider text-ink/70">{page.detailDescTitle}</h2>
                      <p className="mt-2.5 text-[14px] leading-relaxed text-ink/60">{product.description}</p>
                    </div>
                  </Reveal>
                )}

                {product.specs.length > 0 && (
                  <Reveal delay={0.2}>
                    <div className="mt-7">
                      <h2 className="font-display text-[15px] font-extrabold uppercase tracking-wider text-ink/70">{page.detailSpecsTitle}</h2>
                      <dl className="mt-2.5 divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
                        {product.specs.map((s, i) => {
                          const idx = s.indexOf(":");
                          const label = idx > -1 ? s.slice(0, idx).trim() : null;
                          const value = idx > -1 ? s.slice(idx + 1).trim() : s;
                          return (
                            <div key={s} className="flex gap-4 px-4 py-3 text-[13px]">
                              <dt className={`w-40 shrink-0 font-semibold text-ink/50 ${label ? "" : "sr-only"}`}>{label || `Spesifikasi ${i + 1}`}</dt>
                              <dd className="min-w-0 flex-1">{value}</dd>
                            </div>
                          );
                        })}
                      </dl>
                    </div>
                  </Reveal>
                )}

                <Reveal delay={0.26}>
                  <Link href="/katalog" className="mt-7 inline-flex items-center gap-2 border-b border-ink pb-1 text-[13px] font-bold transition-colors hover:border-brand hover:text-brand sm:hidden">
                    <ChevronLeftIcon className="h-4 w-4" />
                    {page.detailBack}
                  </Link>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* PRODUK TERKAIT */}
        {suggestions.length > 0 && (
          <section className="py-14 sm:py-16">
            <div className="container-site">
              <Reveal>
                <div className="flex items-end justify-between gap-6">
                  <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-[1.9rem]">
                    {page.detailRelatedTitle.split("|")[0]}
                    {page.detailRelatedTitle.includes("|") && (
                      <> <span className="text-brand">{page.detailRelatedTitle.split("|")[1]}</span></>
                    )}
                  </h2>
                  <Link href="/katalog" className="shrink-0 text-[12.5px] font-bold text-brand hover:underline">
                    {page.detailAllLabel} →
                  </Link>
                </div>
              </Reveal>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {suggestions.map((p, i) => (
                  <Reveal key={p.id} delay={0.06 * i}>
                    <Link
                      href={`/katalog/${p.slug}`}
                      className="group flex gap-4 rounded-lg border border-line bg-white p-4 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
                    >
                      <span className="relative block h-24 w-24 shrink-0 overflow-hidden rounded-md bg-sand">
                        {p.image ? (
                          <Image src={p.image} alt={p.name} fill sizes="96px" className="object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-brand">{p.category.name}</span>
                        <span className="mt-1 block font-display text-[15px] font-bold leading-snug transition-colors group-hover:text-brand">{p.name}</span>
                        {p.code && <span className="mt-1 block text-[11px] tracking-wide text-ink/40">{p.code}</span>}
                        <span className="mt-2 block text-[12px] font-semibold text-ink/55">{p.price || page.priceFallback}</span>
                      </span>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}

        <CtaBand cta={sections.cta} waUrl={waUrl} />
      </main>
      <Footer footer={sections.footer} waUrl={waUrl} contact={settings.contact_email} />
    </>
  );
}
