"use client";

import { useEffect, useState } from "react";
import { PageHeader, SectionCard, TextArea, TextField, useApi, useToast } from "@/components/admin/ui";

const FIELDS = [
  { key: "whatsapp_number", label: "Nomor WhatsApp (format 62…)", hint: "Dipakai untuk semua tombol WA, chat bubble, dan link katalog." },
  { key: "contact_email", label: "Teks kontak footer", hint: "Tampil di kolom Kontak pada footer, mis. pilartangguh.co.id" },
];

export default function SettingsAdmin() {
  const api = useApi();
  const toast = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<any[]>("/api/admin/settings")
      .then((rows) => {
        const map: Record<string, string> = {};
        for (const r of rows) map[r.key] = r.value;
        setValues(map);
      })
      .catch((e) => toast(e.message, "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setSaving(true);
    try {
      await api("/api/admin/settings", { method: "PUT", body: JSON.stringify({ values }) });
      toast("Pengaturan tersimpan");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal menyimpan", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Pengaturan"
        subtitle="Kontak & WhatsApp untuk seluruh tombol di website"
        actions={
          <button type="button" onClick={save} disabled={loading || saving} className="btn-primary !py-2 !text-xs disabled:opacity-60">
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
        }
      />
      <SectionCard title="Kontak">
        {loading ? (
          <p className="py-4 text-center text-sm text-ink/40">Memuat…</p>
        ) : (
          <div className="space-y-4">
            {FIELDS.map((f) => (
              <TextField
                key={f.key}
                label={f.label}
                hint={f.hint}
                value={values[f.key] || ""}
                onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))}
              />
            ))}
            <TextArea
              label="Pesan default WhatsApp"
              value={values.whatsapp_message || ""}
              onChange={(v) => setValues((s) => ({ ...s, whatsapp_message: v }))}
              rows={3}
            />
            <TextField
              label="Label chat bubble"
              hint="Teks pada tombol hijau mengambang."
              value={values.chat_label || ""}
              onChange={(v) => setValues((s) => ({ ...s, chat_label: v }))}
            />
          </div>
        )}
      </SectionCard>
    </div>
  );
}
