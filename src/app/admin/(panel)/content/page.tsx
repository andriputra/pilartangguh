"use client";

import { useEffect, useState } from "react";
import { DEFAULT_CONTENT, SECTION_KEYS, type SectionData, type SectionKey } from "@/lib/content";
import { ImageUpload, PageHeader, SelectField, TextArea, TextField, Toggle, useApi, useToast } from "@/components/admin/ui";

const TABS: { key: SectionKey; label: string }[] = [
  { key: "hero", label: "Hero" },
  { key: "stats", label: "Statistik" },
  { key: "marquee", label: "Ticker" },
  { key: "about", label: "Profil" },
  { key: "catalog", label: "Katalog (Beranda)" },
  { key: "catalogPage", label: "Halaman Katalog" },
  { key: "network", label: "Portal" },
  { key: "contactPage", label: "Halaman Kontak" },
  { key: "cta", label: "CTA" },
  { key: "footer", label: "Footer" },
  { key: "seo", label: "SEO" },
];

export default function ContentEditor() {
  const api = useApi();
  const toast = useToast();
  const [draft, setDraft] = useState<SectionData>(DEFAULT_CONTENT);
  const [tab, setTab] = useState<SectionKey>("hero");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<any[]>("/api/admin/content")
      .then((rows) => {
        const merged = { ...DEFAULT_CONTENT } as SectionData;
        for (const r of rows) {
          if ((SECTION_KEYS as readonly string[]).includes(r.key)) {
            (merged as any)[r.key] = { ...(merged as any)[r.key], ...(r.data ?? {}) };
          }
        }
        setDraft(merged);
      })
      .catch((e) => toast(e.message, "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function patch<K extends SectionKey>(key: K, value: Partial<SectionData[K]>) {
    setDraft((d) => ({ ...d, [key]: { ...(d as any)[key], ...value } }));
  }

  async function save() {
    setSaving(true);
    try {
      await api("/api/admin/content", { method: "PUT", body: JSON.stringify({ key: tab, data: draft[tab] }) });
      toast(`Section "${tab}" tersimpan. Halaman publik ter-update otomatis.`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal menyimpan", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Konten Landing"
        subtitle="Edit teks, gambar, dan kartu pada beranda serta halaman /katalog dan /kontak"
        actions={
          <button type="button" onClick={save} disabled={loading || saving} className="btn-primary !py-2 !text-xs disabled:opacity-60">
            {saving ? "Menyimpan…" : `Simpan section "${tab}"`}
          </button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-md px-3.5 py-1.5 text-xs font-bold transition-colors ${
              tab === t.key ? "bg-ink text-white" : "bg-white text-ink/60 hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-lg border border-line bg-white px-5 py-10 text-center text-sm text-ink/40">Memuat konten…</div>
      ) : (
        <div className="space-y-4 rounded-lg border border-line bg-white p-5 shadow-card">
          {tab === "hero" && (
            <>
              <TextField label="Eyebrow" value={draft.hero.eyebrow} onChange={(v) => patch("hero", { eyebrow: v })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Judul baris 1" value={draft.hero.title} onChange={(v) => patch("hero", { title: v })} />
                <TextField label="Judul aksen (orange)" value={draft.hero.titleAccent} onChange={(v) => patch("hero", { titleAccent: v })} />
              </div>
              <TextArea label="Paragraf" value={draft.hero.body} onChange={(v) => patch("hero", { body: v })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Tombol utama" value={draft.hero.primaryCta} onChange={(v) => patch("hero", { primaryCta: v })} />
                <TextField label="Teks konsultasi WA" value={draft.hero.secondaryCta} onChange={(v) => patch("hero", { secondaryCta: v })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Badge orange (atas foto)" value={draft.hero.badge} onChange={(v) => patch("hero", { badge: v })} />
                <TextField label="Sub badge" value={draft.hero.badgeSub} onChange={(v) => patch("hero", { badgeSub: v })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Kartu hitam — judul" value={draft.hero.stampTitle} onChange={(v) => patch("hero", { stampTitle: v })} />
                <TextField label="Kartu hitam — teks" value={draft.hero.stampText} onChange={(v) => patch("hero", { stampText: v })} />
              </div>
              <ImageUpload label="Foto hero (polaroid)" value={draft.hero.image} onChange={(url) => patch("hero", { image: url })} />
              <TextField label="Path gambar" value={draft.hero.image} onChange={(v) => patch("hero", { image: v })} hint="Terisi otomatis saat upload, bisa diubah manual." />
            </>
          )}

          {tab === "stats" && (
            <Repeater
              items={draft.stats.items}
              onChange={(items) => patch("stats", { items })}
              empty={{ value: "0+", label: "" }}
              render={(item, set) => (
                <div className="grid flex-1 grid-cols-2 gap-3">
                  <TextField label="Angka" value={item.value} onChange={(v) => set({ ...item, value: v })} />
                  <TextField label="Label" value={item.label} onChange={(v) => set({ ...item, label: v })} />
                </div>
              )}
            />
          )}

          {tab === "marquee" && (
            <Repeater
              items={draft.marquee.items}
              onChange={(items) => patch("marquee", { items })}
              empty=""
              render={(item, set) => <TextField label="Teks ticker" value={item} onChange={set} />}
            />
          )}

          {tab === "about" && (
            <>
              <TextField label="Eyebrow" value={draft.about.eyebrow} onChange={(v) => patch("about", { eyebrow: v })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Judul baris 1" value={draft.about.title} onChange={(v) => patch("about", { title: v })} />
                <TextField label="Judul aksen (orange)" value={draft.about.titleAccent} onChange={(v) => patch("about", { titleAccent: v })} />
              </div>
              <TextArea label="Paragraf" value={draft.about.body} onChange={(v) => patch("about", { body: v })} rows={4} />
              <TextField label="Teks link CTA" value={draft.about.cta} onChange={(v) => patch("about", { cta: v })} />
              <p className="label mt-2">Kartu keunggulan</p>
              <Repeater
                items={draft.about.cards}
                onChange={(cards) => patch("about", { cards })}
                empty={{ icon: "shield", dark: false, title: "", body: "" }}
                render={(card, set) => (
                  <div className="flex-1 space-y-3 rounded-md border border-line p-3.5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <TextField label="Judul kartu" value={card.title} onChange={(v) => set({ ...card, title: v })} />
                      <SelectField
                        label="Ikon"
                        value={card.icon}
                        onChange={(v) => set({ ...card, icon: v })}
                        options={[
                          { value: "shield", label: "🛡 Shield (proteksi)" },
                          { value: "cube", label: "📦 Cube (siap pakai)" },
                          { value: "check", label: "✓ Check (kepercayaan)" },
                        ]}
                      />
                    </div>
                    <TextArea label="Isi" value={card.body} onChange={(v) => set({ ...card, body: v })} rows={2} />
                    <Toggle label="Kartu gelap (hitam)" value={card.dark} onChange={(v) => set({ ...card, dark: v })} />
                  </div>
                )}
              />
            </>
          )}

          {(tab === "catalog" || tab === "network") && (
            <>
              <TextField label="Eyebrow" value={draft[tab].eyebrow} onChange={(v) => patch(tab, { eyebrow: v })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Judul baris 1" value={draft[tab].title} onChange={(v) => patch(tab, { title: v })} />
                <TextField label="Judul aksen (orange)" value={draft[tab].titleAccent} onChange={(v) => patch(tab, { titleAccent: v })} />
              </div>
              <TextArea label="Paragraf" value={draft[tab].body} onChange={(v) => patch(tab, { body: v })} />
            </>
          )}

          {tab === "catalogPage" && (
            <>
              <p className="rounded-md bg-sand/70 px-4 py-3 text-[12.5px] leading-relaxed text-ink/60">
                Isi halaman <b>/katalog</b> dan halaman detail produk. Daftar produk, kode, harga &amp; spesifikasi diatur di menu Produk &amp; Kategori; sidebar kategori dibuat otomatis dari menu Kategori.
              </p>

              <p className="label mt-2">Kop halaman</p>
              <TextField label="Eyebrow" value={draft.catalogPage.eyebrow} onChange={(v) => patch("catalogPage", { eyebrow: v })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Judul baris 1" value={draft.catalogPage.title} onChange={(v) => patch("catalogPage", { title: v })} />
                <TextField label="Judul aksen (orange)" value={draft.catalogPage.titleAccent} onChange={(v) => patch("catalogPage", { titleAccent: v })} />
              </div>
              <TextArea label="Paragraf" value={draft.catalogPage.body} onChange={(v) => patch("catalogPage", { body: v })} rows={4} />

              <p className="label mt-2">Sidebar kategori</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Judul sidebar" value={draft.catalogPage.sidebarTitle} onChange={(v) => patch("catalogPage", { sidebarTitle: v })} />
                <TextField label="Label 'semua' di sidebar" value={draft.catalogPage.allLabel} onChange={(v) => patch("catalogPage", { allLabel: v })} />
                <TextField label="Label 'semua' di chip mobile" value={draft.catalogPage.allLabelShort} onChange={(v) => patch("catalogPage", { allLabelShort: v })} />
                <TextField label="Tombol reset filter" value={draft.catalogPage.resetLabel} onChange={(v) => patch("catalogPage", { resetLabel: v })} />
              </div>
              <TextField label="Tombol minta rekomendasi" value={draft.catalogPage.recommendLabel} onChange={(v) => patch("catalogPage", { recommendLabel: v })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Judul kartu bantu" value={draft.catalogPage.helpTitle} onChange={(v) => patch("catalogPage", { helpTitle: v })} />
                <TextField label="Tombol WhatsApp di kartu bantu" value={draft.catalogPage.helpButton} onChange={(v) => patch("catalogPage", { helpButton: v })} />
              </div>
              <TextArea label="Isi kartu bantu" value={draft.catalogPage.helpBody} onChange={(v) => patch("catalogPage", { helpBody: v })} rows={2} />

              <p className="label mt-2">Toolbar &amp; tampilan</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Placeholder pencarian" value={draft.catalogPage.searchPlaceholder} onChange={(v) => patch("catalogPage", { searchPlaceholder: v })} />
                <TextField
                  label="Label jumlah hasil"
                  value={draft.catalogPage.resultsLabel}
                  onChange={(v) => patch("catalogPage", { resultsLabel: v })}
                  hint="Pakai {shown} dan {total} sebagai placeholder angka."
                />
                <TextField label="Label urutkan" value={draft.catalogPage.sortLabel} onChange={(v) => patch("catalogPage", { sortLabel: v })} />
                <TextField label="Produk per halaman" type="number" value={draft.catalogPage.perPage} onChange={(v) => patch("catalogPage", { perPage: v })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Opsi: Terbaru" value={draft.catalogPage.sortNewest} onChange={(v) => patch("catalogPage", { sortNewest: v })} />
                <TextField label="Opsi: Nama A-Z" value={draft.catalogPage.sortAz} onChange={(v) => patch("catalogPage", { sortAz: v })} />
                <TextField label="Opsi: Nama Z-A" value={draft.catalogPage.sortZa} onChange={(v) => patch("catalogPage", { sortZa: v })} />
                <TextField label="Opsi: Per kategori" value={draft.catalogPage.sortCategory} onChange={(v) => patch("catalogPage", { sortCategory: v })} />
                <TextField label="Tombol: Grid" value={draft.catalogPage.viewGrid} onChange={(v) => patch("catalogPage", { viewGrid: v })} />
                <TextField label="Tombol: List" value={draft.catalogPage.viewList} onChange={(v) => patch("catalogPage", { viewList: v })} />
                <TextField label="Tombol: halaman sebelumnya" value={draft.catalogPage.pagePrev} onChange={(v) => patch("catalogPage", { pagePrev: v })} />
                <TextField label="Tombol: halaman berikutnya" value={draft.catalogPage.pageNext} onChange={(v) => patch("catalogPage", { pageNext: v })} />
              </div>

              <p className="label mt-2">Kartu produk</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Label kode" value={draft.catalogPage.codeLabel} onChange={(v) => patch("catalogPage", { codeLabel: v })} />
                <TextField label="Label harga" value={draft.catalogPage.priceLabel} onChange={(v) => patch("catalogPage", { priceLabel: v })} />
                <TextField label="Tombol tanya (WA)" value={draft.catalogPage.askLabel} onChange={(v) => patch("catalogPage", { askLabel: v })} />
                <TextField label="Tautan detail" value={draft.catalogPage.detailLabel} onChange={(v) => patch("catalogPage", { detailLabel: v })} />
              </div>
              <TextField label="Harga saat kolom kosong" value={draft.catalogPage.priceFallback} onChange={(v) => patch("catalogPage", { priceFallback: v })} />
              <TextArea label="Catatan di bawah grid produk" value={draft.catalogPage.note} onChange={(v) => patch("catalogPage", { note: v })} rows={2} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Judul saat hasil kosong" value={draft.catalogPage.emptyTitle} onChange={(v) => patch("catalogPage", { emptyTitle: v })} />
                <TextArea label="Teks saat hasil kosong" value={draft.catalogPage.emptyBody} onChange={(v) => patch("catalogPage", { emptyBody: v })} rows={2} />
              </div>

              <p className="label mt-2">Halaman detail produk</p>
              <TextField label="Tautan kembali ke katalog" value={draft.catalogPage.detailBack} onChange={(v) => patch("catalogPage", { detailBack: v })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Judul blok deskripsi" value={draft.catalogPage.detailDescTitle} onChange={(v) => patch("catalogPage", { detailDescTitle: v })} />
                <TextField label="Judul blok spesifikasi" value={draft.catalogPage.detailSpecsTitle} onChange={(v) => patch("catalogPage", { detailSpecsTitle: v })} />
                <TextField label="Judul produk terkait" value={draft.catalogPage.detailRelatedTitle} onChange={(v) => patch("catalogPage", { detailRelatedTitle: v })} hint="Pisahkan dengan | untuk bagian orange." />
                <TextField label="Tombol tanya produk" value={draft.catalogPage.detailCta} onChange={(v) => patch("catalogPage", { detailCta: v })} />
              </div>
              <TextField label="Tombol konsultasi" value={draft.catalogPage.detailConsult} onChange={(v) => patch("catalogPage", { detailConsult: v })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Chip kepercayaan 1" value={draft.catalogPage.detailTrust1} onChange={(v) => patch("catalogPage", { detailTrust1: v })} />
                <TextField label="Chip kepercayaan 2" value={draft.catalogPage.detailTrust2} onChange={(v) => patch("catalogPage", { detailTrust2: v })} />
                <TextField label="Catatan ketersediaan" value={draft.catalogPage.detailStockNote} onChange={(v) => patch("catalogPage", { detailStockNote: v })} />
                <TextField label="Tautan lihat semua produk" value={draft.catalogPage.detailAllLabel} onChange={(v) => patch("catalogPage", { detailAllLabel: v })} />
              </div>

              <p className="label mt-2">Pratinjau sosial &amp; SEO</p>
              <ImageUpload label="Gambar pratinjau (OG)" value={draft.catalogPage.image} onChange={(url) => patch("catalogPage", { image: url })} />
              <TextField label="Path gambar" value={draft.catalogPage.image} onChange={(v) => patch("catalogPage", { image: v })} hint="Dipakai bila produk belum punya gambar." />
              <TextField label="Meta title" value={draft.catalogPage.seoTitle} onChange={(v) => patch("catalogPage", { seoTitle: v })} />
              <TextArea label="Meta description" value={draft.catalogPage.seoDescription} onChange={(v) => patch("catalogPage", { seoDescription: v })} />
            </>
          )}

          {tab === "contactPage" && (
            <>
              <p className="rounded-md bg-sand/70 px-4 py-3 text-[12.5px] leading-relaxed text-ink/60">
                Isi halaman <b>/kontak</b>. Nomor WhatsApp &amp; email diambil dari menu Pengaturan; pesan yang dikirim pengunjung masuk ke menu Pesan Masuk.
              </p>
              <TextField label="Eyebrow" value={draft.contactPage.eyebrow} onChange={(v) => patch("contactPage", { eyebrow: v })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Judul baris 1" value={draft.contactPage.title} onChange={(v) => patch("contactPage", { title: v })} />
                <TextField label="Judul aksen (orange)" value={draft.contactPage.titleAccent} onChange={(v) => patch("contactPage", { titleAccent: v })} />
              </div>
              <TextArea label="Paragraf" value={draft.contactPage.body} onChange={(v) => patch("contactPage", { body: v })} rows={4} />

              <p className="label mt-2">Kanal kontak (kartu di kanan hero)</p>
              <Repeater
                items={draft.contactPage.channels}
                onChange={(channels) => patch("contactPage", { channels })}
                empty={{ icon: "phone", title: "", lines: "", href: "" }}
                render={(item, set) => (
                  <div className="flex-1 space-y-3 rounded-md border border-line p-3.5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <TextField label="Judul kartu" value={item.title} onChange={(v) => set({ ...item, title: v })} />
                      <SelectField
                        label="Ikon & sumber tautan"
                        value={item.icon}
                        onChange={(v) => set({ ...item, icon: v })}
                        options={[
                          { value: "wa", label: "WhatsApp (tautan ke nomor di Pengaturan)" },
                          { value: "mail", label: "Email (tautan ke email di Pengaturan)" },
                          { value: "phone", label: "Telepon (nomor WhatsApp as tel)" },
                          { value: "clock", label: "Jam (tanpa tautan)" },
                          { value: "pin", label: "Lokasi (tanpa tautan)" },
                        ]}
                      />
                    </div>
                    <TextArea label="Isi (baris baru = baris baru di kartu)" value={item.lines} onChange={(v) => set({ ...item, lines: v })} rows={2} />
                    <TextField label="Tautan kustom (opsional)" value={item.href} onChange={(v) => set({ ...item, href: v })} hint="Kosongkan untuk memakai nomor WhatsApp/email dari Pengaturan." />
                  </div>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Judul formulir" value={draft.contactPage.formTitle} onChange={(v) => patch("contactPage", { formTitle: v })} />
                <TextField label="Teks tombol kirim" value={draft.contactPage.formSubmit} onChange={(v) => patch("contactPage", { formSubmit: v })} />
              </div>
              <TextArea label="Deskripsi formulir" value={draft.contactPage.formBody} onChange={(v) => patch("contactPage", { formBody: v })} rows={2} />
              <TextArea label="Pesan setelah terkirim" value={draft.contactPage.formSuccess} onChange={(v) => patch("contactPage", { formSuccess: v })} rows={2} />

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Judul alamat" value={draft.contactPage.addressTitle} onChange={(v) => patch("contactPage", { addressTitle: v })} />
                <TextField label="Kueri peta Google Maps" value={draft.contactPage.mapsQuery} onChange={(v) => patch("contactPage", { mapsQuery: v })} hint="Alamat lengkap atau nama tempat, dipakai untuk embed peta." />
              </div>
              <TextArea label="Alamat" value={draft.contactPage.address} onChange={(v) => patch("contactPage", { address: v })} rows={2} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Judul jam operasional" value={draft.contactPage.hoursTitle} onChange={(v) => patch("contactPage", { hoursTitle: v })} />
                <TextArea label="Jam operasional" value={draft.contactPage.hours} onChange={(v) => patch("contactPage", { hours: v })} rows={2} />
              </div>

              <TextField label="Judul FAQ" value={draft.contactPage.faqTitle} onChange={(v) => patch("contactPage", { faqTitle: v })} hint="Bagian setelah tanda | tampil orange." />
              <TextArea label="Pengantar FAQ" value={draft.contactPage.faqBody} onChange={(v) => patch("contactPage", { faqBody: v })} rows={2} />
              <p className="label mt-2">Daftar FAQ</p>
              <Repeater
                items={draft.contactPage.faqs}
                onChange={(faqs) => patch("contactPage", { faqs })}
                empty={{ q: "", a: "" }}
                render={(item, set) => (
                  <div className="flex-1 space-y-3 rounded-md border border-line p-3.5">
                    <TextField label="Pertanyaan" value={item.q} onChange={(v) => set({ ...item, q: v })} />
                    <TextArea label="Jawaban" value={item.a} onChange={(v) => set({ ...item, a: v })} rows={3} />
                  </div>
                )}
              />

              <TextField label="Meta title" value={draft.contactPage.seoTitle} onChange={(v) => patch("contactPage", { seoTitle: v })} />
              <TextArea label="Meta description" value={draft.contactPage.seoDescription} onChange={(v) => patch("contactPage", { seoDescription: v })} />
            </>
          )}

          {tab === "cta" && (
            <>
              <TextField label="Eyebrow" value={draft.cta.eyebrow} onChange={(v) => patch("cta", { eyebrow: v })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Judul baris 1" value={draft.cta.title} onChange={(v) => patch("cta", { title: v })} />
                <TextField label="Judul baris 2" value={draft.cta.titleAccent} onChange={(v) => patch("cta", { titleAccent: v })} />
              </div>
              <TextField label="Teks tombol" value={draft.cta.button} onChange={(v) => patch("cta", { button: v })} />
            </>
          )}

          {tab === "footer" && (
            <>
              <TextArea label="Tagline" value={draft.footer.tagline} onChange={(v) => patch("footer", { tagline: v })} rows={2} />
              <TextField label="Copyright" value={draft.footer.copyright} onChange={(v) => patch("footer", { copyright: v })} hint="Tahun tampil otomatis mengikuti waktu." />
              <TextField label="Teks kanan bawah" value={draft.footer.built} onChange={(v) => patch("footer", { built: v })} />
            </>
          )}

          {tab === "seo" && (
            <>
              <TextField label="Meta title" value={draft.seo.title} onChange={(v) => patch("seo", { title: v })} />
              <TextArea label="Meta description" value={draft.seo.description} onChange={(v) => patch("seo", { description: v })} />
              <ImageUpload label="Gambar Open Graph" value={draft.seo.ogImage} onChange={(url) => patch("seo", { ogImage: url })} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Repeater<T>({
  items,
  onChange,
  render,
  empty,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  render: (item: T, set: (item: T) => void, index: number) => React.ReactNode;
  empty: T;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2.5">
          {render(item, (next) => onChange(items.map((x, j) => (j === i ? next : x))), i)}
          <button
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="mt-6 rounded-md px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50"
            aria-label="Hapus item"
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, empty])} className="btn-ghost !py-1.5 !text-xs">
        + Tambah item
      </button>
    </div>
  );
}
