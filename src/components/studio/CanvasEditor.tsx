"use client";

/**
 * Interactive design canvas (Konva).
 *
 * The stage renders in a fixed 1024×1024 virtual coordinate space; the stage
 * itself scales to the measured container size, so every element position is
 * resolution-independent and can be re-rendered at export time.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Konva from "konva";
import {
  Stage,
  Layer,
  Group,
  Rect,
  Image as KonvaImage,
  Text as KonvaText,
  Transformer,
} from "react-konva";
import { DESIGN_SPACE, type PlacementDef, type PrintRect } from "@/config/catalog";
import { loadHtmlImage } from "@/lib/imaging";
import { ensureFontLoaded } from "@/lib/fonts";
import type { DesignElement } from "@/lib/studio-types";

interface CanvasEditorProps {
  size: number; // measured container px
  elements: DesignElement[];
  selectedId: string | null;
  editing: boolean;
  printRect: PrintRect;
  /** All print locations on this garment side (chest, sleeves, hood, …). */
  zones?: PlacementDef[];
  activeZoneId?: string;
  onZoneSelect?: (id: string) => void;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, patch: Partial<DesignElement>) => void;
}

function DesignImage({
  el,
  editing,
  k,
  printRect,
  onSelect,
  onUpdate,
  shapeRefs,
}: {
  el: Extract<DesignElement, { kind: "image" }>;
  editing: boolean;
  k: number;
  printRect: PrintRect;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<DesignElement>) => void;
  shapeRefs: React.MutableRefObject<Map<string, Konva.Node>>;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    let alive = true;
    setImg(null);
    loadHtmlImage(el.src).then((loaded) => {
      if (alive) setImg(loaded);
    });
    return () => {
      alive = false;
    };
  }, [el.src]);

  if (!img) return null;

  return (
    <KonvaImage
      image={img}
      ref={(node) => {
        if (node) shapeRefs.current.set(el.id, node);
        else shapeRefs.current.delete(el.id);
      }}
      x={el.x}
      y={el.y}
      width={el.width}
      height={el.height}
      scaleX={el.scaleX}
      scaleY={el.scaleY}
      rotation={el.rotation}
      opacity={el.opacity}
      draggable={editing}
      listening={editing}
      onMouseDown={() => onSelect(el.id)}
      onTouchStart={() => onSelect(el.id)}
      onDragStart={() => onSelect(el.id)}
      onDragEnd={(e) => onUpdate(el.id, { x: e.target.x(), y: e.target.y() })}
      onTransformEnd={(e) => {
        const n = e.target;
        onUpdate(el.id, {
          x: n.x(),
          y: n.y(),
          scaleX: n.scaleX(),
          scaleY: n.scaleY(),
          rotation: n.rotation(),
        });
      }}
      dragBoundFunc={function (this: Konva.Node, pos) {
        const w = Math.abs(this.width() * this.scaleX() * k);
        const h = Math.abs(this.height() * this.scaleY() * k);
        const pr = { x: printRect.x * k, y: printRect.y * k, w: printRect.w * k, h: printRect.h * k };
        return {
          x: Math.min(Math.max(pos.x, pr.x - w * 0.6), pr.x + pr.w - w * 0.35),
          y: Math.min(Math.max(pos.y, pr.y - h * 0.6), pr.y + pr.h - h * 0.35),
        };
      }}
    />
  );
}

export default function CanvasEditor({
  size,
  elements,
  selectedId,
  editing,
  printRect,
  zones = [],
  activeZoneId,
  onZoneSelect,
  onSelect,
  onUpdate,
}: CanvasEditorProps) {
  const k = size / DESIGN_SPACE;
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const shapeRefs = useRef(new Map<string, Konva.Node>());
  const [fontTick, setFontTick] = useState(0);

  // Warm up any fonts referenced by text elements so Konva measures correctly.
  useEffect(() => {
    elements.forEach((el) => {
      if (el.kind === "text") {
        ensureFontLoaded(el.fontFamily).then(() => setFontTick((t) => t + 1));
      }
    });
  }, [elements]);

  // Bind the transformer to the selected node.
  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const node = selectedId && editing ? shapeRefs.current.get(selectedId) : undefined;
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [selectedId, editing, elements, size, fontTick]);

  /** Each element is constrained to the zone it was assigned to. */
  const rectFor = useCallback(
    (el: DesignElement): PrintRect =>
      zones.find((z) => z.id === el.placement)?.rect ?? printRect,
    [zones, printRect],
  );

  const boundBox = useCallback(
    (oldBox: Konva.Box, newBox: Konva.Box) => {
      if (newBox.width < 28 * k || newBox.height < 28 * k) return oldBox;
      if (newBox.width > printRect.w * k * 1.8 || newBox.height > printRect.h * k * 1.8) {
        return oldBox;
      }
      return newBox;
    },
    [k, printRect],
  );

  return (
    <Stage
      ref={stageRef}
      width={size}
      height={size}
      scale={{ x: k, y: k }}
      className="absolute inset-0"
      onMouseDown={(e) => {
        if (e.target === e.target.getStage()) onSelect(null);
      }}
      onTouchStart={(e) => {
        if (e.target === e.target.getStage()) onSelect(null);
      }}
    >
      <Layer>
        {/* Inactive print locations: tap one to send the selected logo there. */}
        {editing &&
          zones
            .filter((z) => z.id !== activeZoneId)
            .map((z) => (
              <Group
                key={z.id}
                onMouseDown={() => onZoneSelect?.(z.id)}
                onTouchStart={() => onZoneSelect?.(z.id)}
              >
                <Rect
                  x={z.rect.x}
                  y={z.rect.y}
                  width={z.rect.w}
                  height={z.rect.h}
                  cornerRadius={12}
                  stroke="rgba(11,39,50,0.32)"
                  strokeWidth={1.5}
                  strokeScaleEnabled={false}
                  dash={[8, 8]}
                  fill="rgba(255,255,255,0.03)"
                />
                <KonvaText
                  x={z.rect.x}
                  y={z.rect.y + 7}
                  width={z.rect.w}
                  align="center"
                  text={z.short.toUpperCase()}
                  fontSize={17}
                  fontStyle="bold"
                  fontFamily="DM Sans, sans-serif"
                  fill="rgba(11,39,50,0.5)"
                  listening={false}
                />
              </Group>
            ))}

        {editing && (
          <Rect
            x={printRect.x}
            y={printRect.y}
            width={printRect.w}
            height={printRect.h}
            cornerRadius={14}
            stroke="rgba(14,125,134,0.85)"
            strokeWidth={2.5}
            strokeScaleEnabled={false}
            dash={[12, 9]}
            fill="rgba(14,125,134,0.05)"
            listening={false}
          />
        )}

        {elements.map((el) =>
          el.kind === "image" ? (
            <DesignImage
              key={el.id}
              el={el}
              editing={editing}
              k={k}
              printRect={rectFor(el)}
              onSelect={onSelect}
              onUpdate={onUpdate}
              shapeRefs={shapeRefs}
            />
          ) : (
            <KonvaText
              key={`${el.id}-${fontTick}`}
              ref={(node) => {
                if (node) shapeRefs.current.set(el.id, node);
                else shapeRefs.current.delete(el.id);
              }}
              x={el.x}
              y={el.y}
              text={el.text}
              fontSize={el.fontSize}
              fontFamily={el.fontFamily}
              fontStyle={el.fontStyle}
              fill={el.fill}
              letterSpacing={el.letterSpacing}
              stroke={el.stroke}
              strokeWidth={el.strokeWidth}
              strokeScaleEnabled={false}
              opacity={el.opacity}
              scaleX={el.scaleX}
              scaleY={el.scaleY}
              rotation={el.rotation}
              draggable={editing}
              listening={editing}
              onMouseDown={() => onSelect(el.id)}
              onTouchStart={() => onSelect(el.id)}
              onDragStart={() => onSelect(el.id)}
              onDragEnd={(e) => onUpdate(el.id, { x: e.target.x(), y: e.target.y() })}
              onTransformEnd={(e) => {
                const n = e.target;
                onUpdate(el.id, {
                  x: n.x(),
                  y: n.y(),
                  scaleX: n.scaleX(),
                  scaleY: n.scaleY(),
                  rotation: n.rotation(),
                });
              }}
              dragBoundFunc={function (this: Konva.Node, pos) {
                const zone = rectFor(el);
                const w = Math.abs(this.width() * this.scaleX() * k);
                const h = Math.abs(this.height() * this.scaleY() * k);
                const pr = {
                  x: zone.x * k,
                  y: zone.y * k,
                  w: zone.w * k,
                  h: zone.h * k,
                };
                return {
                  x: Math.min(Math.max(pos.x, pr.x - w * 0.6), pr.x + pr.w - w * 0.35),
                  y: Math.min(Math.max(pos.y, pr.y - h * 0.6), pr.y + pr.h - h * 0.35),
                };
              }}
            />
          ),
        )}

        <Transformer
          ref={trRef}
          rotateEnabled
          flipEnabled={false}
          keepRatio
          enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
          anchorSize={12}
          anchorCornerRadius={6}
          anchorStroke="#0e7d86"
          anchorFill="#ffffff"
          anchorStrokeWidth={1.5}
          borderStroke="#0e7d86"
          borderStrokeWidth={1.5}
          rotateAnchorOffset={30}
          padding={3}
          boundBoxFunc={boundBox}
          ignoreStroke
        />
      </Layer>
    </Stage>
  );
}
