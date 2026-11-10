"use client";

import { motion } from "framer-motion";
import { WhatsAppIcon } from "./icons";

export default function WaFloat({ waUrl, label }: { waUrl: string; label: string }) {
  return (
    <motion.a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.5 }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className="fixed right-4 bottom-20 z-40 -translate-y-1/2 sm:right-6"
      aria-label={label}
    >
      <span className="flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white shadow-lift">
        <WhatsAppIcon className="h-4 w-4" />
        <span className="hidden sm:inline">{label}</span>
      </span>
    </motion.a>
  );
}
