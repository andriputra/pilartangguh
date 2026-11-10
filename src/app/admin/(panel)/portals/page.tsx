"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ConfirmDialog,
  ImageUpload,
  Modal,
  PageHeader,
  SectionCard,
  SelectField,
  TextArea,
  TextField,
  Toggle,
  useApi,
  useToast,
} from "@/components/admin/ui";

type Portal = {
  id: string;
  title: string;
  description: string;
  image: string | null;
  imageAlt: string | null;
  url: string | null;
  tag: string | null;
  status: string;
  number: number;
  dark: boolean;
  order: number;
  published: boolean;
  youtubeChannelId: string | null;
  _count: { videos: number };
  videos?: { id: string; title: string; url: string; publishedAt: string }[];
};

const BLANK: Omit<Portal, "id" | "_count" | "videos"> = {
  title: "",
  description: "",
  image: null,
  imageAlt: null,
  url: "",
  tag: "",
  status: "ONLINE",
  number: 1,
  dark: false,
  order: 0,
  published: true,
  youtubeChannelId: "",
};

export default function PortalsAdmin() {
  const api = useApi();
  const toast = useToast();
  const [rows, setRows] = useState<Portal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editing, setEditing] = useState<(typeof BLANK & { id?: string }) | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<Portal | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const locked = busy || uploading;

  function closeEditor() {
    if (!locked) setEditing(null);
  }

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      setRows(await api<Portal[]>("/api/admin/portals"));
    } catch (error) {
      setLoadError(true);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load().catch((e) => toast(e.message, "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  async function save() {
    if (locked) return;
    if (!editing || !editing.title.trim()) {
      toast("Judul wajib diisi", "error");
      return;
    }
    if (!Number.isSafeInteger(editing.order) || editing.order < 0 || editing.order > 2147483647) {
      toast("Urutan tampil harus berupa bilangan bulat aman mulai dari 0", "error");
      return;
    }
    if ((editing.imageAlt?.length ?? 0) > 300) {
      toast("Teks alternatif maksimal 300 karakter", "error");
      return;
    }
    setBusy(true);
    try {
      if (isNew) await api("/api/admin/portals", { method: "POST", body: JSON.stringify(editing) });
      else await api(`/api/admin/portals/${editing.id}`, { method: "PATCH", body: JSON.stringify(editing) });
      toast(isNew ? "Portal ditambahkan" : "Portal diperbarui");
      setEditing(null);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal menyimpan", "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!deleting || locked) return;
    setBusy(true);
    try {
      await api(`/api/admin/portals/${deleting.id}`, { method: "DELETE" });
      toast("Portal dihapus");
      setDeleting(null);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal menghapus", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-w-0 w-full">
      <PageHeader
        title="Portal Tautan"
        subtitle="Kartu 'Jaringan PilarTangguh' di halaman depan"
        actions={
          <button
            type="button"
            disabled={locked || loading || loadError}
            onClick={() => {
              setIsNew(true);
              const lastOrder = rows.reduce((max, portal) => Number.isSafeInteger(portal.order) ? Math.max(max, portal.order) : max, -1);
              setEditing({ ...BLANK, number: rows.length + 1, order: Math.min(lastOrder + 1, 2147483647) });
            }}
            className="btn-primary !py-2 !text-xs disabled:opacity-60"
          >
            + Tambah portal
          </button>
        }
      />

      <SectionCard title={`Portal (${rows.length})`}>
        <p className="mb-4 rounded-md border border-line bg-sand/50 px-3 py-2 text-xs leading-relaxed text-ink/60">
          <strong className="text-ink">ONLINE</strong> tampil sebagai kartu visual dengan gambar. <strong className="text-brand">SEGERA HADIR</strong> tampil sebagai baris ringkas. Urutan tampil dimulai dari 0; angka lebih kecil tampil lebih dahulu.
        </p>
        <div className="space-y-2">
          {rows.map((p) => (
            <div key={p.id} className="grid min-w-0 grid-cols-[5rem_minmax(0,1fr)] items-center gap-3 rounded-md border border-line bg-sand/20 p-3 sm:grid-cols-[7rem_minmax(0,1fr)] xl:grid-cols-[7rem_minmax(0,1fr)_auto]">
              <div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded border border-line bg-sand/50">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.imageAlt || p.title} loading="lazy" className="h-full w-full object-contain" />
                ) : (
                  <span className="px-1 text-center text-[10px] text-ink/40">Tanpa gambar</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold">
                  {String(p.number).padStart(2, "0")} · {p.title}
                  {p.dark && <span className="ml-2 rounded-sm bg-ink px-1.5 py-0.5 text-[10px] font-bold text-white">GELAP</span>}
                  {!p.published && <span className="ml-2 rounded-sm bg-sand px-1.5 py-0.5 text-[10px] font-bold text-ink/50">TERSEMBUNYI</span>}
                </p>
                <p className="mt-0.5 truncate text-xs text-ink/50">{p.description} {p.url && <span className="text-brand">· {p.url}</span>}</p>
                {p._count.videos > 0 && p.videos?.[0] && (
                  <a href={p.videos[0].url} target="_blank" rel="noopener noreferrer" className="mt-0.5 block truncate text-[11px] text-brand hover:underline">
                    🎬 {p._count.videos} video — terbaru: {p.videos[0].title}
                  </a>
                )}
              </div>
              <div className="col-span-2 flex flex-wrap items-center justify-end gap-2 xl:col-span-1">
                <span className="mr-auto text-[11px] text-ink/50 xl:mr-2">Urutan {p.order}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${p.status === "ONLINE" ? "text-emerald-600" : "text-brand"}`}>{p.status}</span>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => {
                    setIsNew(false);
                    setEditing({ ...p, image: p.image ?? null, imageAlt: p.imageAlt ?? null, url: p.url || "", tag: p.tag || "", youtubeChannelId: p.youtubeChannelId || "" });
                  }}
                  className="rounded-md px-2.5 py-1 text-xs font-bold hover:bg-sand disabled:opacity-60"
                >
                  Edit
                </button>
                <button type="button" disabled={locked} onClick={() => setDeleting(p)} className="rounded-md px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60">
                  Hapus
                </button>
              </div>
            </div>
          ))}
          {loading && <p role="status" className="py-6 text-center text-sm text-ink/50">Memuat portal…</p>}
          {loadError && <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">Portal gagal dimuat. <button type="button" onClick={() => load().catch((e) => toast(e.message, "error"))} className="font-bold underline">Coba lagi</button></div>}
          {!loading && !loadError && rows.length === 0 && <p className="py-6 text-center text-sm text-ink/40">Belum ada portal.</p>}
        </div>
      </SectionCard>

      <Modal open={Boolean(editing)} onClose={closeEditor} title={isNew ? "Tambah portal" : "Edit portal"} wide>
        {editing && (
          <fieldset disabled={busy} aria-busy={locked} className="grid min-w-0 gap-4 sm:grid-cols-2">
            <TextField label="Judul" value={editing.title} onChange={(v) => setEditing((current) => current ? { ...current, title: v } : null)} />
            <SelectField
              label="Status"
              value={editing.status}
              onChange={(v) => setEditing((current) => current ? { ...current, status: v } : null)}
              options={[
                { value: "ONLINE", label: "ONLINE (kartu visual)" },
                { value: "SEGERA HADIR", label: "SEGERA HADIR (baris ringkas)" },
              ]}
            />
            <div className="space-y-3 rounded-md border border-line bg-sand/40 p-3 sm:col-span-2">
              <ImageUpload
                label="Gambar portal"
                value={editing.image}
                alt={editing.imageAlt || "Pratinjau gambar portal"}
                fit="contain"
                disabled={busy}
                onBusyChange={setUploading}
                onChange={(image) => setEditing((current) => current ? { ...current, image: image || null } : null)}
              />
              <p className="text-[11px] leading-relaxed text-ink/50">
                Pratinjau 16:9 menampilkan gambar utuh tanpa dipotong. ONLINE tampil sebagai kartu visual; SEGERA HADIR tetap berupa baris ringkas meskipun gambar sudah diunggah.
              </p>
              <TextField
                label="Teks alternatif gambar"
                value={editing.imageAlt || ""}
                maxLength={300}
                onChange={(v) => setEditing((current) => current ? { ...current, imageAlt: v || null } : null)}
                placeholder="mis. Logo portal PilarTangguh"
                hint="Jelaskan isi gambar secara singkat untuk pembaca layar, bukan nama berkas. Maksimal 300 karakter."
              />
            </div>
            <div className="sm:col-span-2">
              <TextArea label="Deskripsi singkat" value={editing.description} onChange={(v) => setEditing((current) => current ? { ...current, description: v } : null)} rows={2} />
            </div>
            <TextField label="URL (kosongkan jika belum hadir)" value={editing.url || ""} onChange={(v) => setEditing((current) => current ? { ...current, url: v } : null)} placeholder="https://…" />
            <TextField label="Label tag (opsional)" value={editing.tag || ""} onChange={(v) => setEditing((current) => current ? { ...current, tag: v } : null)} placeholder="mis. Podcast" hint="Chip kecil di samping status pada kartu, mis. Podcast / Marketplace." />
            <div className="sm:col-span-2">
              <TextField
                label="YouTube Channel ID"
                value={editing.youtubeChannelId || ""}
                onChange={(v) => setEditing((current) => current ? { ...current, youtubeChannelId: v } : null)}
                placeholder="UCxxxxxxxxxxxxxxxx"
                hint="Isi untuk memantau video baru. Sistem mengecek RSS channel tiap 30 menit lalu mengirim notifikasi. Cari ID via youtube.com/@channel → View page source → 'channelId'."
              />
            </div>
            <TextField label="Nomor kartu" type="number" value={String(editing.number)} onChange={(v) => setEditing((current) => current ? { ...current, number: Number(v) || 1 } : null)} />
            <TextField
              label="Urutan tampil"
              type="number"
              min={0}
              max={2147483647}
              step={1}
              required
              value={Number.isNaN(editing.order) ? "" : String(editing.order)}
              onChange={(v) => setEditing((current) => current ? { ...current, order: v === "" ? NaN : Number(v) } : null)}
              hint="Mulai dari 0. Bilangan bulat saja; angka lebih kecil tampil lebih dahulu. Terpisah dari nomor kartu."
            />
            <Toggle label="Kartu gelap (hitam)" value={editing.dark} onChange={(v) => setEditing((current) => current ? { ...current, dark: v } : null)} />
            <Toggle label="Tampil di halaman" value={editing.published} onChange={(v) => setEditing((current) => current ? { ...current, published: v } : null)} />
            <div className="flex justify-end gap-2 border-t border-line pt-3 sm:col-span-2">
              <button type="button" onClick={closeEditor} disabled={locked} className="btn-ghost !py-2 !text-xs disabled:opacity-60">
                Batal
              </button>
              <button type="button" onClick={save} disabled={locked} className="btn-primary !py-2 !text-xs disabled:opacity-60">
                {busy ? "Menyimpan…" : uploading ? "Menunggu upload…" : "Simpan"}
              </button>
            </div>
          </fieldset>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Hapus portal"
        message={`Yakin menghapus "${deleting?.title}"?`}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
        busy={busy}
      />
    </div>
  );
}
