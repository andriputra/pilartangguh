import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSections, getSettings, waLink } from "@/lib/site";
import type { ContactChannel } from "@/lib/content";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import WaFloat from "@/components/site/WaFloat";
import Marquee from "@/components/site/Marquee";
import CtaBand from "@/components/site/CtaBand";
import Reveal from "@/components/site/Reveal";
import ContactForm from "@/components/site/ContactForm";
import FaqList from "@/components/site/FaqList";
import { CHANNEL_ICONS, ArrowUpRight, ClockIcon, PinIcon } from "@/components/site/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const sections = await getSections();
  const title = sections.contactPage.seoTitle;
  const description = sections.contactPage.seoDescription;
  return {
    title,
    description,
    openGraph: { title, description, images: [sections.hero.image], type: "website" },
  };
}

export default async function ContactPage() {
  const [sections, settings] = await Promise.all([getSections(), getSettings()]);
  const page = sections.contactPage;
  const waUrl = waLink(settings.whatsapp_number, settings.whatsapp_message);

  // Pesan yang sudah dibaca admin dianggap selesai; hitung yang masih terbuka sebagai penegasan SLA.
  const openMessages = await prisma.contactMessage.count({ where: { read: false } });

  const channels: (ContactChannel & { href: string })[] = page.channels.map((c) => ({
    ...c,
    href:
      c.href ||
      (c.icon === "wa"
        ? waUrl
        : c.icon === "mail"
          ? `mailto:${settings.contact_email}`
          : c.icon === "phone"
            ? `tel:${settings.whatsapp_number.replace(/[^0-9+]/g, "")}`
            : ""),
  }));

  return (
    <>
      <Header waUrl={waUrl} />
      <WaFloat waUrl={waUrl} label={settings.chat_label} />
      <main>
        {/* HERO */}
        <section className="relative overflow-hidden pb-16 pt-28 sm:pt-36 lg:pb-20">
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.05]">
            <div className="absolute left-[8%] top-0 h-full w-px bg-ink" />
            <div className="absolute right-[8%] top-0 h-full w-px bg-ink" />
          </div>
          <div className="container-site grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
            <div>
              <Reveal>
                <p className="eyebrow flex items-center gap-3">
                  <span className="h-px w-8 bg-brand" />
                  {page.eyebrow}
                </p>
              </Reveal>
              <Reveal delay={0.08}>
                <h1 className="mt-5 font-display text-[2.3rem] font-extrabold leading-[1.04] tracking-tight sm:text-5xl lg:text-[3.6rem]">
                  {page.title}
                  <br />
                  <span className="text-brand">{page.titleAccent}</span>
                </h1>
              </Reveal>
              <Reveal delay={0.16}>
                <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-ink/60">{page.body}</p>
              </Reveal>
              <Reveal delay={0.24}>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary !bg-ink hover:!bg-brand"
                  >
                    Chat WhatsApp
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                  <a href="#form" className="group inline-flex items-center gap-2 text-sm font-semibold text-ink/80 transition hover:text-brand">
                    Kirim formulir
                    <span className="h-px w-6 bg-ink/40 transition-all group-hover:w-8 group-hover:bg-brand" />
                  </a>
                </div>
              </Reveal>
              <Reveal delay={0.32}>
                <dl className="mt-11 grid gap-x-8 gap-y-5 border-t border-line pt-7 sm:grid-cols-3">
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.18em] text-ink/45">Respons</dt>
                    <dd className="mt-1.5 font-display text-xl font-extrabold">
                      {openMessages > 0 ? `${openMessages} menunggu` : "Cepat"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.18em] text-ink/45">Kanal</dt>
                    <dd className="mt-1.5 font-display text-xl font-extrabold">{channels.length} aktif</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.18em] text-ink/45">Jangkauan</dt>
                    <dd className="mt-1.5 font-display text-xl font-extrabold">Seluruh Indonesia</dd>
                  </div>
                </dl>
              </Reveal>
            </div>

            {/* KANAL */}
            <div className="grid gap-4 self-center">
              {channels.map((c, i) => {
                const Icon = CHANNEL_ICONS[c.icon] ?? CHANNEL_ICONS.wa;
                const dark = i === 0;
                const card = (
                  <div
                    className={`group flex h-full items-start gap-4 rounded-lg p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift sm:p-7 ${
                      dark ? "bg-ink text-white" : "bg-white text-ink"
                    }`}
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md transition-transform duration-300 group-hover:scale-110 ${
                        dark ? "bg-white/10 text-brand" : "bg-brand-light text-brand-dark"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="flex items-center gap-2 font-display text-base font-bold">
                        {c.title}
                        {Boolean(c.href) && (
                          <ArrowUpRight className="h-4 w-4 text-ink/30 transition-all group-hover:text-brand" />
                        )}
                      </h2>
                      <div className={`mt-1.5 whitespace-pre-line text-[13px] leading-relaxed ${dark ? "text-white/65" : "text-ink/55"}`}>
                        {c.lines}
                      </div>
                    </div>
                  </div>
                );
                return (
                  <Reveal key={c.title} delay={0.1 + i * 0.08}>
                    {c.href && c.href.startsWith("http") ? (
                      <a href={c.href} target="_blank" rel="noopener noreferrer" className="block h-full">
                        {card}
                      </a>
                    ) : c.href ? (
                      <a href={c.href} className="block h-full">
                        {card}
                      </a>
                    ) : (
                      card
                    )}
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <Marquee items={sections.marquee.items} />

        {/* FORM + LOKASI */}
        <section id="form" className="scroll-mt-24 py-16 sm:py-20">
          <div className="container-site grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
            <Reveal>
              <ContactForm
                title={page.formTitle}
                body={page.formBody}
                submitLabel={page.formSubmit}
                successMessage={page.formSuccess}
              />
            </Reveal>

            <div className="space-y-4">
              <Reveal delay={0.1}>
                <div className="overflow-hidden rounded-lg border border-line bg-white shadow-card">
                  <iframe
                    title={`Peta lokasi: ${page.mapsQuery}`}
                    src={`https://www.google.com/maps?q=${encodeURIComponent(page.mapsQuery)}&z=11&output=embed`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="h-56 w-full border-0 sm:h-64"
                  />
                  <div className="p-6">
                    <h2 className="flex items-center gap-2.5 font-display text-base font-bold">
                      <PinIcon className="h-4 w-4 text-brand" />
                      {page.addressTitle}
                    </h2>
                    <p className="mt-2 text-[13px] leading-relaxed text-ink/55">{page.address}</p>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.18}>
                <div className="rounded-lg bg-sand/70 p-6">
                  <h2 className="flex items-center gap-2.5 font-display text-base font-bold">
                    <ClockIcon className="h-4 w-4 text-brand" />
                    {page.hoursTitle}
                  </h2>
                  <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-ink/60">{page.hours}</p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-sand/70 py-16 sm:py-20">
          <div className="container-site grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            <Reveal>
              <p className="eyebrow">PERTANYAAN UMUM</p>
              <h2 className="mt-4 font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-[2.4rem]">
                {page.faqTitle.split("|")[0]}
                {page.faqTitle.includes("|") && (
                  <>
                    {" "}
                    <span className="text-brand">{page.faqTitle.split("|")[1]}</span>
                  </>
                )}
              </h2>
              <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-ink/55">{page.faqBody}</p>
            </Reveal>
            <Reveal delay={0.1}>
              <FaqList items={page.faqs} />
            </Reveal>
          </div>
        </section>

        <CtaBand cta={sections.cta} waUrl={waUrl} />
      </main>
      <Footer footer={sections.footer} waUrl={waUrl} contact={settings.contact_email} />
    </>
  );
}
