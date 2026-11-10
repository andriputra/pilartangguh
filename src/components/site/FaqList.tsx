"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronIcon } from "./icons";
import type { FaqItem } from "@/lib/content";

export default function FaqList({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white shadow-card">
      {items.map((item, i) => {
        const expanded = open === i;
        return (
          <div key={item.q}>
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setOpen(expanded ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-sand/50 sm:px-6"
            >
              <span className="flex items-start gap-3">
                <span className="mt-0.5 font-display text-[11px] font-bold tracking-widest text-brand">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[14.5px] font-bold leading-snug">{item.q}</span>
              </span>
              <motion.span
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className={`shrink-0 rounded-md p-1.5 ${expanded ? "bg-ink text-white" : "bg-sand text-ink/60"}`}
              >
                <ChevronIcon className="h-4 w-4" />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  key="body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="max-w-2xl px-5 pb-5 pl-[2.6rem] text-[13.5px] leading-relaxed text-ink/60 sm:px-6 sm:pl-[2.9rem]">
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
