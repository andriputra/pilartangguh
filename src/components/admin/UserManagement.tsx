"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, PasswordField, TextField, useApi, useToast } from "./ui";

type CmsUser = { id: string; name: string; email: string; role: string; createdAt: string };
type Draft = { name: string; email: string; password: string; confirmPassword: string; currentPassword: string };
const EMPTY: Draft = { name: "", email: "", password: "", confirmPassword: "", currentPassword: "" };

export default function UserManagement({ onSecurity }: { onSecurity: () => void }) {
  const api = useApi();
  const toast = useToast();
  const router = useRouter();
  const [users, setUsers] = useState<CmsUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [dialog, setDialog] = useState<{ mode: "create" | "edit" | "reset"; user?: CmsUser } | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await api<{ items: CmsUser[]; currentUserId: string }>("/api/admin/users");
      setUsers(data.items);
      setCurrentUserId(data.currentUserId);
    } catch (e) {
      setLoadError(true);
      toast(e instanceof Error ? e.message : "Gagal memuat pengguna", "error");
    } finally {
      setLoading(false);
    }
  }, [api, toast]);

  useEffect(() => { void load(); }, [load]);

  function open(mode: "create" | "edit" | "reset", user?: CmsUser) {
    setDraft({ ...EMPTY, name: user?.name || "", email: user?.email || "" });
    setError("");
    setDialog({ mode, user });
  }

  function close() {
    if (busy) return;
    setDialog(null);
    setDraft(EMPTY);
    setError("");
  }

  function patch(key: keyof Draft, value: string) {
    setDraft((s) => ({ ...s, [key]: value }));
    setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!dialog || busy) return;
    if (dialog.mode !== "edit") {
      const message = Array.from(draft.password).length < 12 ? "Password minimal 12 karakter." : new TextEncoder().encode(draft.password).length > 72 ? "Password maksimal 72 byte; kurangi karakter khusus." : draft.password !== draft.confirmPassword ? "Konfirmasi password tidak cocok." : "";
      if (message) { setError(message); toast(message, "error"); return; }
    }
    setBusy(true);
    setError("");
    try {
      const isReset = dialog.mode === "reset";
      const url = dialog.mode === "create" ? "/api/admin/users" : `/api/admin/users/${dialog.user!.id}${isReset ? "/password" : ""}`;
      const body = isReset ? { currentPassword: draft.currentPassword, password: draft.password, confirmPassword: draft.confirmPassword } : dialog.mode === "create" ? { name: draft.name, email: draft.email, password: draft.password, confirmPassword: draft.confirmPassword } : { name: draft.name, email: draft.email };
      const saved = await api<CmsUser>(url, { method: isReset ? "PUT" : dialog.mode === "create" ? "POST" : "PATCH", body: JSON.stringify(body) });
      if (!isReset) setUsers((s) => dialog.mode === "create" ? [...s, saved] : s.map((u) => u.id === saved.id ? saved : u));
      toast(isReset ? "Password direset. Sesi lama pengguna telah dikeluarkan." : dialog.mode === "create" ? "Pengguna berhasil ditambahkan" : "Pengguna berhasil diperbarui");
      setDialog(null);
      setDraft(EMPTY);
      if (dialog.user?.id === currentUserId) router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Gagal menyimpan pengguna";
      setError(message);
      toast(message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold">Pengguna CMS <span className="ml-1 rounded bg-sand px-2 py-0.5 text-xs text-ink/60">{loading ? "…" : users.length}</span></h2>
          <p className="mt-1 text-xs text-ink/60">Semua pengguna memiliki akses admin penuh. Tambahkan hanya anggota tim tepercaya.</p>
        </div>
        <button type="button" onClick={() => open("create")} disabled={loading || loadError} className="btn-primary !py-2 !text-xs disabled:opacity-60">Tambah pengguna</button>
      </div>
      <div className="overflow-hidden rounded-lg border border-line bg-white shadow-card">
        {loading ? <p className="p-6 text-center text-sm text-ink/50">Memuat pengguna…</p> : loadError ? (
          <div className="space-y-3 p-6 text-center"><p className="text-sm text-ink/60">Daftar pengguna belum dapat dimuat.</p><button type="button" onClick={() => void load()} className="btn-ghost !py-2 !text-xs">Coba lagi</button></div>
        ) : users.length === 0 ? <p className="p-6 text-sm text-ink/50">Belum ada pengguna.</p> : (
          <ul className="divide-y divide-line">
            {users.map((user) => (
              <li key={user.id} className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-5">
                <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand text-sm font-bold text-brand">{user.name.slice(0, 1).toUpperCase()}</span>
                <div className="min-w-0 flex-1 basis-40">
                  <div className="flex flex-wrap items-center gap-2"><p className="break-words text-[13px] font-bold">{user.name}</p>{user.id === currentUserId && <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand">Anda</span>}</div>
                  <p className="mt-0.5 break-all text-xs text-ink/60">{user.email}</p>
                </div>
                <div className="hidden w-36 text-xs text-ink/50 xl:block"><p className="font-semibold text-ink/70">Admin</p><p className="mt-0.5">Sejak {new Date(user.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</p></div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" aria-label={`Edit ${user.name}`} onClick={() => open("edit", user)} className="btn-ghost !px-3 !py-1.5 !text-xs">Edit</button>
                  <button type="button" aria-label={`${user.id === currentUserId ? "Ganti password" : "Reset password"} ${user.name}`} onClick={() => user.id === currentUserId ? onSecurity() : open("reset", user)} className="btn-ghost !px-3 !py-1.5 !text-xs">{user.id === currentUserId ? "Ganti password" : "Reset password"}</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-xs leading-relaxed text-ink/50">Password tidak ditampilkan kembali. Jika pengguna lupa password, tetapkan password baru melalui tombol Reset password dan sampaikan secara pribadi.</p>
      <Modal open={!!dialog} onClose={close} title={dialog?.mode === "create" ? "Tambah pengguna CMS" : dialog?.mode === "reset" ? "Reset password pengguna" : "Edit pengguna"}>
        <form onSubmit={submit} className="space-y-4">
          <fieldset disabled={busy} className="space-y-4 disabled:opacity-60">
            {dialog?.mode === "reset" ? (
              <div className="rounded-md border border-line bg-sand/50 p-3 text-xs leading-relaxed">
                <p className="font-bold">{dialog.user?.name}</p><p className="break-all text-ink/60">{dialog.user?.email}</p>
                <p className="mt-2 text-ink/70">Semua sesi pengguna ini akan dikeluarkan. Sesi akun Anda tetap aktif.</p>
              </div>
            ) : (
              <>
                <TextField label="Nama pengguna" value={draft.name} onChange={(v) => patch("name", v)} required minLength={2} maxLength={100} autoComplete="off" autoFocus />
                <TextField label="Email pengguna" type="email" value={draft.email} onChange={(v) => patch("email", v)} required maxLength={254} autoComplete="off" />
                <p className="text-xs text-ink/50">Hak akses: Admin — seluruh menu CMS.</p>
              </>
            )}
            {dialog?.mode === "reset" && <PasswordField label="Password Anda saat ini" value={draft.currentPassword} onChange={(v) => patch("currentPassword", v)} autoComplete="current-password" hint="Verifikasi identitas Anda sebelum mereset akun lain." />}
            {dialog?.mode !== "edit" && (
              <>
                <PasswordField label={dialog?.mode === "reset" ? "Password baru pengguna" : "Password awal"} value={draft.password} onChange={(v) => patch("password", v)} hint="Minimal 12 karakter, maksimal 72 byte. Gunakan password yang unik." />
                <PasswordField label="Konfirmasi password" value={draft.confirmPassword} onChange={(v) => patch("confirmPassword", v)} />
              </>
            )}
          </fieldset>
          {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-xs text-red-700">{error}</p>}
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button type="button" disabled={busy} onClick={close} className="btn-ghost !px-4 !py-2 !text-xs">Batal</button>
            <button type="submit" disabled={busy} className="btn-primary !px-4 !py-2 !text-xs disabled:opacity-60">{busy ? "Menyimpan…" : dialog?.mode === "reset" ? "Reset password" : dialog?.mode === "create" ? "Tambah pengguna" : "Simpan perubahan"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
