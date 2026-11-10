"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Login gagal");
      router.push(params.get("next") || "/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm rounded-lg border border-line bg-white p-6 shadow-lift">
      <div className="flex items-center gap-2.5">
        <Image src="/images/logo-mark.png" alt="Logo" width={36} height={36} className="rounded-full" />
        <p className="font-display text-base font-extrabold">
          PILAR<span className="text-brand">TANGGUH</span>
          <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/40">CMS Admin</span>
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label className="label">Email</label>
          <input type="email" required autoComplete="username" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@pilartangguh.co.id" />
        </div>
        <div>
          <label className="label">Password</label>
          <input type="password" required autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full justify-center disabled:opacity-60">
          {busy ? "Memproses…" : "Masuk"}
        </button>
      </div>
      <p className="mt-5 text-center text-[11px] text-ink/40">developed by Flexbox Indonesia</p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
