"use client";

/**
 * Dual-mode realistic product viewer.
 *
 * 2D mode is the precision editing surface. 3D mode mounts independent front
 * and back garment faces in a CSS perspective scene, so customers can drag the
 * product, snap to either side, or enable an automatic showroom rotation.
 * Artwork remains live on both faces.
 */

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import {
  DESIGN_SPACE,
  placementFor,
  type ProductDef,
  type StageBackdrop,
  type ViewSide,
} from "@/config/catalog";
import { processMockup, type ProcessedMockup } from "@/lib/imaging";
import type { DesignElement, ProductDesign } from "@/lib/studio-types";

const CanvasEditor = dynamic(() => import("./CanvasEditor"), {
  ssr: false,
  loading: () => null,
});

export type ViewerMode = "2d" | "3d";

interface MockupStageProps {
  product: ProductDef;
  view: ViewSide;
  onViewChange: (side: ViewSide) => void;
  mode: ViewerMode;
  backdrop: StageBackdrop;
  placementId: string;
  onPlacementSelect: (id: string) => void;
  colorHex: string;
  blend: boolean;
  editing: boolean;
  designs: ProductDesign;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, patch: Partial<DesignElement>) => void;
}

interface GarmentFaceProps {
  side: ViewSide;
  product: ProductDef;
  mock: ProcessedMockup;
  size: number;
  colorHex: string;
  blend: boolean;
  elements: DesignElement[];
  editing: boolean;
  selectedId: string | null;
  placementId?: string;
  onPlacementSelect?: (id: string) => void;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, patch: Partial<DesignElement>) => void;
  shadow?: boolean;
}

function GarmentFace({
  side,
  product,
  mock,
  size,
  colorHex,
  blend,
  elements,
  editing,
  selectedId,
  placementId,
  onPlacementSelect,
  onSelect,
  onUpdate,
  shadow = false,
}: GarmentFaceProps) {
  return (
    <div className="absolute inset-0">
      {/* Garment — code-rendered silhouette so it always displays on every host. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mock.url}
        alt={`${product.name} ${side} live mockup`}
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ filter: shadow ? "drop-shadow(0 34px 25px rgba(11,39,50,0.24))" : "none" }}
      />

      {/* Isolated mockups can be recolored. Stock lifestyle photos stay faithful
          to their original colors so the model/background are never tinted. */}
      {colorHex.toLowerCase() !== "#ffffff" && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundColor: colorHex,
            mixBlendMode: "multiply",
            WebkitMaskImage: `url(${mock.url})`,
            maskImage: `url(${mock.url})`,
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
          }}
        />
      )}

      {/* Vivid is the default. Fabric blend is an optional proofing effect. */}
      <div
        className="absolute inset-0"
        style={{
          mixBlendMode: blend ? "multiply" : "normal",
          opacity: 1,
          filter: blend ? "none" : "saturate(1.08) contrast(1.035)",
        }}
      >
        {size > 0 && (
          <CanvasEditor
            size={size}
            elements={elements}
            selectedId={selectedId}
            editing={editing}
            printRect={placementFor(product, side, placementId).rect}
            zones={product.placements[side]}
            activeZoneId={placementFor(product, side, placementId).id}
            onZoneSelect={onPlacementSelect}
            onSelect={onSelect}
            onUpdate={onUpdate}
          />
        )}
      </div>
    </div>
  );
}

const normalizedAngle = (angle: number) => ((angle % 360) + 360) % 360;

export default function MockupStage({
  product,
  view,
  onViewChange,
  mode,
  backdrop,
  placementId,
  onPlacementSelect,
  colorHex,
  blend,
  editing,
  designs,
  selectedId,
  onSelect,
  onUpdate,
}: MockupStageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; angle: number } | null>(null);
  const [size, setSize] = useState(0);
  // Mocks are stored with the product they were processed for — no reset needed.
  const [loaded, setLoaded] = useState<{
    forId: string;
    mocks: Record<ViewSide, ProcessedMockup>;
  } | null>(null);
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const [angle, setAngle] = useState(0);
  const [tilt, setTilt] = useState(-2);
  const [autoRotate, setAutoRotate] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setSize(Math.round(w));
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const pairs = await Promise.all(
          (["front", "back"] as ViewSide[]).map(async (side) => [
            side,
            await processMockup(product.images[side], product.knockouts?.[side]),
          ] as const),
        );
        if (alive) {
          setLoaded({
            forId: product.id,
            mocks: Object.fromEntries(pairs) as Record<ViewSide, ProcessedMockup>,
          });
        }
      } catch {
        if (alive) setFailedFor(product.id);
      }
    })();
    return () => {
      alive = false;
    };
  }, [product]);

  const mocks: Partial<Record<ViewSide, ProcessedMockup>> =
    loaded && loaded.forId === product.id ? loaded.mocks : {};
  const failed = failedFor === product.id;

  // Product or front/back controls snap the 3D viewer to an exact readable face.
  useEffect(() => {
    if (mode !== "3d") return;
    const id = window.requestAnimationFrame(() => setAngle(view === "front" ? 0 : 180));
    return () => window.cancelAnimationFrame(id);
  }, [view, mode, product.id]);

  useEffect(() => {
    if (!autoRotate || mode !== "3d" || dragging) return;
    const timer = window.setInterval(() => setAngle((a) => a + 0.55), 20);
    return () => window.clearInterval(timer);
  }, [autoRotate, mode, dragging]);

  const visibleSide: ViewSide =
    normalizedAngle(angle) > 90 && normalizedAngle(angle) < 270 ? "back" : "front";
  const currentMock = mocks[view];
  const bothReady = Boolean(mocks.front && mocks.back);
  const currentPrint = product.print[view];

  const snapTo = (side: ViewSide) => {
    setAutoRotate(false);
    setAngle(side === "front" ? 0 : 180);
    onViewChange(side);
  };

  const finishDrag = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragging(false);
    const side: ViewSide =
      normalizedAngle(angle) > 90 && normalizedAngle(angle) < 270 ? "back" : "front";
    setAngle(side === "front" ? Math.round(angle / 360) * 360 : Math.round((angle - 180) / 360) * 360 + 180);
    onViewChange(side);
  };

  const sceneStyle: React.CSSProperties = backdrop.image
    ? {
        backgroundImage: `url(${backdrop.image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { background: backdrop.css };

  return (
    <div
      ref={wrapRef}
      id="studio-stage"
      className={`relative aspect-square w-full overflow-hidden rounded-3xl border border-ink-900/10 shadow-card select-none ${
        mode === "3d" ? "cursor-grab touch-none active:cursor-grabbing" : "touch-none"
      }`}
      style={sceneStyle}
      onPointerDown={(e) => {
        if (mode !== "3d") return;
        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current = { x: e.clientX, angle };
        setDragging(true);
        setAutoRotate(false);
      }}
      onPointerMove={(e) => {
        if (mode !== "3d" || !dragRef.current) return;
        const dx = e.clientX - dragRef.current.x;
        const rect = e.currentTarget.getBoundingClientRect();
        setAngle(dragRef.current.angle + (dx / Math.max(280, rect.width)) * 220);
        const dy = e.clientY - (rect.top + rect.height / 2);
        setTilt(Math.max(-9, Math.min(9, (dy / rect.height) * -16)));
      }}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onPointerLeave={() => {
        if (dragRef.current) finishDrag();
      }}
    >
      {/* soft light over photo scenes so the garment always reads clearly */}
      {backdrop.image && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: backdrop.textDark
              ? "radial-gradient(80% 60% at 50% 42%, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 60%, rgba(11,39,50,0.18) 100%)"
              : "radial-gradient(80% 60% at 50% 42%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.1) 100%)",
          }}
        />
      )}

      <AnimatePresence mode="wait">
        {mode === "2d" && currentMock ? (
          <motion.div
            key={`2d-${product.id}-${view}`}
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <GarmentFace
              side={view}
              product={product}
              mock={currentMock}
              size={size}
              colorHex={colorHex}
              blend={blend}
              elements={designs[view]}
              editing={editing}
              selectedId={selectedId}
              placementId={placementId}
              onPlacementSelect={onPlacementSelect}
              onSelect={onSelect}
              onUpdate={onUpdate}
              shadow
            />
          </motion.div>
        ) : mode === "3d" && bothReady ? (
          <motion.div
            key={`3d-${product.id}`}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-[5%]"
            style={{ perspective: "1250px" }}
          >
            <div
              aria-hidden
              className="absolute bottom-[8%] left-[20%] h-[7%] w-[60%] rounded-[50%] bg-ink-900/20 blur-xl"
              style={{ transform: `scaleX(${0.9 + Math.abs(Math.cos((angle * Math.PI) / 180)) * 0.1})` }}
            />
            <div
              className="absolute inset-0 will-change-transform"
              style={{
                transformStyle: "preserve-3d",
                transform: `rotateX(${tilt}deg) rotateY(${angle}deg)`,
                transition: dragging || autoRotate ? "none" : "transform 620ms cubic-bezier(.22,1,.36,1)",
              }}
            >
              <div
                className="absolute inset-0"
                style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "translateZ(1px)" }}
              >
                <GarmentFace
                  side="front"
                  product={product}
                  mock={mocks.front!}
                  size={Math.round(size * 0.9)}
                  colorHex={colorHex}
                  blend={blend}
                  elements={designs.front}
                  editing={false}
                  selectedId={null}
                  onSelect={() => undefined}
                  onUpdate={() => undefined}
                  shadow
                />
              </div>
              <div
                className="absolute inset-0"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg) translateZ(1px)",
                }}
              >
                <GarmentFace
                  side="back"
                  product={product}
                  mock={mocks.back!}
                  size={Math.round(size * 0.9)}
                  colorHex={colorHex}
                  blend={blend}
                  elements={designs.back}
                  editing={false}
                  selectedId={null}
                  onSelect={() => undefined}
                  onUpdate={() => undefined}
                  shadow
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="loading" className="absolute inset-0 grid place-items-center">
            <div className="flex flex-col items-center gap-3 text-ink-600">
              <Loader2 className="h-7 w-7 animate-spin text-teal-500" />
              <p className="text-xs font-semibold tracking-wide">
                {failed ? "Mockup failed to load — please retry" : "Preparing live garment…"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {mode === "2d" && editing && currentMock && (
        <span
          className="area-chip pointer-events-none absolute rounded-full bg-ink-900/80 px-2.5 py-1 font-bold uppercase text-teal-200 backdrop-blur"
          style={{
            left: `${(currentPrint.x / DESIGN_SPACE) * 100}%`,
            top: `${(currentPrint.y / DESIGN_SPACE) * 100}%`,
            transform: "translateY(calc(-100% - 8px))",
          }}
        >
          Print area
        </span>
      )}

      {/* top status chips */}
      <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-teal-700 shadow-sm backdrop-blur">
          <BadgeCheck className="h-3.5 w-3.5" /> Live artwork
        </span>
        {!blend && (
          <span className="rounded-full bg-coral-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-sm">
            Vivid color
          </span>
        )}
      </div>

      <span
        className={`pointer-events-none absolute right-3 top-3 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] backdrop-blur ${
          mode === "3d"
            ? "bg-ink-900/85 text-teal-200"
            : editing
              ? "bg-teal-500/90 text-white"
              : "bg-white/90 text-ink-700"
        }`}
      >
        {mode === "3d" ? `${visibleSide} · 3D` : editing ? "2D Editing" : "2D Preview"}
      </span>

      {/* in-scene 3D controls */}
      {mode === "3d" && bothReady && (
        <div
          className="absolute inset-x-3 bottom-3 flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-white/60 bg-white/82 p-2 shadow-card backdrop-blur-xl"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            title="Rotate left"
            onClick={() => {
              setAutoRotate(false);
              setAngle((a) => a - 35);
            }}
            className="grid h-8 w-8 place-items-center rounded-xl text-ink-700 transition hover:bg-ink-900 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => snapTo("front")}
            className={`rounded-xl px-3.5 py-2 text-[11px] font-black uppercase tracking-wider transition ${
              visibleSide === "front" ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-900/5"
            }`}
          >
            Front
          </button>
          <button
            type="button"
            onClick={() => snapTo("back")}
            className={`rounded-xl px-3.5 py-2 text-[11px] font-black uppercase tracking-wider transition ${
              visibleSide === "back" ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-900/5"
            }`}
          >
            Back
          </button>
          <button
            type="button"
            title={autoRotate ? "Pause rotation" : "Auto rotate"}
            onClick={() => setAutoRotate((v) => !v)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-xl px-3 text-[11px] font-bold transition ${
              autoRotate ? "bg-teal-500 text-white" : "text-ink-700 hover:bg-teal-500/10"
            }`}
          >
            {autoRotate ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            Auto
          </button>
          <button
            type="button"
            title="Rotate right"
            onClick={() => {
              setAutoRotate(false);
              setAngle((a) => a + 35);
            }}
            className="grid h-8 w-8 place-items-center rounded-xl text-ink-700 transition hover:bg-ink-900 hover:text-white"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
