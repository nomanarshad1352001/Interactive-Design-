"use client";

/** RIGHT COLUMN (middle) — Layers & Adjust for the current garment side. */

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Crosshair,
  Eraser,
  FlipHorizontal,
  FlipVertical,
  Layers3,
  Maximize2,
  RotateCcw,
  RotateCw,
  SunMedium,
  Trash2,
  Type as TypeIcon,
  WandSparkles,
} from "lucide-react";
import type { ViewSide } from "@/config/catalog";
import type { DesignElement } from "@/lib/studio-types";
import { Section, SliderRow } from "./panel-ui";

export interface LayersPanelProps {
  elements: DesignElement[];
  view: ViewSide;
  selectedId: string | null;
  selected: DesignElement | null;
  onSelectElement: (id: string | null) => void;
  onUpdateSelected: (patch: Partial<DesignElement>) => void;
  onDeleteSelected: () => void;
  onDeleteElement: (id: string) => void;
  onDuplicateSelected: () => void;
  onFlipSelected: (axis: "x" | "y") => void;
  onResetSelected: () => void;
  onLayerMove: (id: string, dir: 1 | -1) => void;
  onCenterSelected: () => void;
  onFitSelected: () => void;
  onRemoveWhiteBackground: () => void;
  blend: boolean;
  onBlendChange: (v: boolean) => void;
  onClearView: () => void;
}

export default function LayersPanel({
  elements,
  view,
  selectedId,
  selected,
  onSelectElement,
  onUpdateSelected,
  onDeleteSelected,
  onDeleteElement,
  onDuplicateSelected,
  onFlipSelected,
  onResetSelected,
  onLayerMove,
  onCenterSelected,
  onFitSelected,
  onRemoveWhiteBackground,
  blend,
  onBlendChange,
  onClearView,
}: LayersPanelProps) {
  const [open, setOpen] = useState(true);

  return (
    <Section
      id="layers"
      step={2}
      title="Layers & Adjust"
      icon={Layers3}
      note={`${view} · ${elements.length} item${elements.length === 1 ? "" : "s"}`}
      open={open}
      onToggle={() => setOpen((v) => !v)}
    >
      {selected && (
        <div className="mb-2.5 space-y-2.5 rounded-xl border border-teal-500/30 bg-teal-500/5 p-2">
          <div className="grid grid-cols-6 gap-1">
            <button type="button" title="Center in zone" onClick={onCenterSelected} className="grid h-8 place-items-center rounded-lg text-ink-700 transition hover:bg-white">
              <Crosshair className="h-4 w-4" />
            </button>
            <button
              type="button"
              title={selected.kind === "image" ? "Fit to zone" : "Fit (images only)"}
              onClick={onFitSelected}
              disabled={selected.kind !== "image"}
              className="grid h-8 place-items-center rounded-lg text-ink-700 transition hover:bg-white disabled:opacity-35"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button type="button" title="Flip horizontal" onClick={() => onFlipSelected("x")} className="grid h-8 place-items-center rounded-lg text-ink-700 transition hover:bg-white">
              <FlipHorizontal className="h-4 w-4" />
            </button>
            <button type="button" title="Flip vertical" onClick={() => onFlipSelected("y")} className="grid h-8 place-items-center rounded-lg text-ink-700 transition hover:bg-white">
              <FlipVertical className="h-4 w-4" />
            </button>
            <button type="button" title="Duplicate" onClick={onDuplicateSelected} className="grid h-8 place-items-center rounded-lg text-ink-700 transition hover:bg-white">
              <Copy className="h-4 w-4" />
            </button>
            <button type="button" title="Delete" onClick={onDeleteSelected} className="grid h-8 place-items-center rounded-lg text-coral-600 transition hover:bg-white">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <SliderRow
            label="Rotation"
            icon={RotateCw}
            value={Math.round(selected.rotation)}
            min={-180}
            max={180}
            format={(v) => `${v}°`}
            onChange={(v) => onUpdateSelected({ rotation: v })}
          />
          <SliderRow
            label="Size"
            value={Math.max(5, Math.min(250, Math.round(Math.abs(selected.scaleX) * 100)))}
            min={5}
            max={250}
            format={(v) => `${v}%`}
            onChange={(v) => {
              const next = (v / 100) * Math.sign(selected.scaleX || 1);
              onUpdateSelected({ scaleX: next, scaleY: next });
            }}
          />
          <SliderRow
            label="Intensity"
            icon={SunMedium}
            value={Math.round(selected.opacity * 100)}
            min={10}
            max={100}
            format={(v) => `${v}%`}
            onChange={(v) => onUpdateSelected({ opacity: v / 100 })}
          />

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={onResetSelected}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-ink-900/15 bg-white px-2 py-2 text-[11px] font-bold text-ink-700 transition hover:border-teal-500 hover:text-teal-700"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
            <button
              type="button"
              onClick={() => onSelectElement(null)}
              className="rounded-lg border border-ink-900/15 bg-white px-2 py-2 text-[11px] font-bold text-ink-700 transition hover:border-teal-500 hover:text-teal-700"
            >
              Deselect
            </button>
          </div>

          {selected.kind === "image" && (
            <button
              type="button"
              onClick={onRemoveWhiteBackground}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-teal-500/25 bg-white px-3 py-2 text-[11px] font-bold text-teal-700 transition hover:border-teal-500 hover:bg-teal-500/5"
            >
              <WandSparkles className="h-3.5 w-3.5" /> Remove white background
            </button>
          )}
        </div>
      )}

      {elements.length === 0 ? (
        <p className="rounded-xl bg-sand-50 px-3 py-4 text-center text-xs leading-relaxed text-ink-500">
          Nothing on the {view} yet — upload artwork or add text to start designing.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {[...elements].reverse().map((el) => {
            const realIndex = elements.indexOf(el);
            return (
              <li
                key={el.id}
                className={`flex items-center gap-1.5 rounded-xl border p-1.5 transition ${
                  el.id === selectedId
                    ? "border-teal-500 bg-teal-500/5"
                    : "border-ink-900/10 bg-white hover:border-ink-900/25"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectElement(el.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-sand-100 text-ink-600">
                    {el.kind === "image" ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={el.src} alt="" className="h-6 w-6 rounded object-contain" />
                    ) : (
                      <TypeIcon className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-ink-800">
                      {el.label}
                    </span>
                    <span className="block truncate text-[10px] font-medium text-teal-600">
                      {el.placement.replace(/-/g, " ")}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  title="Bring forward"
                  disabled={realIndex === elements.length - 1}
                  onClick={() => onLayerMove(el.id, 1)}
                  className="grid h-7 w-7 place-items-center rounded-lg text-ink-600 transition hover:bg-sand-100 disabled:opacity-30"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Send backward"
                  disabled={realIndex === 0}
                  onClick={() => onLayerMove(el.id, -1)}
                  className="grid h-7 w-7 place-items-center rounded-lg text-ink-600 transition hover:bg-sand-100 disabled:opacity-30"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Delete"
                  onClick={() => onDeleteElement(el.id)}
                  className="grid h-7 w-7 place-items-center rounded-lg text-coral-600 transition hover:bg-coral-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-2.5 space-y-2 border-t border-ink-900/10 pt-2.5">
        <div className="rounded-xl bg-sand-50 p-2">
          <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">
            Print appearance
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => onBlendChange(false)}
              className={`rounded-lg px-2 py-2 text-[11px] font-bold transition ${
                !blend ? "bg-coral-500 text-white shadow-sm" : "bg-white text-ink-600"
              }`}
            >
              Vivid color
            </button>
            <button
              type="button"
              onClick={() => onBlendChange(true)}
              className={`rounded-lg px-2 py-2 text-[11px] font-bold transition ${
                blend ? "bg-ink-900 text-white shadow-sm" : "bg-white text-ink-600"
              }`}
            >
              Fabric proof
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={onClearView}
          disabled={elements.length === 0}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-ink-900/10 px-3 py-2.5 text-xs font-bold text-ink-600 transition hover:border-coral-500 hover:text-coral-600 disabled:opacity-40"
        >
          <Eraser className="h-3.5 w-3.5" />
          Clear {view}
        </button>
      </div>
    </Section>
  );
}
