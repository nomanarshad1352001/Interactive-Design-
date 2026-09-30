"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bold,
  ChevronDown,
  ChevronUp,
  Copy,
  Crosshair,
  Eraser,
  FlipHorizontal,
  FlipVertical,
  Italic,
  Layers3,
  Loader2,
  MapPin,
  Maximize2,
  Palette,
  Plus,
  RotateCcw,
  RotateCw,
  Shirt,
  SunMedium,
  Trash2,
  Type as TypeIcon,
  UploadCloud,
  WandSparkles,
  Zap,
} from "lucide-react";
import {
  GARMENT_COLORS,
  PRODUCTS,
  SAMPLE_ART,
  TEXT_COLORS,
  money,
  type PlacementDef,
  type ProductDef,
  type ProductId,
  type SampleArt,
  type ViewSide,
} from "@/config/catalog";
import { DESIGN_FONTS } from "@/lib/fonts";
import type { ArtworkFile, DesignElement, FontStyle } from "@/lib/studio-types";

export interface TextInit {
  text: string;
  fontFamily: string;
  fill: string;
  fontStyle: FontStyle;
}

export interface ToolsPanelProps {
  product: ProductDef;
  onProductChange: (id: ProductId) => void;
  colorHex: string;
  colorName: string;
  onColorChange: (hex: string, name: string) => void;
  artworks: ArtworkFile[];
  uploading: boolean;
  onUploadFiles: (files: FileList | File[]) => void;
  onAddArtwork: (art: ArtworkFile) => void;
  onAddSample: (sample: SampleArt) => void;
  onAddText: (init: TextInit) => void;
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
  placements: PlacementDef[];
  activePlacementId: string;
  onPlacementChange: (id: string) => void;
  blend: boolean;
  onBlendChange: (v: boolean) => void;
  onClearView: () => void;
}

type SectionId = "product" | "color" | "placement" | "artwork" | "text" | "layers";

const TEXT_PRESETS = [
  "Your Team Name",
  "Little River, SC",
  "Beach Club",
  "EST 2026",
  "Grand Strand",
  "Salt Life Crew",
];

function Section({
  id,
  title,
  note,
  icon: Icon,
  open,
  onToggle,
  children,
}: {
  id: SectionId;
  title: string;
  note?: string;
  icon: typeof Shirt;
  open: boolean;
  onToggle: (id: SectionId) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-ink-900/10 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left transition hover:bg-sand-50"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-teal-500/10 text-teal-600">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-bold tracking-tight text-ink-900">{title}</h3>
        {note && (
          <span className="ml-auto truncate pl-2 text-[10px] font-semibold uppercase tracking-wider text-ink-500/70">
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
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-ink-900/5 p-3.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function SliderRow({
  label,
  icon: Icon,
  value,
  min,
  max,
  format,
  onChange,
}: {
  label: string;
  icon?: typeof Shirt;
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

export default function ToolsPanel(props: ToolsPanelProps) {
  const {
    product,
    onProductChange,
    colorHex,
    colorName,
    onColorChange,
    artworks,
    uploading,
    onUploadFiles,
    onAddArtwork,
    onAddSample,
    onAddText,
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
    placements,
    activePlacementId,
    onPlacementChange,
    blend,
    onBlendChange,
    onClearView,
  } = props;

  const fileInput = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Collapsible sections keep the entire toolkit fitted into one page.
  const [open, setOpen] = useState<Record<SectionId, boolean>>({
    product: true,
    color: true,
    placement: true,
    artwork: false,
    text: false,
    layers: true,
  });
  const toggle = (id: SectionId) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  // Selecting artwork/text on the garment opens its controls immediately.
  useEffect(() => {
    if (!selected) return;
    setOpen((o) => ({
      ...o,
      layers: true,
      placement: true,
      text: selected.kind === "text" ? true : o.text,
    }));
  }, [selected?.id, selected?.kind]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- text draft state (syncs with the selected text element) ----
  const selectedText = selected?.kind === "text" ? selected : null;
  const [draft, setDraft] = useState("");
  const [font, setFont] = useState(DESIGN_FONTS[0].family);
  const [textColor, setTextColor] = useState(TEXT_COLORS[0]);
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);

  useEffect(() => {
    if (selectedText) {
      setDraft(selectedText.text);
      setFont(selectedText.fontFamily);
      setTextColor(selectedText.fill);
      setBold(selectedText.fontStyle.includes("bold"));
      setItalic(selectedText.fontStyle.includes("italic"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedText?.id]);

  const styleFrom = (b: boolean, i: boolean): FontStyle =>
    b && i ? "bold italic" : b ? "bold" : i ? "italic" : "normal";

  return (
    <div className="space-y-2.5">
      {/* ---------------- PRODUCT ---------------- */}
      <Section
        id="product"
        title="Choose Product"
        icon={Shirt}
        note={product.shortName}
        open={open.product}
        onToggle={toggle}
      >
        <div className="grid grid-cols-4 gap-2 xl:grid-cols-2">
          {PRODUCTS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onProductChange(p.id)}
              className={`group rounded-xl border-2 p-1.5 text-left transition ${
                p.id === product.id
                  ? "border-teal-500 bg-teal-500/5"
                  : "border-ink-900/10 hover:border-ink-900/25"
              }`}
            >
              <span className="block overflow-hidden rounded-lg bg-sand-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.images.front}
                  alt={p.name}
                  className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </span>
              <span className="mt-1 block text-[11px] font-bold leading-tight text-ink-900">
                {p.shortName}
              </span>
              <span className="block text-[10px] font-semibold text-ink-500">
                from {money(p.basePrice)}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-ink-500">{product.tagline}</p>
      </Section>

      {/* ---------------- COLOR ---------------- */}
      <Section
        id="color"
        title="Garment Color"
        icon={Palette}
        note={colorName}
        open={open.color}
        onToggle={toggle}
      >
        <div className="grid grid-cols-8 gap-2">
          {GARMENT_COLORS.map((c) => (
            <button
              key={c.name}
              type="button"
              title={c.name}
              aria-label={`Garment color ${c.name}`}
              onClick={() => onColorChange(c.hex, c.name)}
              className={`aspect-square rounded-full border transition ${
                colorHex.toLowerCase() === c.hex.toLowerCase()
                  ? "scale-110 border-ink-900 ring-2 ring-teal-500 ring-offset-2 ring-offset-white"
                  : "border-ink-900/15 hover:scale-105"
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-ink-500">
          Recoloring preserves the fabric&apos;s real shadows, seams and wrinkles.
        </p>
      </Section>

      {/* ---------------- PRINT PLACEMENT ---------------- */}
      <Section
        id="placement"
        title="Print Location"
        icon={MapPin}
        note={placements.find((p) => p.id === activePlacementId)?.short}
        open={open.placement}
        onToggle={toggle}
      >
        <div className="grid grid-cols-2 gap-1.5">
          {placements.map((p) => {
            const used = elements.some((el) => el.placement === p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onPlacementChange(p.id)}
                className={`rounded-xl border-2 px-2.5 py-2 text-left transition ${
                  activePlacementId === p.id
                    ? "border-teal-500 bg-teal-500/5"
                    : "border-ink-900/10 hover:border-ink-900/25"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[11px] font-bold text-ink-900">{p.name}</span>
                  {used && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-coral-500" />}
                </span>
                <span className="mt-0.5 block text-[10px] font-semibold text-ink-500">
                  {p.surcharge > 0 ? `+${money(p.surcharge)}/pc` : "Included"}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-ink-500">
          {selected
            ? "Choosing a location moves your selected logo or text there and scales it to fit."
            : "New artwork and text drop into the highlighted location. Sleeve/arm and hood prints add a small per-piece charge."}
        </p>
      </Section>

      {/* ---------------- ARTWORK ---------------- */}
      <Section
        id="artwork"
        title="Upload Artwork"
        icon={UploadCloud}
        note={artworks.length ? `${artworks.length} file${artworks.length === 1 ? "" : "s"}` : "PNG · JPG · SVG"}
        open={open.artwork}
        onToggle={toggle}
      >
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length) onUploadFiles(e.dataTransfer.files);
          }}
          className={`rounded-xl border-2 border-dashed p-3.5 text-center transition ${
            dragOver ? "border-teal-500 bg-teal-500/5" : "border-ink-900/15 bg-sand-50"
          }`}
        >
          <UploadCloud className="mx-auto h-6 w-6 text-teal-500" />
          <p className="mt-1.5 text-xs font-semibold text-ink-700">
            Drag &amp; drop or
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="ml-1 font-bold text-teal-600 underline underline-offset-2 hover:text-teal-500"
            >
              browse files
            </button>
          </p>
          <p className="mt-1 text-[10px] leading-relaxed text-ink-500">
            Transparent PNGs work best. Originals stay full-resolution for DTF.
          </p>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files?.length) onUploadFiles(e.target.files);
              e.target.value = "";
            }}
          />
          {uploading && (
            <p className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-teal-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing artwork…
            </p>
          )}
        </div>

        {artworks.length > 0 && (
          <ul className="mt-2.5 space-y-1.5">
            {artworks.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-2 rounded-xl border border-ink-900/10 bg-sand-50 p-1.5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.dataUrl}
                  alt={a.name}
                  className="h-9 w-9 rounded-lg border border-ink-900/10 bg-white object-contain"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-bold text-ink-800">{a.name}</p>
                  <p className="text-[10px] font-medium text-ink-500">
                    {a.width}×{a.height}
                    {a.sizeKB > 0 && ` · ${a.sizeKB} KB`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onAddArtwork(a)}
                  className="inline-flex items-center gap-1 rounded-lg bg-ink-900 px-2 py-1.5 text-[11px] font-bold text-sand-50 transition hover:bg-ink-700"
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="mb-1.5 mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500/80">
          Or start with sample art
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {SAMPLE_ART.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onAddSample(s)}
              className="group overflow-hidden rounded-xl border border-ink-900/10 bg-sand-100 transition hover:border-teal-500"
              title={`Add ${s.name}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.url}
                alt={s.name}
                loading="lazy"
                className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="block px-1 py-1 text-center text-[10px] font-semibold text-ink-600">
                {s.name}
              </span>
            </button>
          ))}
        </div>
      </Section>

      {/* ---------------- TEXT ---------------- */}
      <Section
        id="text"
        title="Add Text"
        icon={TypeIcon}
        note={selectedText ? "editing selected" : undefined}
        open={open.text}
        onToggle={toggle}
      >
        <input
          type="text"
          value={draft}
          maxLength={60}
          placeholder="Type your text…"
          onChange={(e) => {
            setDraft(e.target.value);
            if (selectedText) onUpdateSelected({ text: e.target.value });
          }}
          className="w-full rounded-xl border border-ink-900/15 bg-sand-50 px-3 py-2 text-sm font-medium text-ink-900 placeholder:text-ink-500/50 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25"
        />

        <div className="mt-2 flex flex-wrap gap-1">
          <span className="mr-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ink-500">
            <Zap className="h-3 w-3 text-teal-500" /> Quick:
          </span>
          {TEXT_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setDraft(p);
                if (selectedText) onUpdateSelected({ text: p });
              }}
              className="rounded-full border border-ink-900/10 bg-white px-2.5 py-1 text-[10px] font-semibold text-ink-600 transition hover:border-teal-500 hover:text-teal-700"
            >
              {p}
            </button>
          ))}
        </div>

        <div className="mt-2.5 grid max-h-28 grid-cols-2 gap-1 overflow-y-auto pr-1 thin-scroll">
          {DESIGN_FONTS.map((f) => (
            <button
              key={f.family}
              type="button"
              onClick={() => {
                setFont(f.family);
                if (selectedText) onUpdateSelected({ fontFamily: f.family });
              }}
              className={`truncate rounded-lg border px-2 py-1.5 text-left text-sm transition ${
                font === f.family
                  ? "border-teal-500 bg-teal-500/5 text-ink-900"
                  : "border-ink-900/10 text-ink-600 hover:border-ink-900/30"
              }`}
              style={{ fontFamily: f.family }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-2.5 grid grid-cols-7 gap-1.5">
          {TEXT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Text color ${c}`}
              onClick={() => {
                setTextColor(c);
                if (selectedText) onUpdateSelected({ fill: c });
              }}
              className={`aspect-square rounded-full border transition ${
                textColor === c
                  ? "scale-110 border-ink-900 ring-2 ring-teal-500 ring-offset-1"
                  : "border-ink-900/15"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
          <label
            className="relative aspect-square cursor-pointer overflow-hidden rounded-full"
            title="Custom color"
          >
            <input
              type="color"
              value={textColor}
              onChange={(e) => {
                setTextColor(e.target.value);
                if (selectedText) onUpdateSelected({ fill: e.target.value });
              }}
              className="absolute inset-0 h-full w-full"
            />
          </label>
        </div>

        <div className="mt-2.5 flex gap-1.5">
          <button
            type="button"
            aria-pressed={bold}
            onClick={() => {
              const b = !bold;
              setBold(b);
              if (selectedText) onUpdateSelected({ fontStyle: styleFrom(b, italic) });
            }}
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition ${
              bold ? "border-teal-500 bg-teal-500/10 text-teal-600" : "border-ink-900/15"
            }`}
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-pressed={italic}
            onClick={() => {
              const i = !italic;
              setItalic(i);
              if (selectedText) onUpdateSelected({ fontStyle: styleFrom(bold, i) });
            }}
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition ${
              italic ? "border-teal-500 bg-teal-500/10 text-teal-600" : "border-ink-900/15"
            }`}
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={!draft.trim()}
            onClick={() => {
              if (!draft.trim()) return;
              onAddText({
                text: draft.trim(),
                fontFamily: font,
                fill: textColor,
                fontStyle: styleFrom(bold, italic),
              });
              setDraft("");
            }}
            className="flex-1 rounded-lg bg-ink-900 px-3 py-2 text-xs font-bold text-sand-50 transition hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {selectedText ? "Add as New Text" : "Add Text to Design"}
          </button>
        </div>

        {selectedText && (
          <div className="mt-2.5 space-y-2.5 rounded-xl border border-ink-900/10 bg-sand-50 p-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onUpdateSelected({ strokeWidth: selectedText.strokeWidth > 0 ? 0 : 3 })
                }
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
                  selectedText.strokeWidth > 0
                    ? "border-teal-500 bg-teal-500/10 text-teal-700"
                    : "border-ink-900/15 bg-white text-ink-700"
                }`}
              >
                Text outline
              </button>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-ink-600">
                Color
                <input
                  type="color"
                  value={selectedText.stroke}
                  onChange={(e) => onUpdateSelected({ stroke: e.target.value })}
                  className="h-6 w-6"
                />
              </label>
            </div>
            <SliderRow
              label="Letter spacing"
              value={selectedText.letterSpacing}
              min={-2}
              max={24}
              format={(v) => `${v}px`}
              onChange={(v) => onUpdateSelected({ letterSpacing: v })}
            />
          </div>
        )}
      </Section>

      {/* ---------------- LAYERS ---------------- */}
      <Section
        id="layers"
        title="Layers & Adjust"
        icon={Layers3}
        note={`${view} · ${elements.length} item${elements.length === 1 ? "" : "s"}`}
        open={open.layers}
        onToggle={toggle}
      >
        {selected && (
          <div className="mb-2.5 space-y-2.5 rounded-xl border border-teal-500/30 bg-teal-500/5 p-2">
            <div className="grid grid-cols-6 gap-1">
              <button type="button" title="Center in print area" onClick={onCenterSelected} className="grid h-8 place-items-center rounded-lg text-ink-700 transition hover:bg-white">
                <Crosshair className="h-4 w-4" />
              </button>
              <button
                type="button"
                title={selected.kind === "image" ? "Fit to print area" : "Fit (images only)"}
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
                className="inline-flex items-center justify-center rounded-lg border border-ink-900/15 bg-white px-2 py-2 text-[11px] font-bold text-ink-700 transition hover:border-teal-500 hover:text-teal-700"
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
                    <span className="truncate text-xs font-semibold text-ink-800">{el.label}</span>
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
    </div>
  );
}
