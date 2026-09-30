"use client";

import { useMemo, useState } from "react";
import {
  BadgeDollarSign,
  FileCheck2,
  Loader2,
  Minus,
  Plus,
  Send,
} from "lucide-react";
import {
  estimateRange,
  money,
  type ProductDef,
  type ViewSide,
} from "@/config/catalog";
import { compositePreview, processMockup, renderDesignPNG } from "@/lib/imaging";
import type {
  ArtworkFile,
  CustomerInfo,
  ProductDesign,
  QuoteResult,
  SizeMap,
} from "@/lib/studio-types";
import SuccessDialog from "./SuccessDialog";

interface QuotePanelProps {
  product: ProductDef;
  colorName: string;
  colorHex: string;
  sizes: SizeMap;
  onSizeChange: (label: string, value: number) => void;
  designs: ProductDesign;
  artworks: ArtworkFile[];
  blend: boolean;
  /** Rendered between "Sizes & Quantities" and "Request a Quote". */
  middleSlot?: React.ReactNode;
  onNewDesign: () => void;
}

const EMPTY_CUSTOMER: CustomerInfo = {
  name: "",
  email: "",
  phone: "",
  org: "",
  neededBy: "",
  notes: "",
};

function Field({
  label,
  required,
  children,
  error,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-ink-800">
        {label} {required && <span className="text-coral-500">*</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-[11px] font-semibold text-coral-600">{error}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-ink-900/15 bg-white px-3.5 py-2.5 text-sm font-medium text-ink-900 placeholder:text-ink-500/40 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25";

export default function QuotePanel({
  product,
  colorName,
  colorHex,
  sizes,
  onSizeChange,
  designs,
  artworks,
  blend,
  middleSlot,
  onNewDesign,
}: QuotePanelProps) {
  const [customer, setCustomer] = useState<CustomerInfo>(EMPTY_CUSTOMER);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<"idle" | "render" | "send">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<QuoteResult | null>(null);

  const totalPieces = useMemo(
    () => product.sizes.reduce((acc, s) => acc + (sizes[s] ?? 0), 0),
    [product, sizes],
  );

  /** Every distinct print location in use, with its per-piece surcharge. */
  const usedPlacements = useMemo(() => {
    const out: { side: ViewSide; id: string; name: string; surcharge: number; count: number }[] = [];
    (["front", "back"] as ViewSide[]).forEach((side) => {
      product.placements[side].forEach((p) => {
        const count = designs[side].filter((el) => el.placement === p.id).length;
        if (count > 0) out.push({ side, id: p.id, name: p.name, surcharge: p.surcharge, count });
      });
    });
    return out;
  }, [designs, product]);

  const placementSurcharge = usedPlacements.reduce((acc, p) => acc + p.surcharge, 0);
  const [baseLow, baseHigh] = estimateRange(product.basePrice, totalPieces);
  const estLow = baseLow > 0 ? baseLow + placementSurcharge : 0;
  const estHigh = baseHigh > 0 ? baseHigh + placementSurcharge : 0;
  const designCount = designs.front.length + designs.back.length;

  const set = (key: keyof CustomerInfo) => (v: string) =>
    setCustomer((c) => ({ ...c, [key]: v }));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!customer.name.trim()) e.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim()))
      e.email = "Please enter a valid email.";
    if (totalPieces < 1) e.sizes = "Enter a quantity for at least one size.";
    if (designCount < 1) e.design = "Add artwork or text before requesting a quote.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    setSubmitError(null);
    if (!validate()) return;
    setBusy("render");
    try {
      const previews: Partial<Record<ViewSide, string>> = {};
      for (const side of ["front", "back"] as ViewSide[]) {
        if (designs[side].length === 0) continue;
        const designPng = await renderDesignPNG(designs[side]);
        const processed = await processMockup(product.images[side], product.knockouts?.[side]);
        previews[side] = await compositePreview(processed, colorHex, designPng, blend);
      }

      setBusy("send");
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          product: { id: product.id, name: product.name },
          color: colorName,
          sizes: Object.fromEntries(
            product.sizes.filter((s) => (sizes[s] ?? 0) > 0).map((s) => [s, sizes[s]]),
          ),
          totalPieces,
          blend,
          placements: usedPlacements.map((p) => ({
            side: p.side,
            location: p.name,
            items: p.count,
            surcharge: p.surcharge,
          })),
          design: {
            frontElements: designs.front.length,
            backElements: designs.back.length,
          },
          artwork: artworks.map((a) => ({
            name: a.name,
            width: a.width,
            height: a.height,
            sizeKB: a.sizeKB,
          })),
          previews,
        }),
      });
      const data = (await res.json()) as { ok: boolean; quoteId?: string; eta?: string; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || "Something went wrong.");
      setResult({ quoteId: data.quoteId!, eta: data.eta ?? "1–2 business days", previews });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy("idle");
    }
  };

  return (
    <div className="space-y-2" id="quote">
      {/* 1 ── SIZES & QUANTITIES */}
      <section className="rounded-2xl border border-ink-900/10 bg-white p-3 shadow-sm">
        <header className="mb-3 flex items-center gap-2.5">
          <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-teal-500/10 text-teal-600">
            <BadgeDollarSign className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-ink-900 text-[9px] font-black text-sand-50">
              1
            </span>
          </span>
          <h3 className="text-[13px] font-bold tracking-tight text-ink-900">Sizes &amp; Quantities</h3>
        </header>

        <div className={`grid gap-2 ${product.sizes.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {product.sizes.map((s) => {
            const qty = sizes[s] ?? 0;
            return (
              <div
                key={s}
                className={`flex items-center justify-between rounded-xl border px-2 py-1.5 transition ${
                  qty > 0 ? "border-teal-500 bg-teal-500/5" : "border-ink-900/10 bg-sand-50"
                }`}
              >
                <span className="pl-1 text-xs font-black text-ink-800">{s}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Decrease ${s}`}
                    onClick={() => onSizeChange(s, Math.max(0, qty - 1))}
                    className="grid h-7 w-7 place-items-center rounded-lg text-ink-600 transition hover:bg-ink-900/10"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={999}
                    value={qty}
                    onChange={(e) =>
                      onSizeChange(
                        s,
                        Math.min(999, Math.max(0, parseInt(e.target.value || "0", 10) || 0)),
                      )
                    }
                    className="w-10 rounded-md bg-transparent text-center text-sm font-bold text-ink-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label={`Increase ${s}`}
                    onClick={() => onSizeChange(s, Math.min(999, qty + 1))}
                    className="grid h-7 w-7 place-items-center rounded-lg text-ink-600 transition hover:bg-ink-900/10"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {errors.sizes && (
          <p className="mt-2 text-[11px] font-semibold text-coral-600">{errors.sizes}</p>
        )}

        <div className="mt-3 flex items-center justify-between rounded-xl bg-ink-900 px-4 py-3 text-sand-50">
          <span className="text-xs font-bold uppercase tracking-wider text-sand-100/70">
            Total pieces
          </span>
          <span className="font-display text-xl font-semibold">{totalPieces}</span>
        </div>

        {usedPlacements.length > 0 && (
          <div className="mt-3 rounded-xl border border-ink-900/10 bg-sand-50 p-2.5">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">
              Print locations
            </p>
            <ul className="space-y-1">
              {usedPlacements.map((p) => (
                <li
                  key={`${p.side}-${p.id}`}
                  className="flex items-center gap-2 text-[11px] font-semibold text-ink-700"
                >
                  <span className="rounded-full bg-ink-900/8 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-ink-600">
                    {p.side}
                  </span>
                  <span className="truncate">{p.name}</span>
                  <span className="ml-auto shrink-0 text-teal-600">
                    {p.surcharge > 0 ? `+${money(p.surcharge)}/pc` : "included"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {totalPieces > 0 && (
          <p className="mt-2 text-center text-xs font-semibold text-ink-500">
            Ballpark{" "}
            <span className="text-teal-600">
              {money(estLow)}–{money(estHigh)}/pc
            </span>{" "}
            · final price confirmed in your quote
          </p>
        )}
      </section>

      {/* 2 ── LAYERS & ADJUST (injected by the studio) */}
      {middleSlot}

      {/* artwork summary */}
      <section className="rounded-2xl border border-ink-900/10 bg-white p-3 shadow-sm">
        <header className="mb-2 flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-500/10 text-teal-600">
            <FileCheck2 className="h-4 w-4" />
          </span>
          <h3 className="text-[13px] font-bold tracking-tight text-ink-900">Artwork Files</h3>
        </header>
        {artworks.length === 0 ? (
          <p className="text-xs leading-relaxed text-ink-500">
            No uploads yet. Design-only text quotes are welcome too.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {artworks.map((a) => (
              <li key={a.id} className="flex items-center gap-2 text-xs text-ink-700">
                <FileCheck2 className="h-3.5 w-3.5 shrink-0 text-teal-500" />
                <span className="truncate font-semibold">{a.name}</span>
                <span className="ml-auto shrink-0 text-[10px] font-bold uppercase tracking-wide text-teal-600">
                  full-res kept
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 3 ── REQUEST A QUOTE */}
      <section className="rounded-2xl border border-ink-900/10 bg-white p-3 shadow-sm">
        <header className="mb-3 flex items-center gap-2.5">
          <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-coral-500/10 text-coral-600">
            <Send className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-ink-900 text-[9px] font-black text-sand-50">
              3
            </span>
          </span>
          <h3 className="text-[13px] font-bold tracking-tight text-ink-900">Request a Quote</h3>
        </header>
        <div className="space-y-3">
          <Field label="Full Name" required error={errors.name}>
            <input
              type="text"
              value={customer.name}
              onChange={(e) => set("name")(e.target.value)}
              placeholder="Jane Smith"
              className={inputCls}
              autoComplete="name"
            />
          </Field>
          <Field label="Email Address" required error={errors.email}>
            <input
              type="email"
              value={customer.email}
              onChange={(e) => set("email")(e.target.value)}
              placeholder="jane@example.com"
              className={inputCls}
              autoComplete="email"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <input
                type="tel"
                value={customer.phone}
                onChange={(e) => set("phone")(e.target.value)}
                placeholder="(843) 555-0100"
                className={inputCls}
                autoComplete="tel"
              />
            </Field>
            <Field label="Needed by">
              <input
                type="date"
                value={customer.neededBy}
                onChange={(e) => set("neededBy")(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Business / Organization">
            <input
              type="text"
              value={customer.org}
              onChange={(e) => set("org")(e.target.value)}
              placeholder="Optional"
              className={inputCls}
              autoComplete="organization"
            />
          </Field>
          <Field label="Additional notes">
            <textarea
              value={customer.notes}
              onChange={(e) => set("notes")(e.target.value)}
              placeholder="Any special requests, colors, or details…"
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </Field>
        </div>

        {errors.design && (
          <p className="mt-3 rounded-xl bg-coral-500/10 px-3 py-2 text-xs font-semibold text-coral-600">
            {errors.design}
          </p>
        )}
        {submitError && (
          <p className="mt-3 rounded-xl bg-coral-500/10 px-3 py-2 text-xs font-semibold text-coral-600">
            {submitError}
          </p>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={busy !== "idle"}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-coral-500 px-5 py-3.5 text-sm font-bold text-white shadow-card transition hover:bg-coral-600 disabled:cursor-wait disabled:opacity-70"
        >
          {busy === "idle" ? (
            <>
              <Send className="h-4 w-4" /> Submit Design for Quote
            </>
          ) : (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {busy === "render" ? "Rendering previews…" : "Sending…"}
            </>
          )}
        </button>
        <p className="mt-2.5 text-center text-[11px] leading-relaxed text-ink-500">
          Your design previews and original artwork files will be attached. We&apos;ll respond
          within 1–2 business days.
        </p>
      </section>

      <SuccessDialog
        result={result}
        product={product}
        colorName={colorName}
        totalPieces={totalPieces}
        onClose={() => setResult(null)}
        onNewDesign={() => {
          setResult(null);
          onNewDesign();
        }}
      />
    </div>
  );
}
