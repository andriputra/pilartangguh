"use client";

import { useEffect, useState } from "react";
import { PageHeader, SectionCard, TextArea, TextField, useApi, useToast } from "@/components/admin/ui";
import UserManagement from "@/components/admin/UserManagement";
import AccountPassword from "@/components/admin/AccountPassword";

const TABS = [
  { id: "contact", label: "Kontak & WhatsApp" },
  { id: "users", label: "Pengguna CMS" },
  { id: "security", label: "Keamanan akun" },
] as const;

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
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("contact");
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    api<{ key: string; value: string }[]>("/api/admin/settings")
      .then((rows) => {
        const map: Record<string, string> = {};
        for (const r of rows) map[r.key] = r.value;
        setValues(map);
      })
      .catch((e) => { setLoadError(true); toast(e.message, "error"); })
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
    <div className="w-full">
      <PageHeader
        title="Pengaturan"
        subtitle="Kelola kontak website, pengguna CMS, dan keamanan akun Anda."
        actions={tab === "contact" &&
          <button type="button" onClick={save} disabled={loading || saving || loadError} className="btn-primary !py-2 !text-xs disabled:opacity-60">
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
        }
      />
      <div role="tablist" aria-label="Bagian pengaturan" className="mb-5 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((item, index) => (
          <button key={item.id} type="button" id={`tab-${item.id}`} role="tab" aria-selected={tab === item.id} aria-controls={`panel-${item.id}`} tabIndex={tab === item.id ? 0 : -1} onClick={() => setTab(item.id)} onKeyDown={(e) => {
            const next = e.key === "ArrowRight" ? (index + 1) % TABS.length : e.key === "ArrowLeft" ? (index + TABS.length - 1) % TABS.length : e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : null;
            if (next === null) return;
            e.preventDefault();
            setTab(TABS[next].id);
            document.getElementById(`tab-${TABS[next].id}`)?.focus();
          }} className={`shrink-0 border-b-2 px-4 py-3 text-xs font-bold transition-colors ${tab === item.id ? "border-brand text-brand" : "border-transparent text-ink/50 hover:text-ink"}`}>
            {item.label}
          </button>
        ))}
      </div>
      <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
      {tab === "users" ? <UserManagement onSecurity={() => setTab("security")} /> : tab === "security" ? <AccountPassword /> : (
      <SectionCard title="Kontak & WhatsApp">
        {loading ? (
          <p className="py-4 text-center text-sm text-ink/40">Memuat…</p>
        ) : loadError ? <p role="alert" className="text-sm text-red-700">Gagal memuat pengaturan. Muat ulang halaman untuk mencoba kembali.</p> : (
          <div className="grid gap-4 md:grid-cols-2">
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
      )}
      </div>
    </div>
  );
}
