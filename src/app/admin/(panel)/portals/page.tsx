"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ConfirmDialog,
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

const BLANK: Omit<Portal, "id" | "order" | "_count" | "videos"> = {
  title: "",
  description: "",
  url: "",
  tag: "",
  status: "ONLINE",
  number: 1,
  dark: false,
  published: true,
  youtubeChannelId: "",
};

export default function PortalsAdmin() {
  const api = useApi();
  const toast = useToast();
  const [rows, setRows] = useState<Portal[]>([]);
  const [editing, setEditing] = useState<(typeof BLANK & { id?: string }) | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<Portal | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => setRows(await api<Portal[]>("/api/admin/portals")), [api]);

  useEffect(() => {
    load().catch((e) => toast(e.message, "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  async function save() {
    if (!editing || !editing.title) {
      toast("Judul wajib diisi", "error");
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
    if (!deleting) return;
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
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Portal Tautan"
        subtitle="Kartu 'Jaringan PilarTangguh' di halaman depan"
        actions={
          <button
            type="button"
            onClick={() => {
              setIsNew(true);
              setEditing({ ...BLANK, number: rows.length + 1 });
            }}
            className="btn-primary !py-2 !text-xs"
          >
            + Tambah portal
          </button>
        }
      />

      <SectionCard title={`Portal (${rows.length})`}>
        <div className="space-y-2">
          {rows.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line px-4 py-3">
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
              <div className="flex items-center gap-3">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${p.status === "ONLINE" ? "text-emerald-600" : "text-brand"}`}>{p.status}</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsNew(false);
                    setEditing({ ...p, url: p.url || "", tag: p.tag || "", youtubeChannelId: p.youtubeChannelId || "" });
                  }}
                  className="rounded-md px-2.5 py-1 text-xs font-bold hover:bg-sand"
                >
                  Edit
                </button>
                <button type="button" onClick={() => setDeleting(p)} className="rounded-md px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50">
                  Hapus
                </button>
              </div>
            </div>
          ))}
          {rows.length === 0 && <p className="py-6 text-center text-sm text-ink/40">Belum ada portal.</p>}
        </div>
      </SectionCard>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={isNew ? "Tambah portal" : "Edit portal"} wide>
        {editing && (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Judul" value={editing.title} onChange={(v) => setEditing({ ...editing, title: v })} />
            <SelectField
              label="Status"
              value={editing.status}
              onChange={(v) => setEditing({ ...editing, status: v })}
              options={[
                { value: "ONLINE", label: "ONLINE (sudah bisa diakses)" },
                { value: "SEGERA HADIR", label: "SEGERA HADIR (belum ada URL)" },
              ]}
            />
            <div className="sm:col-span-2">
              <TextArea label="Deskripsi singkat" value={editing.description} onChange={(v) => setEditing({ ...editing, description: v })} rows={2} />
            </div>
            <TextField label="URL (kosongkan jika belum hadir)" value={editing.url || ""} onChange={(v) => setEditing({ ...editing, url: v })} placeholder="https://…" />
            <TextField label="Label tag (opsional)" value={editing.tag || ""} onChange={(v) => setEditing({ ...editing, tag: v })} placeholder="mis. Podcast" hint="Chip kecil di samping status pada kartu, mis. Podcast / Marketplace." />
            <div className="sm:col-span-2">
              <TextField
                label="YouTube Channel ID"
                value={editing.youtubeChannelId || ""}
                onChange={(v) => setEditing({ ...editing, youtubeChannelId: v })}
                placeholder="UCxxxxxxxxxxxxxxxx"
                hint="Isi untuk memantau video baru. Sistem mengecek RSS channel tiap 30 menit lalu mengirim notifikasi. Cari ID via youtube.com/@channel → View page source → 'channelId'."
              />
            </div>
            <TextField label="Nomor kartu" type="number" value={String(editing.number)} onChange={(v) => setEditing({ ...editing, number: Number(v) || 1 })} />
            <Toggle label="Kartu gelap (hitam)" value={editing.dark} onChange={(v) => setEditing({ ...editing, dark: v })} />
            <Toggle label="Tampil di halaman" value={editing.published} onChange={(v) => setEditing({ ...editing, published: v })} />
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost !py-2 !text-xs">
                Batal
              </button>
              <button type="button" onClick={save} disabled={busy} className="btn-primary !py-2 !text-xs disabled:opacity-60">
                {busy ? "Menyimpan…" : "Simpan"}
              </button>
            </div>
          </div>
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
