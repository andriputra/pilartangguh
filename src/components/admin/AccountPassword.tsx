"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordField, SectionCard, useApi, useToast } from "./ui";

export default function AccountPassword() {
  const api = useApi();
  const toast = useToast();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const message = Array.from(password).length < 12 ? "Password minimal 12 karakter." : new TextEncoder().encode(password).length > 72 ? "Password maksimal 72 byte; kurangi karakter khusus." : password !== confirmPassword ? "Konfirmasi password tidak cocok." : password === currentPassword ? "Password baru harus berbeda dari password saat ini." : "";
    if (message) { setError(message); toast(message, "error"); return; }
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/password", { method: "PUT", body: JSON.stringify({ currentPassword, password, confirmPassword }) });
      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
      toast("Password berhasil diubah. Silakan masuk kembali.");
      router.replace("/admin/login?passwordChanged=1");
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Gagal mengubah password";
      setError(message);
      toast(message, "error");
      setBusy(false);
    }
  }

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <SectionCard title="Ganti password akun Anda">
        <form onSubmit={submit} className="space-y-4">
          <fieldset disabled={busy} className="space-y-4 disabled:opacity-60">
            <PasswordField label="Password saat ini" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
            <div className="grid gap-4 md:grid-cols-2">
              <PasswordField label="Password baru" value={password} onChange={setPassword} hint="Minimal 12 karakter, maksimal 72 byte." />
              <PasswordField label="Konfirmasi password baru" value={confirmPassword} onChange={setConfirmPassword} />
            </div>
          </fieldset>
          {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-xs text-red-700">{error}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-xs text-ink/60">Setelah disimpan, Anda akan diminta masuk kembali.</p>
            <button type="submit" disabled={busy} className="btn-primary !py-2 !text-xs disabled:opacity-60">{busy ? "Menyimpan…" : "Simpan password baru"}</button>
          </div>
        </form>
      </SectionCard>
      <aside className="rounded-lg border border-line bg-white p-5 text-xs leading-relaxed shadow-card">
        <h2 className="mb-3 text-sm font-bold">Keamanan akun</h2>
        <ul className="space-y-3 text-ink/60">
          <li>Gunakan password unik yang tidak dipakai di layanan lain. Frasa panjang lebih mudah diingat.</li>
          <li>Perubahan password mengeluarkan seluruh sesi akun Anda, termasuk di perangkat lain.</li>
          <li>Lupa password? Minta admin lain melakukan reset dari tab Pengguna CMS.</li>
        </ul>
      </aside>
    </div>
  );
}
