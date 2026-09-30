"use client";

/** Shared collapsible card + slider used by every studio column. */

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, type LucideIcon } from "lucide-react";

export function Section({
  id,
  title,
  note,
  step,
  icon: Icon,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  note?: string;
  step?: number;
  icon: LucideIcon;
  open: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-ink-900/10 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-sand-50"
      >
        <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-teal-500/10 text-teal-600">
          <Icon className="h-4 w-4" />
          {step !== undefined && (
            <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-ink-900 text-[9px] font-black text-sand-50">
              {step}
            </span>
          )}
        </span>
        <h3 className="text-[13px] font-bold tracking-tight text-ink-900">{title}</h3>
        {note && (
          <span className="ml-auto max-w-[45%] truncate pl-2 text-[10px] font-semibold uppercase tracking-wider text-ink-500/70">
            {note}
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-ink-500 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          } ${note ? "" : "ml-auto"}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-ink-900/5 p-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export function SliderRow({
  label,
  icon: Icon,
  value,
  min,
  max,
  format,
  onChange,
}: {
  label: string;
  icon?: LucideIcon;
  value: number;
  min: number;
  max: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-ink-500">
        <span className="inline-flex items-center gap-1">
          {Icon && <Icon className="h-3 w-3" />}
          {label}
        </span>
        <b className="text-ink-800">{format(value)}</b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-teal-600"
      />
    </label>
  );
}
