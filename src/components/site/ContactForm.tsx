"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, CheckIcon } from "./icons";

const ease = [0.22, 1, 0.36, 1] as const;

type Sent = { ok: true } | { ok: false; error: string };

export default function ContactForm({
  title,
  body,
  submitLabel,
  successMessage,
}: {
  title: string;
  body: string;
  submitLabel: string;
  successMessage: string;
}) {
  const [values, setValues] = useState({ name: "", contact: "", subject: "", message: "", company: "" });
  const [state, setState] = useState<Sent | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof values) => (v: string) => setValues((s) => ({ ...s, [key]: v }));

  async function submit() {
    if (busy) return;
    if (values.name.trim().length < 2) {
      setState({ ok: false, error: "Nama minimal 2 karakter." });
      return;
    }
    if (values.contact.trim().length < 6) {
      setState({ ok: false, error: "Isi email atau nomor WhatsApp yang bisa dihubungi." });
      return;
    }
    if (values.message.trim().length < 10) {
      setState({ ok: false, error: "Ceritakan kebutuhan Anda minimal 10 karakter." });
      return;
    }
    setBusy(true);
    setState(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Pesan belum terkirim, coba lagi.");
      setState({ ok: true });
      setValues({ name: "", contact: "", subject: "", message: "", company: "" });
    } catch (e) {
      setState({ ok: false, error: e instanceof Error ? e.message : "Pesan belum terkirim." });
    } finally {
      setBusy(false);
    }
  }

  if (state?.ok) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease }}
        className="flex h-full flex-col items-start justify-center rounded-lg border border-line bg-white p-7 shadow-card sm:p-9"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white">
          <CheckIcon className="h-6 w-6" />
        </span>
        <h2 className="mt-6 font-display text-2xl font-extrabold leading-tight">Pesan terkirim</h2>
        <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-ink/60">{successMessage}</p>
        <button type="button" onClick={() => setState(null)} className="btn-ghost mt-7 !py-2.5 !text-xs">
          Kirim pesan lain
        </button>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="rounded-lg border border-line bg-white p-6 shadow-card sm:p-8"
    >
      <h2 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">{title}</h2>
      <p className="mt-2 text-[13.5px] leading-relaxed text-ink/55">{body}</p>

      <div className="mt-6 space-y-4">
        <Field label="Nama" required>
          <input
            className="input"
            value={values.name}
            onChange={(e) => set("name")(e.target.value)}
            placeholder="Nama Anda atau nama perusahaan"
            maxLength={120}
          />
        </Field>

        <Field label="Email atau nomor WhatsApp" required>
          <input
            className="input"
            value={values.contact}
            onChange={(e) => set("contact")(e.target.value)}
            placeholder="mis. 0812-3456-7890 / nama@perusahaan.co.id"
            maxLength={120}
          />
        </Field>

        <Field label="Subjek" hint="Opsional, ringkas kebutuhan Anda.">
          <input
            className="input"
            value={values.subject}
            onChange={(e) => set("subject")(e.target.value)}
            placeholder="mis. Pengadaan sepatu safety 30 personil"
            maxLength={140}
          />
        </Field>

        <Field label="Pesan" required>
          <textarea
            className="input resize-y"
            rows={5}
            value={values.message}
            onChange={(e) => set("message")(e.target.value)}
            placeholder="Jenis pekerjaan, jumlah personil, lokasi, dan tenggat kebutuhan."
            maxLength={2000}
          />
          <p className="mt-1.5 text-right text-[11px] text-ink/35">{values.message.length}/2000</p>
        </Field>

        {/* honeypot anti-bot: harus tetap kosong */}
        <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="pt-company">Jangan diisi</label>
          <input id="pt-company" tabIndex={-1} autoComplete="off" value={values.company} onChange={(e) => set("company")(e.target.value)} />
        </div>

        {state && !state.ok && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700"
          >
            {state.error}
          </motion.p>
        )}

        <button type="submit" disabled={busy} className="btn-primary w-full justify-center disabled:opacity-60">
          {busy ? "Mengirim…" : submitLabel}
          {!busy && <ArrowUpRight className="h-4 w-4" />}
        </button>
        <p className="text-[11.5px] leading-relaxed text-ink/40">
          Pesan Anda masuk ke CMS PilarTangguh dan dibalas lewat kontak yang Anda tuliskan.
        </p>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label">
        {label}
        {required && <span className="ml-1 text-brand">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink/40">{hint}</span>}
    </label>
  );
}
