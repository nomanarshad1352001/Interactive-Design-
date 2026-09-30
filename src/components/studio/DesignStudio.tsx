"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Box,
  Check,
  CopyPlus,
  Download,
  Eye,
  EyeOff,
  FlipHorizontal2,
  Loader2,
  MapPin,
  Maximize,
  MousePointer2,
  Redo2,
  Ruler,
  RotateCw,
  Square,
  Undo2,
} from "lucide-react";
import {
  GARMENT_COLORS,
  PRODUCTS,
  STAGE_BACKDROPS,
  backdropById,
  money,
  placementFor,
  productById,
  type GarmentColor,
  type ProductId,
  type SampleArt,
  type ViewSide,
} from "@/config/catalog";
import { compositePreview, loadHtmlImage, processMockup, renderDesignPNG } from "@/lib/imaging";
import type {
  ArtworkFile,
  DesignElement,
  DesignState,
  FontStyle,
  OrderSizes,
} from "@/lib/studio-types";
import { emptyDesigns, emptySizes, uid } from "@/lib/studio-types";
import MockupStage, { type ViewerMode } from "./MockupStage";
import ToolsPanel, { type TextInit } from "./ToolsPanel";
import QuotePanel from "./QuotePanel";

const MAX_ARTWORK_EDGE = 1600;
const DRAFT_KEY = "cct-design-studio-v1";

interface SavedDraft {
  productId: ProductId;
  colors: Record<ProductId, GarmentColor>;
  designs: DesignState;
  sizes: OrderSizes;
  artworks: ArtworkFile[];
  savedAt: number;
}

function loadDraft(): SavedDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedDraft>;
    if (!parsed.designs || !parsed.colors) return null;
    return {
      productId: parsed.productId ?? "tshirt",
      colors: parsed.colors,
      designs: parsed.designs,
      sizes: parsed.sizes ?? emptySizes(),
      artworks: Array.isArray(parsed.artworks) ? parsed.artworks : [],
      savedAt: parsed.savedAt ?? Date.now(),
    };
  } catch {
    return null;
  }
}

function measureTextWidth(
  text: string,
  fontFamily: string,
  fontSize: number,
  fontStyle: FontStyle,
): number {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return text.length * fontSize * 0.55;
  const italic = fontStyle.includes("italic") ? "italic " : "";
  const weight = fontStyle.includes("bold") ? "700" : "400";
  ctx.font = `${italic}${weight} ${fontSize}px "${fontFamily}"`;
  return ctx.measureText(text).width;
}

async function downscaleForCanvas(
  dataUrl: string,
  w: number,
  h: number,
): Promise<{ dataUrl: string; w: number; h: number }> {
  const longest = Math.max(w, h);
  if (longest <= MAX_ARTWORK_EDGE) return { dataUrl, w, h };
  const scale = MAX_ARTWORK_EDGE / longest;
  const img = await loadHtmlImage(dataUrl, false);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return { dataUrl: canvas.toDataURL("image/png"), w: canvas.width, h: canvas.height };
}

export default function DesignStudio() {
  const [draft] = useState<SavedDraft | null>(() => loadDraft());
  const [productId, setProductId] = useState<ProductId>(draft?.productId ?? "tshirt");
  const [view, setView] = useState<ViewSide>("front");
  const [colors, setColors] = useState<Record<ProductId, GarmentColor>>(
    () =>
      draft?.colors ?? {
        tshirt: GARMENT_COLORS[0],
        hoodie: GARMENT_COLORS[0],
        cap: GARMENT_COLORS[0],
        tote: GARMENT_COLORS[0],
      },
  );
  const [designs, setDesigns] = useState<DesignState>(() => draft?.designs ?? emptyDesigns());
  const [sizes, setSizes] = useState<OrderSizes>(() => draft?.sizes ?? emptySizes());
  const [artworks, setArtworks] = useState<ArtworkFile[]>(draft?.artworks ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(true);
  // Keep uploaded art bright and color-accurate unless the customer opts into
  // the softer fabric-blended proof.
  const [blend, setBlend] = useState(false);
  const [viewerMode, setViewerMode] = useState<ViewerMode>("2d");
  const [backdropId, setBackdropId] = useState("studio");
  // Active print location per product + side (chest, sleeve/arm, hood, …).
  const [placementMap, setPlacementMap] = useState<Record<string, string>>({});
  const [downloading, setDownloading] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(
    draft?.savedAt ? new Date(draft.savedAt) : null,
  );
  const [uploading, setUploading] = useState(false);
  const designsRef = useRef(designs);
  const pastRef = useRef<DesignState[]>([]);
  const futureRef = useRef<DesignState[]>([]);
  const [historyTick, setHistoryTick] = useState(0);

  // Auto-save the whole working draft locally so nothing is lost on refresh.
  useEffect(() => {
    const t = window.setTimeout(() => {
      const payload = { productId, colors, designs, sizes, artworks, savedAt: Date.now() };
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      } catch {
        try {
          // Artwork payloads can exceed storage quota; keep the design itself.
          window.localStorage.setItem(
            DRAFT_KEY,
            JSON.stringify({ ...payload, artworks: [] }),
          );
        } catch {
          /* storage unavailable — session continues without persistence */
        }
      }
      setSavedAt(new Date());
    }, 600);
    return () => window.clearTimeout(t);
  }, [productId, colors, designs, sizes, artworks]);

  const product = productById(productId);
  const color = colors[productId];
  const elements = designs[productId][view];
  const placementKey = `${productId}:${view}`;
  const activePlacement = placementFor(product, view, placementMap[placementKey]);
  const selected = useMemo(
    () => elements.find((el) => el.id === selectedId) ?? null,
    [elements, selectedId],
  );

  // Selecting artwork highlights the zone it actually lives in.
  useEffect(() => {
    if (!selected?.placement) return;
    setPlacementMap((m) =>
      m[placementKey] === selected.placement ? m : { ...m, [placementKey]: selected.placement },
    );
  }, [selected?.placement, placementKey]);

  const commitDesigns = useCallback((makeNext: (current: DesignState) => DesignState) => {
    const current = designsRef.current;
    const next = makeNext(current);
    if (next === current) return;
    pastRef.current = [...pastRef.current.slice(-39), current];
    futureRef.current = [];
    designsRef.current = next;
    setDesigns(next);
    setHistoryTick((v) => v + 1);
  }, []);

  const undo = useCallback(() => {
    const previous = pastRef.current.at(-1);
    if (!previous) return;
    pastRef.current = pastRef.current.slice(0, -1);
    futureRef.current = [designsRef.current, ...futureRef.current].slice(0, 40);
    designsRef.current = previous;
    setDesigns(previous);
    setSelectedId(null);
    setHistoryTick((v) => v + 1);
  }, []);

  const redo = useCallback(() => {
    const next = futureRef.current[0];
    if (!next) return;
    futureRef.current = futureRef.current.slice(1);
    pastRef.current = [...pastRef.current.slice(-39), designsRef.current];
    designsRef.current = next;
    setDesigns(next);
    setSelectedId(null);
    setHistoryTick((v) => v + 1);
  }, []);

  // Escape clears selection; Cmd/Ctrl+Z and Shift+Cmd/Ctrl+Z control history.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const isField = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA");
      if (e.key === "Escape" && !isField) setSelectedId(null);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !isField) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [redo, undo]);

  const patchElements = useCallback(
    (fn: (list: DesignElement[]) => DesignElement[]) => {
      commitDesigns((d) => ({
        ...d,
        [productId]: { ...d[productId], [view]: fn(d[productId][view]) },
      }));
    },
    [commitDesigns, productId, view],
  );

  const updateElement = useCallback(
    (id: string, patch: Partial<DesignElement>) => {
      patchElements((list) =>
        list.map((el) => (el.id === id ? ({ ...el, ...patch } as DesignElement) : el)),
      );
    },
    [patchElements],
  );

  const placeInPrintArea = (w: number, h: number) => {
    const pr = activePlacement.rect;
    const fit = Math.min((pr.w * 0.85) / w, (pr.h * 0.85) / h);
    const scale = Math.min(fit, 1);
    return {
      scaleX: scale,
      scaleY: scale,
      x: pr.x + (pr.w - w * scale) / 2,
      y: pr.y + (pr.h - h * scale) / 2,
    };
  };

  const addArtworkToView = useCallback(
    (art: ArtworkFile) => {
      const placed = placeInPrintArea(art.width, art.height);
      const el: DesignElement = {
        id: uid(),
        kind: "image",
        src: art.dataUrl,
        width: art.width,
        height: art.height,
        label: art.name.length > 26 ? `${art.name.slice(0, 24)}…` : art.name,
        artworkId: art.id,
        rotation: 0,
        opacity: 1,
        placement: activePlacement.id,
        ...placed,
      };
      patchElements((list) => [...list, el]);
      setSelectedId(el.id);
      setEditing(true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [patchElements, product, view],
  );

  const handleUploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith("image/") || f.type === "image/svg+xml");
      if (!list.length) return;
      setUploading(true);
      try {
        for (const file of list) {
          const raw = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error("Could not read file."));
            reader.readAsDataURL(file);
          });
          let w = 512;
          let h = 512;
          try {
            const img = await loadHtmlImage(raw, false);
            w = img.naturalWidth || 512;
            h = img.naturalHeight || 512;
          } catch {
            /* keep default square */
          }
          const scaled = await downscaleForCanvas(raw, w, h);
          const art: ArtworkFile = {
            id: uid(),
            name: file.name,
            sizeKB: Math.max(1, Math.round(file.size / 1024)),
            width: scaled.w,
            height: scaled.h,
            dataUrl: scaled.dataUrl,
          };
          setArtworks((prev) => [...prev, art]);
          addArtworkToView(art);
        }
      } finally {
        setUploading(false);
      }
    },
    [addArtworkToView],
  );

  const handleAddSample = useCallback(
    async (sample: SampleArt) => {
      const existing = artworks.find((a) => a.dataUrl === sample.url);
      if (existing) {
        addArtworkToView(existing);
        return;
      }
      try {
        const img = await loadHtmlImage(sample.url);
        const art: ArtworkFile = {
          id: uid(),
          name: `${sample.name} (sample)`,
          sizeKB: 0,
          width: img.naturalWidth || 940,
          height: img.naturalHeight || 940,
          dataUrl: sample.url,
          sample: true,
        };
        setArtworks((prev) => [...prev, art]);
        addArtworkToView(art);
      } catch {
        /* ignore sample load failures */
      }
    },
    [artworks, addArtworkToView],
  );

  const handleAddText = useCallback(
    (init: TextInit) => {
      const pr = activePlacement.rect;
      const fontSize = Math.max(28, Math.min(92, Math.round(pr.h * 0.3)));
      const w = measureTextWidth(init.text, init.fontFamily, fontSize, init.fontStyle);
      const el: DesignElement = {
        id: uid(),
        kind: "text",
        text: init.text,
        fontFamily: init.fontFamily,
        fill: init.fill,
        fontSize,
        fontStyle: init.fontStyle,
        letterSpacing: 0,
        stroke: "#ffffff",
        strokeWidth: 0,
        label: init.text.length > 22 ? `"${init.text.slice(0, 20)}…"` : `"${init.text}"`,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        placement: activePlacement.id,
        x: pr.x + Math.max(0, (pr.w - w) / 2),
        y: pr.y + pr.h / 2 - fontSize / 2,
      };
      patchElements((list) => [...list, el]);
      setSelectedId(el.id);
      setEditing(true);
    },
    [patchElements, activePlacement],
  );

  /**
   * Choosing a zone moves the selected artwork there (and scales it to fit),
   * which is how a logo hops from full front to a sleeve/arm or hood.
   */
  const selectPlacement = useCallback(
    (id: string) => {
      setPlacementMap((m) => ({ ...m, [placementKey]: id }));
      if (!selected) return;
      const zone = placementFor(product, view, id);
      const baseW =
        selected.kind === "image"
          ? selected.width
          : measureTextWidth(
              selected.text,
              selected.fontFamily,
              selected.fontSize,
              selected.fontStyle,
            );
      const baseH = selected.kind === "image" ? selected.height : selected.fontSize * 1.2;
      const fit = Math.min((zone.rect.w * 0.86) / baseW, (zone.rect.h * 0.86) / baseH);
      const sx = fit * Math.sign(selected.scaleX || 1);
      const sy = fit * Math.sign(selected.scaleY || 1);
      updateElement(selected.id, {
        placement: id,
        scaleX: sx,
        scaleY: sy,
        x: zone.rect.x + (zone.rect.w - baseW * fit) / 2,
        y: zone.rect.y + (zone.rect.h - baseH * fit) / 2,
      });
    },
    [placementKey, product, selected, updateElement, view],
  );

  const updateSelected = useCallback(
    (patch: Partial<DesignElement>) => {
      if (selectedId) updateElement(selectedId, patch);
    },
    [selectedId, updateElement],
  );

  const deleteElement = useCallback(
    (id: string) => {
      patchElements((list) => list.filter((el) => el.id !== id));
      setSelectedId((current) => (current === id ? null : current));
    },
    [patchElements],
  );

  const deleteSelected = useCallback(() => {
    if (selectedId) deleteElement(selectedId);
  }, [selectedId, deleteElement]);

  const duplicateSelected = useCallback(() => {
    if (!selected) return;
    const copy: DesignElement = { ...selected, id: uid(), x: selected.x + 28, y: selected.y + 28 };
    patchElements((list) => [...list, copy]);
    setSelectedId(copy.id);
  }, [selected, patchElements]);

  const moveLayer = useCallback(
    (id: string, dir: 1 | -1) => {
      patchElements((list) => {
        const i = list.findIndex((el) => el.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= list.length) return list;
        const next = [...list];
        [next[i], next[j]] = [next[j], next[i]];
        return next;
      });
    },
    [patchElements],
  );

  const centerSelected = useCallback(() => {
    if (!selected) return;
    const pr = placementFor(product, view, selected.placement).rect;
    let w: number;
    let h: number;
    if (selected.kind === "image") {
      w = selected.width * selected.scaleX;
      h = selected.height * selected.scaleY;
    } else {
      w = measureTextWidth(selected.text, selected.fontFamily, selected.fontSize, selected.fontStyle) * selected.scaleX;
      h = selected.fontSize * 1.2 * selected.scaleY;
    }
    updateElement(selected.id, {
      x: pr.x + (pr.w - w) / 2,
      y: pr.y + (pr.h - h) / 2,
    });
  }, [selected, product, view, updateElement]);

  const fitSelected = useCallback(() => {
    if (!selected || selected.kind !== "image") return;
    const pr = placementFor(product, view, selected.placement).rect;
    const fit = Math.min((pr.w * 0.92) / selected.width, (pr.h * 0.92) / selected.height);
    updateElement(selected.id, {
      scaleX: fit,
      scaleY: fit,
      x: pr.x + (pr.w - selected.width * fit) / 2,
      y: pr.y + (pr.h - selected.height * fit) / 2,
    });
  }, [selected, product, view, updateElement]);

  const flipSelected = useCallback(
    (axis: "x" | "y") => {
      if (!selected) return;
      if (axis === "x") {
        const w =
          selected.kind === "image"
            ? selected.width
            : measureTextWidth(
                selected.text,
                selected.fontFamily,
                selected.fontSize,
                selected.fontStyle,
              );
        updateElement(selected.id, {
          scaleX: -selected.scaleX,
          x: selected.x + w * selected.scaleX,
        });
      } else {
        const h = selected.kind === "image" ? selected.height : selected.fontSize * 1.2;
        updateElement(selected.id, {
          scaleY: -selected.scaleY,
          y: selected.y + h * selected.scaleY,
        });
      }
    },
    [selected, updateElement],
  );

  const resetSelected = useCallback(() => {
    if (!selected) return;
    const pr = placementFor(product, view, selected.placement).rect;
    const w =
      selected.kind === "image"
        ? selected.width
        : measureTextWidth(
            selected.text,
            selected.fontFamily,
            selected.fontSize,
            selected.fontStyle,
          );
    const h = selected.kind === "image" ? selected.height : selected.fontSize * 1.2;
    const fit = Math.min(1, (pr.w * 0.86) / w, (pr.h * 0.86) / h);
    updateElement(selected.id, {
      scaleX: fit,
      scaleY: fit,
      rotation: 0,
      opacity: 1,
      x: pr.x + (pr.w - w * fit) / 2,
      y: pr.y + (pr.h - h * fit) / 2,
    });
  }, [selected, product, view, updateElement]);

  const downloadMockup = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const mock = await processMockup(
        product.images[view],
        product.knockouts?.[view],
      );
      const designPng = designs[productId][view].length
        ? await renderDesignPNG(designs[productId][view])
        : null;
      const url = await compositePreview(mock, color.hex, designPng, blend, 1400);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${product.id}-${view}-coastal-custom-tees.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setDownloading(false);
    }
  }, [blend, color.hex, designs, downloading, product, productId, view]);

  const toggleFullscreen = useCallback(() => {
    const el = document.getElementById("studio-stage");
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  }, []);

  const removeWhiteBackground = useCallback(async () => {
    if (!selected || selected.kind !== "image") return;
    try {
      const img = await loadHtmlImage(selected.src);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const r = pixels.data[i];
        const g = pixels.data[i + 1];
        const b = pixels.data[i + 2];
        const min = Math.min(r, g, b);
        const max = Math.max(r, g, b);
        // Remove neutral near-whites with a soft edge. Saturated pale colors are
        // preserved; only the design copy changes, never the original upload.
        if (min > 214 && max - min < 22) {
          const keep = Math.max(0, Math.min(1, (245 - min) / 31));
          pixels.data[i + 3] = Math.round(pixels.data[i + 3] * keep);
        }
      }
      ctx.putImageData(pixels, 0, 0);
      updateElement(selected.id, {
        src: canvas.toDataURL("image/png"),
        label: `${selected.label.replace(/ · no bg$/, "")} · no bg`,
      });
    } catch {
      /* Keep the original artwork if pixel access is unavailable. */
    }
  }, [selected, updateElement]);

  const copyToOtherSide = useCallback(() => {
    const other: ViewSide = view === "front" ? "back" : "front";
    commitDesigns((d) => ({
      ...d,
      [productId]: {
        ...d[productId],
        // Keep each element in the matching zone on the other side when one
        // exists (sleeves map to sleeves); otherwise fall back to the main area.
        [other]: d[productId][view].map((el) => {
          const from = placementFor(product, view, el.placement).rect;
          const target = placementFor(product, other, el.placement);
          const dx = target.rect.x + target.rect.w / 2 - (from.x + from.w / 2);
          const dy = target.rect.y + target.rect.h / 2 - (from.y + from.h / 2);
          return { ...el, id: uid(), placement: target.id, x: el.x + dx, y: el.y + dy };
        }),
      },
    }));
    setView(other);
    setSelectedId(null);
  }, [commitDesigns, product, productId, view]);

  const clearView = useCallback(() => {
    patchElements(() => []);
    setSelectedId(null);
  }, [patchElements]);

  const newDesign = useCallback(() => {
    setDesigns((d) => ({ ...d, [productId]: { front: [], back: [] } }));
    setSizes((s) => ({ ...s, [productId]: {} }));
    setSelectedId(null);
    setEditing(true);
    document.getElementById("studio")?.scrollIntoView({ behavior: "smooth" });
  }, [productId]);

  const setSize = useCallback(
    (label: string, value: number) => {
      setSizes((s) => ({ ...s, [productId]: { ...s[productId], [label]: value } }));
    },
    [productId],
  );

  const toolsProps = {
    product,
    onProductChange: (id: ProductId) => {
      setProductId(id);
      setSelectedId(null);
    },
    colorHex: color.hex,
    colorName: color.name,
    onColorChange: (hex: string, name: string) =>
      setColors((c) => ({ ...c, [productId]: { hex, name } })),
    artworks,
    uploading,
    onUploadFiles: handleUploadFiles,
    onAddArtwork: addArtworkToView,
    onAddSample: handleAddSample,
    onAddText: handleAddText,
    elements,
    view,
    selectedId,
    selected,
    onSelectElement: setSelectedId,
    onUpdateSelected: updateSelected,
    onDeleteSelected: deleteSelected,
    onDeleteElement: deleteElement,
    onDuplicateSelected: duplicateSelected,
    onFlipSelected: flipSelected,
    onResetSelected: resetSelected,
    onLayerMove: moveLayer,
    onCenterSelected: centerSelected,
    onFitSelected: fitSelected,
    onRemoveWhiteBackground: removeWhiteBackground,
    placements: product.placements[view],
    activePlacementId: activePlacement.id,
    onPlacementChange: selectPlacement,
    blend,
    onBlendChange: setBlend,
    onClearView: clearView,
  };

  return (
    <div className="mx-auto max-w-[1500px] px-3 sm:px-6">
      {/* section heading */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-teal-600">
            Design Studio
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            Build your design right here
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-600">
            Upload artwork, add text, pick colors, spin the garment — everything stays on this one
            page and updates live.
          </p>
          {savedAt && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-1 text-[11px] font-bold text-teal-700">
              <Check className="h-3 w-3" />
              Draft auto-saved
              {savedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </p>
          )}
        </div>
        <div className="hidden items-center gap-4 text-[11px] font-semibold text-ink-500 md:flex">
          <span className="inline-flex items-center gap-1.5">
            <MousePointer2 className="h-3.5 w-3.5 text-teal-500" /> Drag to move
          </span>
          <span className="inline-flex items-center gap-1.5">
            <RotateCw className="h-3.5 w-3.5 text-teal-500" /> Handles resize & rotate
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Ruler className="h-3.5 w-3.5 text-teal-500" /> Dashed box = print area
          </span>
        </div>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[300px_minmax(0,1fr)_360px]">
        {/* Desktop rail: a self-scrolling column so the whole studio fits the page. */}
        <aside className="hidden xl:sticky xl:top-28 xl:block xl:max-h-[calc(100vh-8.5rem)] xl:overflow-y-auto xl:thin-scroll xl:pr-1">
          <ToolsPanel {...toolsProps} />
        </aside>

        {/* live 2D / 3D stage stays pinned in view */}
        <div className="self-start xl:sticky xl:top-28">
          <div className="mb-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex rounded-full border border-ink-900/10 bg-white p-1 shadow-sm">
                {(["2d", "3d"] as ViewerMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setViewerMode(m);
                      setSelectedId(null);
                    }}
                    className={`relative rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide transition ${
                      viewerMode === m ? "text-white" : "text-ink-600 hover:text-ink-900"
                    }`}
                  >
                    {viewerMode === m && (
                      <motion.span
                        layoutId="viewer-mode-pill"
                        className="absolute inset-0 rounded-full bg-teal-600"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                      />
                    )}
                    <span className="relative z-10 inline-flex items-center gap-1.5">
                      {m === "2d" ? <Square className="h-3.5 w-3.5" /> : <Box className="h-3.5 w-3.5" />}
                      {m}
                    </span>
                  </button>
                ))}
              </div>

              <span className="hidden text-[11px] font-semibold text-ink-500 sm:inline">
                {viewerMode === "2d" ? "Precision editing" : "Drag to rotate · live front & back"}
              </span>

              {/* scene selector */}
              <div className="flex items-center gap-1.5 rounded-full border border-ink-900/10 bg-white px-2 py-1 shadow-sm">
                <span className="hidden pl-1 text-[10px] font-bold uppercase tracking-wider text-ink-500 lg:inline">
                  Scene
                </span>
                {STAGE_BACKDROPS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    title={`Backdrop: ${b.name}`}
                    aria-label={`Backdrop ${b.name}`}
                    onClick={() => setBackdropId(b.id)}
                    className={`h-5 w-5 rounded-full border transition ${
                      backdropId === b.id
                        ? "scale-110 border-ink-900 ring-2 ring-teal-500 ring-offset-1"
                        : "border-ink-900/20 hover:scale-105"
                    }`}
                    style={
                      b.image
                        ? { backgroundImage: `url(${b.image})`, backgroundSize: "cover" }
                        : { background: b.css }
                    }
                  />
                ))}
              </div>

              <div className="ml-auto flex items-center gap-1 rounded-full border border-ink-900/10 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={undo}
                  disabled={pastRef.current.length === 0}
                  title="Undo (Ctrl/Cmd + Z)"
                  className="grid h-8 w-8 place-items-center rounded-full text-ink-700 transition hover:bg-ink-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  data-history={historyTick}
                >
                  <Undo2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={redo}
                  disabled={futureRef.current.length === 0}
                  title="Redo (Shift + Ctrl/Cmd + Z)"
                  className="grid h-8 w-8 place-items-center rounded-full text-ink-700 transition hover:bg-ink-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Redo2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={downloadMockup}
                  disabled={downloading}
                  title="Download this view as an image"
                  className="grid h-8 w-8 place-items-center rounded-full text-ink-700 transition hover:bg-ink-900 hover:text-white disabled:opacity-40"
                >
                  {downloading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  title="Fullscreen stage"
                  className="grid h-8 w-8 place-items-center rounded-full text-ink-700 transition hover:bg-ink-900 hover:text-white"
                >
                  <Maximize className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex rounded-full border border-ink-900/10 bg-white p-1 shadow-sm">
                {(["front", "back"] as ViewSide[]).map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => {
                      setView(side);
                      setSelectedId(null);
                    }}
                    className={`relative rounded-full px-5 py-2 text-xs font-bold capitalize transition ${
                      view === side ? "text-white" : "text-ink-600 hover:text-ink-900"
                    }`}
                  >
                    {view === side && (
                      <motion.span
                        layoutId="view-pill"
                        className="absolute inset-0 rounded-full bg-ink-900"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                      />
                    )}
                    <span className="relative z-10 inline-flex items-center gap-1.5">
                      <FlipHorizontal2 className="h-3.5 w-3.5" />
                      {side}
                      {designs[productId][side].length > 0 && (
                        <span className="ml-1 grid h-4 w-4 place-items-center rounded-full bg-coral-500 text-[9px] font-black text-white">
                          {designs[productId][side].length}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={copyToOtherSide}
                disabled={elements.length === 0}
                title={`Copy all ${view} artwork to the ${view === "front" ? "back" : "front"}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink-900/10 bg-white px-3.5 py-2 text-xs font-bold text-ink-700 shadow-sm transition hover:border-teal-500 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <CopyPlus className="h-3.5 w-3.5" />
                Copy to {view === "front" ? "back" : "front"}
              </button>

              {viewerMode === "2d" && (
                <button
                  type="button"
                  onClick={() => setEditing((v) => !v)}
                  className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold shadow-sm transition ${
                    editing
                      ? "border-ink-900/10 bg-white text-ink-700 hover:text-ink-900"
                      : "border-teal-500 bg-teal-500/10 text-teal-700"
                  }`}
                >
                  {editing ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  {editing ? "Clean preview" : "Keep editing"}
                </button>
              )}
            </div>
          </div>

          {/* interactive print-location picker (sleeve / arm, chest, hood …) */}
          {viewerMode === "2d" && (
            <div className="mb-3 rounded-2xl border border-ink-900/10 bg-white p-2 shadow-sm">
              <div className="mb-1.5 flex items-center gap-2 px-1">
                <MapPin className="h-3.5 w-3.5 text-teal-500" />
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500">
                  Print location
                </p>
                <span className="ml-auto text-[10px] font-semibold text-ink-500">
                  {selected ? "Tap to move selected art" : "Tap to set where new art lands"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {product.placements[view].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectPlacement(p.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                      activePlacement.id === p.id
                        ? "bg-ink-900 text-sand-50 shadow-sm"
                        : "bg-sand-100 text-ink-600 hover:bg-ink-900/10"
                    }`}
                  >
                    {p.name}
                    {p.surcharge > 0 && (
                      <span
                        className={
                          activePlacement.id === p.id ? "text-teal-300" : "text-teal-600"
                        }
                      >
                        +{money(p.surcharge)}
                      </span>
                    )}
                    {elements.some((el) => el.placement === p.id) && (
                      <span className="h-1.5 w-1.5 rounded-full bg-coral-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <MockupStage
            product={product}
            view={view}
            onViewChange={(side) => {
              setView(side);
              setSelectedId(null);
            }}
            backdrop={backdropById(backdropId)}
            placementId={activePlacement.id}
            onPlacementSelect={selectPlacement}
            mode={viewerMode}
            colorHex={color.hex}
            blend={blend}
            editing={editing && viewerMode === "2d"}
            designs={designs[productId]}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onUpdate={updateElement}
          />

          <p className="mt-3 text-center text-[11px] font-medium text-ink-500">
            {viewerMode === "2d"
              ? "Drag to move · Handles to resize & rotate · Dashed box = print area · Tap a faded box for sleeve, hood or chest prints"
              : "Drag the garment left or right · use Auto for a live showroom spin"}
          </p>

          <a
            href="#quote"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-coral-500 px-5 py-3 text-sm font-bold text-white shadow-card transition hover:bg-coral-600 xl:hidden"
          >
            Continue to Quote
          </a>
        </div>

        {/* Mobile/tablet: the same accordion toolkit, still a single page. */}
        <div className="xl:hidden">
          <ToolsPanel {...toolsProps} />
        </div>

        {/* quote column — self-contained so the studio region always fits */}
        <div className="xl:sticky xl:top-28 xl:max-h-[calc(100vh-8.5rem)] xl:overflow-y-auto xl:thin-scroll xl:pr-1">
          <QuotePanel
            product={product}
            colorName={color.name}
            colorHex={color.hex}
            sizes={sizes[productId]}
            onSizeChange={setSize}
            designs={designs[productId]}
            artworks={artworks}
            blend={blend}
            onNewDesign={newDesign}
          />
        </div>
      </div>

      <p className="mt-10 text-center text-xs font-medium text-ink-500">
        Prefer to talk it through? Call{" "}
        <a href="tel:+18432793268" className="font-bold text-teal-600">
          (843) 279-3268
        </a>{" "}
        — or{" "}
        <a href="#" className="font-bold text-teal-600">
          head back to Coastal Custom Tees
        </a>
        .
      </p>
    </div>
  );
}
