"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader, SectionCard, useApi, useToast } from "@/components/admin/ui";

type Note = { id: string; type: string; message: string; link: string | null; read: boolean; createdAt: string };

export default function NotificationsPage() {
  const api = useApi();
  const toast = useToast();
  const [items, setItems] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [log, setLog] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await api<{ items: Note[] }>("/api/admin/notifications");
    setItems(data.items);
    setLoading(false);
  }, [api]);

  useEffect(() => {
    load().catch((e) => toast(e.message, "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  async function markRead() {
    try {
      await api("/api/admin/notifications", { method: "PUT" });
      toast("Semua notifikasi ditandai terbaca");
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal", "error");
    }
  }

  async function pollNow() {
    setPolling(true);
    setLog(null);
    try {
      const res = await api<{ ok: boolean; log: string }>("/api/admin/videos/poll", { method: "POST" });
      setLog(res.log || "Selesai — tidak ada keluaran.");
      toast("Cek YouTube selesai");
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Polling gagal", "error");
    } finally {
      setPolling(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Notifikasi"
        subtitle="Video baru dari channel YouTube yang dipantau"
        actions={
          <div className="flex gap-2">
            <button type="button" onClick={markRead} className="btn-ghost !py-2 !text-xs">
              Tandai terbaca
            </button>
            <button type="button" onClick={pollNow} disabled={polling} className="btn-primary !py-2 !text-xs disabled:opacity-60">
              {polling ? "Mengecek…" : "Cek YouTube sekarang"}
            </button>
          </div>
        }
      />

      {log && (
        <pre className="mb-4 max-h-40 overflow-auto rounded-md bg-ink px-4 py-3 text-[11px] leading-relaxed text-white/80">{log}</pre>
      )}

      <SectionCard title={`Daftar notifikasi (${items.length})`}>
        {loading ? (
          <p className="py-4 text-center text-sm text-ink/40">Memuat…</p>
        ) : items.length === 0 ? (
          <p className="py-4 text-center text-sm text-ink/40">
            Belum ada notifikasi. Isi <b>YouTube Channel ID</b> di menu Portal Tautan, lalu klik &quot;Cek YouTube sekarang&quot; atau tunggu cron tiap 30 menit.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((n) => (
              <li key={n.id} className={`flex items-start gap-3 py-3 ${n.read ? "opacity-60" : ""}`}>
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-line" : "bg-brand"}`} />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold leading-snug">{n.message}</p>
                  <p className="mt-0.5 text-[11px] text-ink/40">{new Date(n.createdAt).toLocaleString("id-ID")}</p>
                </div>
                {n.link && (
                  <a href={n.link} target={n.link.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="ml-auto shrink-0 text-xs font-bold text-brand hover:underline">
                    {n.link.startsWith("http") ? "Tonton ↗" : "Buka ↗"}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
