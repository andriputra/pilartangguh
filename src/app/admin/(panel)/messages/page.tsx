"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog, PageHeader, SectionCard, useApi, useToast } from "@/components/admin/ui";

type Message = {
  id: string;
  name: string;
  contact: string;
  subject: string | null;
  message: string;
  read: boolean;
  createdAt: string;
};

export default function MessagesAdmin() {
  const api = useApi();
  const toast = useToast();
  const [items, setItems] = useState<Message[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<Message | null>(null);

  const load = useCallback(async () => {
    const data = await api<{ items: Message[] }>("/api/admin/messages");
    setItems(data.items);
    setSelected((cur) => cur ?? data.items[0]?.id ?? null);
    setLoading(false);
  }, [api]);

  useEffect(() => {
    load().catch((e) => toast(e.message, "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const shown = useMemo(() => (filter === "unread" ? items.filter((m) => !m.read) : items), [filter, items]);
  const current = items.find((m) => m.id === selected) || null;
  const unreadCount = items.filter((m) => !m.read).length;

  async function markRead(id: string, read: boolean) {
    try {
      await api(`/api/admin/messages/${id}`, { method: "PATCH", body: JSON.stringify({ read }) });
      toast(read ? "Ditandai terbaca" : "Ditandai belum terbaca");
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal", "error");
    }
  }

  async function markAllRead() {
    setBusy(true);
    try {
      await api("/api/admin/messages", { method: "PATCH", body: JSON.stringify({ all: true, read: true }) });
      toast("Semua pesan ditandai terbaca");
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal", "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/api/admin/messages/${deleting.id}`, { method: "DELETE" });
      toast("Pesan dihapus");
      if (selected === deleting.id) setSelected(null);
      setDeleting(null);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal menghapus", "error");
    } finally {
      setBusy(false);
    }
  }

  function replyHref(m: Message) {
    return m.contact.includes("@")
      ? `mailto:${m.contact}?subject=${encodeURIComponent(`Re: ${m.subject || "PilarTangguh"}`)}`
      : `https://wa.me/${m.contact.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Halo ${m.name}, terima kasih sudah menghubungi PilarTangguh.`)}`;
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Pesan Masuk"
        subtitle="Isian formulir dari halaman Kontak pilartangguh.co.id"
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFilter(filter === "unread" ? "all" : "unread")}
              className="btn-ghost !py-2 !text-xs"
            >
              {filter === "unread" ? "Tampilkan semua" : `Belum dibaca (${unreadCount})`}
            </button>
            <button type="button" onClick={markAllRead} disabled={busy || unreadCount === 0} className="btn-primary !py-2 !text-xs disabled:opacity-60">
              Tandai semua terbaca
            </button>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr] lg:items-start">
        <SectionCard title={`Daftar pesan (${shown.length})`}>
          {loading ? (
            <p className="py-4 text-center text-sm text-ink/40">Memuat…</p>
          ) : shown.length === 0 ? (
            <p className="py-4 text-center text-sm text-ink/40">
              {filter === "unread" ? "Tidak ada pesan belum dibaca." : "Belum ada pesan masuk. Pengunjung bisa mengirim lewat halaman /kontak."}
            </p>
          ) : (
            <ul className="max-h-[26rem] divide-y divide-line overflow-y-auto">
              {shown.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(m.id)}
                    className={`flex w-full items-start gap-3 px-1 py-3 text-left transition-colors hover:bg-sand/60 ${
                      selected === m.id ? "bg-sand/80" : ""
                    }`}
                  >
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${m.read ? "bg-line" : "bg-brand"}`} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={`truncate text-[13px] ${m.read ? "font-medium text-ink/60" : "font-bold"}`}>{m.name}</span>
                        <span className="shrink-0 text-[11px] text-ink/40">{new Date(m.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] text-ink/50">{m.subject || m.contact}</span>
                      <span className="mt-0.5 block truncate text-[11.5px] text-ink/40">{m.message}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <div className="lg:sticky lg:top-6">
          <SectionCard title={current ? "Detail pesan" : "Pilih pesan"}>
            {!current ? (
              <p className="py-6 text-center text-sm text-ink/40">Belum ada pesan dipilih.</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="label">Dari</p>
                  <p className="text-sm font-bold">{current.name}</p>
                  <p className="mt-0.5 break-all text-[13px] text-ink/60">{current.contact}</p>
                </div>
                {current.subject && (
                  <div>
                    <p className="label">Subjek</p>
                    <p className="text-[13px] font-semibold">{current.subject}</p>
                  </div>
                )}
                <div>
                  <p className="label">Pesan</p>
                  <p className="whitespace-pre-line rounded-md bg-sand/60 p-3.5 text-[13px] leading-relaxed">{current.message}</p>
                </div>
                <div>
                  <p className="label">Masuk</p>
                  <p className="text-[12px] text-ink/50">{new Date(current.createdAt).toLocaleString("id-ID")}</p>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-line pt-4">
                  <a href={replyHref(current)} target="_blank" rel="noopener noreferrer" className="btn-primary !py-2 !text-xs">
                    Balas via {current.contact.includes("@") ? "email" : "WhatsApp"}
                  </a>
                  <button type="button" onClick={() => markRead(current.id, !current.read)} className="btn-ghost !py-2 !text-xs">
                    {current.read ? "Tandai belum dibaca" : "Tandai terbaca"}
                  </button>
                  <button type="button" onClick={() => setDeleting(current)} className="btn !py-2 !text-xs !text-red-600 hover:bg-red-50">
                    Hapus
                  </button>
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Hapus pesan"
        message={`Yakin menghapus pesan dari "${deleting?.name}"? Isi pesan akan hilang permanen.`}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
        busy={busy}
      />
    </div>
  );
}
