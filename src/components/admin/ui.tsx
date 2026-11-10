"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";

/* ---------- toast ---------- */

type Toast = { id: number; message: string; type: "success" | "error" };
const ToastCtx = createContext<(message: string, type?: Toast["type"]) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-lift ${
              t.type === "success" ? "bg-ink" : "bg-red-600"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- modal ---------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-ink/50 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        className={`my-8 w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-lg bg-white shadow-lift`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 className="text-sm font-bold">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-md p-1.5 text-ink/50 hover:bg-sand hover:text-ink">
            ✕
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  busy,
}: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-ink/70">{message}</p>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-ghost !px-4 !py-2 !text-xs">
          Batal
        </button>
        <button type="button" onClick={onConfirm} disabled={busy} className="btn !bg-red-600 !px-4 !py-2 !text-xs !text-white hover:!bg-red-700 disabled:opacity-60">
          {busy ? "Menghapus…" : "Ya, hapus"}
        </button>
      </div>
    </Modal>
  );
}

/* ---------- fields ---------- */

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type={type} className="input" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {hint && <p className="mt-1 text-[11px] text-ink/40">{hint}</p>}
    </div>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea className="input resize-y" rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
      <input type="checkbox" className="peer sr-only" checked={value} onChange={(e) => onChange(e.target.checked)} />
      <span className="relative h-5 w-9 rounded-full bg-line transition-colors peer-checked:bg-brand peer-focus:ring-2 peer-focus:ring-brand/30">
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${value ? "left-[18px]" : "left-0.5"}`} />
      </span>
      {label}
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ImageUpload({
  value,
  onChange,
  label = "Gambar",
}: {
  value: string | null | undefined;
  onChange: (url: string) => void;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload gagal");
      onChange(json.url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-3">
        <div className="flex h-[84px] w-[120px] shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed border-line bg-sand/50">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="preview" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[11px] text-ink/40">Kosong</span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="btn-ghost !px-3 !py-1.5 !text-xs"
          >
            {busy ? "Mengupload…" : value ? "Ganti gambar" : "Pilih gambar"}
          </button>
          {value && (
            <button type="button" onClick={() => onChange("")} className="text-left text-[11px] text-red-600 hover:underline">
              Hapus gambar
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* ---------- misc ---------- */

export function SectionCard({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <h2 className="text-sm font-bold">{title}</h2>
        {actions}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

export function useApi() {
  return useCallback(async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(path, {
      headers: init?.body instanceof FormData ? undefined : { "Content-Type": "application/json" },
      ...init,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.error || `Request gagal (${res.status})`);
    return json as T;
  }, []);
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-xl font-extrabold">{title}</h1>
        {subtitle && <p className="mt-1 text-[13px] text-ink/50">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}
