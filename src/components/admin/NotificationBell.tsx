"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NotificationBell() {
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

  return (
    <Link
      href="/admin/notifications"
      className={`relative flex items-center gap-3 rounded-md px-3.5 py-2.5 text-[13px] font-semibold transition-colors ${
        pathname === "/admin/notifications" ? "bg-brand text-white" : "text-ink/70 hover:bg-sand hover:text-ink"
      }`}
    >
      <span className="w-4 text-center">🔔</span>
      Notifikasi
      {unread > 0 && (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
