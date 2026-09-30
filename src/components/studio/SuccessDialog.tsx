"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Download, Plus, Waves, X } from "lucide-react";
import type { ProductDef, ViewSide } from "@/config/catalog";
import type { QuoteResult } from "@/lib/studio-types";

interface SuccessDialogProps {
  result: QuoteResult | null;
  product: ProductDef;
  colorName: string;
  totalPieces: number;
  onClose: () => void;
  onNewDesign: () => void;
}

const SIDES: { id: ViewSide; label: string }[] = [
  { id: "front", label: "Front preview" },
  { id: "back", label: "Back preview" },
];

export default function SuccessDialog({
  result,
  product,
  colorName,
  totalPieces,
  onClose,
  onNewDesign,
}: SuccessDialogProps) {
  return (
    <AnimatePresence>
      {result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-ink-950/70 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="grain relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-lift"
            role="dialog"
            aria-modal="true"
            aria-label="Quote request received"
          >
            <div className="relative bg-gradient-to-br from-teal-600 to-ink-800 px-6 pb-6 pt-8 text-center text-white">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/15 transition hover:bg-white/25"
              >
                <X className="h-4 w-4" />
              </button>
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white/15">
                <CheckCircle2 className="h-7 w-7 text-teal-100" />
              </span>
              <h3 className="mt-3 font-display text-2xl font-semibold">Quote request received!</h3>
              <p className="mt-1 text-sm text-teal-100/90">
                We&apos;ll reply within {result.eta}.
              </p>
            </div>

            <div className="px-6 py-5">
              <div className="rounded-2xl border border-ink-900/10 bg-sand-50 p-4 text-sm">
                <p className="flex justify-between py-1">
                  <span className="font-semibold text-ink-500">Quote #</span>
                  <span className="font-black text-ink-900">{result.quoteId}</span>
                </p>
                <p className="flex justify-between py-1">
                  <span className="font-semibold text-ink-500">Product</span>
                  <span className="font-bold text-ink-900">
                    {product.name} · {colorName}
                  </span>
                </p>
                <p className="flex justify-between py-1">
                  <span className="font-semibold text-ink-500">Total pieces</span>
                  <span className="font-bold text-ink-900">{totalPieces}</span>
                </p>
              </div>

              {Object.keys(result.previews).length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">
                    Your rendered previews
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {SIDES.filter((s) => result.previews[s.id]).map((s) => (
                      <a
                        key={s.id}
                        href={result.previews[s.id]}
                        download={`${result.quoteId}-${product.id}-${s.id}.jpg`}
                        className="group relative overflow-hidden rounded-xl border border-ink-900/10"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={result.previews[s.id]}
                          alt={s.label}
                          className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-ink-900/85 py-2 text-[11px] font-bold text-white backdrop-blur">
                          <Download className="h-3.5 w-3.5" /> {s.label}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-ink-500">
                <Waves className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-500" />
                Demo mode: submissions are validated server-side but not emailed. In production,
                your full-resolution artwork and these previews ship to
                coastalcustomtees@gmail.com.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-ink-900/15 px-4 py-2.5 text-sm font-bold text-ink-800 transition hover:bg-sand-100"
                >
                  Keep editing
                </button>
                <button
                  type="button"
                  onClick={onNewDesign}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-bold text-sand-50 transition hover:bg-ink-700"
                >
                  <Plus className="h-4 w-4" /> New design
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
