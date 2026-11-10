"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellIcon } from "@/components/site/icons";

export default function NotificationBell({ onNavigate }: { onNavigate?: () => void }) {
  const [unread, setUnread] = useState(0);
  const pathname = usePathname();

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications");
      if (res.ok) setUnread((await res.json()).unread);
    } catch {
      /* silent — bell is best-effort */
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 60_000);
    return () => clearInterval(t);
  }, [refresh, pathname]);

  const active = pathname === "/admin/notifications" || pathname.startsWith("/admin/notifications/");

  return (
    <Link
      href="/admin/notifications"
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand ${active ? "bg-brand text-white shadow-sm" : "text-ink/70 hover:bg-brand/5 hover:text-brand"}`}
    >
      <BellIcon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} aria-hidden="true" />
      <span>Notifikasi</span>
      {unread > 0 && (
        <span aria-label={`${unread} notifikasi belum dibaca`} className={`ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${active ? "bg-white/20 text-white" : "bg-brand/10 text-brand"}`}>
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
