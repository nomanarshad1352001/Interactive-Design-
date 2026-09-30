"use client";

import { motion } from "framer-motion";
import {
  Box,
  Layers,
  Move3d,
  PaintBucket,
  ShieldCheck,
  Shirt,
  Type,
  UploadCloud,
  Zap,
} from "lucide-react";
import { HERO_OCEAN } from "@/config/catalog";

const FEATURES = [
  { icon: Box, label: "Live 2D + 3D preview" },
  { icon: Shirt, label: "4 garment types" },
  { icon: PaintBucket, label: "16 garment colors" },
  { icon: UploadCloud, label: "Full-res artwork kept" },
  { icon: Type, label: "14 design fonts" },
  { icon: Move3d, label: "Drag · resize · rotate" },
  { icon: Layers, label: "Front & back views" },
  { icon: Zap, label: "Real-time preview" },
  { icon: ShieldCheck, label: "Free quotes" },
];

export default function HeroStrip() {
  return (
    <section className="relative overflow-hidden bg-ink-900 text-sand-50">
      {/* ocean backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: `url(${HERO_OCEAN})` }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-ink-950/90 via-ink-900/80 to-teal-700/60"
      />
      <div aria-hidden className="grain absolute inset-0" />

      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-14 sm:px-6 sm:pb-16 sm:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-teal-200 backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-coral-400" />
            Interactive Design Studio
          </p>
          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Design your custom apparel,{" "}
            <span className="italic text-teal-300">see it instantly.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-sand-100/85 sm:text-lg">
            Upload your artwork, add text and pick garment colors — your design appears on
            realistic product mockups in real time. Submit for a free quote. No payment needed.
          </p>
          <p className="mt-3 max-w-2xl text-sm text-sand-100/60">
            Your original files are preserved at full resolution and sent with your quote — ready
            for DTF printing.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#studio"
              className="rounded-full bg-coral-500 px-7 py-3 text-sm font-bold text-white shadow-lift transition hover:bg-coral-600"
            >
              Start Designing
            </a>
            <a
              href="#quote"
              className="rounded-full border border-white/25 bg-white/10 px-7 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
            >
              Get a Free Quote
            </a>
          </div>
        </motion.div>

        {/* feature ticker */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-12 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur"
        >
          <div className="flex w-max animate-marquee items-center gap-2 px-3 py-2.5 [--tw-animate-duration:26s]">
            {[...FEATURES, ...FEATURES].map((f, i) => (
              <span
                key={`${f.label}-${i}`}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold text-sand-100/90"
              >
                <f.icon className="h-3.5 w-3.5 text-teal-300" />
                {f.label}
                <span className="ml-2 h-1 w-1 rounded-full bg-white/25" />
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
