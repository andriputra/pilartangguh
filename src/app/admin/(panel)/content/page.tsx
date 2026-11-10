"use client";

import { useEffect, useState } from "react";
import { DEFAULT_CONTENT, SECTION_KEYS, type SectionData, type SectionKey } from "@/lib/content";
import { ImageUpload, PageHeader, SelectField, TextArea, TextField, Toggle, useApi, useToast } from "@/components/admin/ui";

const TABS: { key: SectionKey; label: string }[] = [
  { key: "hero", label: "Hero" },
  { key: "stats", label: "Statistik" },
  { key: "marquee", label: "Ticker" },
  { key: "about", label: "Profil" },
  { key: "catalog", label: "Katalog" },
  { key: "network", label: "Portal" },
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
        subtitle="Edit teks, gambar, dan kartu pada halaman depan pilartangguh.co.id"
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
