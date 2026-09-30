/**
 * Client-side imaging pipeline.
 *
 * 1. `processMockup` loads a garment photo shot on a white seamless background,
 *    flood-fills away the backdrop (interior highlights stay put), feathers the
 *    rim and returns a transparent square PNG. That PNG drives three live DOM
 *    layers: base photo → multiply-masked color tint → fabric blended design.
 * 2. `renderDesignPNG` rasterizes the Konva design layer (transparent PNG).
 * 3. `compositePreview` reproduces the same multiply stack on a 2D canvas so the
 *    quote email can carry a realistic finished-product preview.
 */

import { DESIGN_SPACE, type KnockoutRect } from "@/config/catalog";
import { resolveAssetUrl } from "./asset";
import { fallbackMockup } from "./placeholder";
import type { DesignElement } from "./studio-types";

export interface ProcessedMockup {
  url: string;
  width: number;
  height: number;
}

const mockupCache = new Map<string, Promise<ProcessedMockup>>();
const imgCache = new Map<string, Promise<HTMLImageElement>>();

export function loadHtmlImage(src: string, crossOrigin = true): Promise<HTMLImageElement> {
  const key = `${crossOrigin ? "cors" : "plain"}:${src}`;
  const hit = imgCache.get(key);
  if (hit) return hit;
  const url = /^https?:\/\//.test(src) || src.startsWith("data:") ? src : resolveAssetUrl(src);
  const p = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    if (crossOrigin && !src.startsWith("data:")) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load image: ${src.slice(0, 80)}`));
    img.src = url;
  });
  imgCache.set(key, p);
  return p.catch(async (err) => {
    // One retry on plain (non-CORS) before giving up — transient hosts fail often.
    if (!/^https?:\/\//.test(src) && !src.startsWith("data:")) {
      try {
        return await new Promise<HTMLImageElement>((res2, rej2) => {
          const img = new Image();
          img.onload = () => res2(img);
          img.onerror = rej2;
          img.src = src;
        });
      } catch {
        /* fall through */
      }
    }
    throw err;
  });
}

/** Remove the white studio backdrop via a border-seeded flood fill. */
function knockOutBackdrop(ctx: CanvasRenderingContext2D, size: number): readonly number[] {
  const image = ctx.getImageData(0, 0, size, size);
  const data = image.data;
  const px = (i: number) => [data[i], data[i + 1], data[i + 2]] as const;

  // Estimate the backdrop color from the frame's border pixels.
  let r = 0,
    g = 0,
    b = 0,
    n = 0;
  const borderIdx: number[] = [];
  for (let x = 0; x < size; x += 2) {
    borderIdx.push(x * 4, ((size - 1) * size + x) * 4);
  }
  for (let y = 0; y < size; y += 2) {
    borderIdx.push(y * size * 4, (y * size + size - 1) * 4);
  }
  for (const bi of borderIdx) {
    const [pr, pg, pb] = px(bi);
    r += pr;
    g += pg;
    b += pb;
    n++;
  }
  const bg = [r / n, g / n, b / n] as const;

  const dist = (i: number) => {
    const [pr, pg, pb] = px(i);
    const dr = pr - bg[0];
    const dg = pg - bg[1];
    const db = pb - bg[2];
    return Math.sqrt(dr * dr + dg * dg + db * db);
  };

  const TOL = 30;
  const SEED_TOL = 46;
  const visited = new Uint8Array(size * size);
  const stack: number[] = [];

  for (let x = 0; x < size; x++) {
    stack.push(x, (size - 1) * size + x);
  }
  for (let y = 0; y < size; y++) {
    stack.push(y * size, y * size + size - 1);
  }

  while (stack.length) {
    const p = stack.pop()!;
    if (visited[p]) continue;
    visited[p] = 1;
    const i = p * 4;
    const d = dist(i);
    const tol = p % size === 0 || p % size === size - 1 || p < size || p >= size * (size - 1) ? SEED_TOL : TOL;
    if (d > tol) continue;
    data[i + 3] = 0;
    const x = p % size;
    const y = (p / size) | 0;
    if (x > 0 && !visited[p - 1]) stack.push(p - 1);
    if (x < size - 1 && !visited[p + 1]) stack.push(p + 1);
    if (y > 0 && !visited[p - size]) stack.push(p - size);
    if (y < size - 1 && !visited[p + size]) stack.push(p + size);
  }
  ctx.putImageData(image, 0, 0);
  return bg;
}

/** Force-clear enclosed white regions (e.g. inside tote handles). */
function applyKnockouts(
  ctx: CanvasRenderingContext2D,
  size: number,
  bg: readonly number[],
  knockouts: KnockoutRect[],
) {
  for (const win of knockouts) {
    const x0 = Math.max(0, Math.floor(win.x));
    const y0 = Math.max(0, Math.floor(win.y));
    const x1 = Math.min(size, Math.ceil(win.x + win.w));
    const y1 = Math.min(size, Math.ceil(win.y + win.h));
    if (x1 <= x0 || y1 <= y0) continue;
    const image = ctx.getImageData(x0, y0, x1 - x0, y1 - y0);
    const data = image.data;
    for (let i = 0; i < data.length; i += 4) {
      const dr = data[i] - bg[0];
      const dg = data[i + 1] - bg[1];
      const db = data[i + 2] - bg[2];
      if (Math.sqrt(dr * dr + dg * dg + db * db) < win.tol) data[i + 3] = 0;
    }
    ctx.putImageData(image, x0, y0);
  }
}

/** One-radius box blur on the alpha channel to soften the cut-out rim. */
function featherAlpha(ctx: CanvasRenderingContext2D, size: number) {
  const image = ctx.getImageData(0, 0, size, size);
  const src = new Uint8ClampedArray(image.data);
  const out = image.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= size) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= size) continue;
          sum += src[(yy * size + xx) * 4 + 3];
          count++;
        }
      }
      const i = (y * size + x) * 4;
      const a = sum / count;
      // Only soften; never resurrect removed pixels fully.
      out[i + 3] = Math.min(src[i + 3] === 0 ? a * 0.35 : 255, a);
    }
  }
  ctx.putImageData(image, 0, 0);
}

export function processMockup(src: string, knockouts?: KnockoutRect[]): Promise<ProcessedMockup> {
  const key = `${src}::${JSON.stringify(knockouts ?? [])}`;
  const hit = mockupCache.get(key);
  if (hit) return hit;
  const p = (async (): Promise<ProcessedMockup> => {
    // Load with real canvas safety; if the source fails (e.g. asset not deployed),
    // fall back to a rendered placeholder so the product area is never blank.
    let img: HTMLImageElement;
    try {
      img = await loadHtmlImage(src);
    } catch {
      img = await loadHtmlImage(fallbackMockup().url, false);
    }
    const S = DESIGN_SPACE;
    const canvas = document.createElement("canvas");
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    const scale = Math.min(S / img.naturalWidth, S / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
    const bg = knockOutBackdrop(ctx, S);
    if (knockouts?.length) applyKnockouts(ctx, S, bg, knockouts);
    featherAlpha(ctx, S);
    return { url: canvas.toDataURL("image/png"), width: S, height: S };
  })();
  mockupCache.set(key, p);
  return p;
}

/** Rasterize the design layer to a transparent PNG using an off-DOM Konva stage. */
export async function renderDesignPNG(elements: DesignElement[], size = DESIGN_SPACE): Promise<string> {
  const { default: Konva } = await import("konva");
  const holder = document.createElement("div");
  holder.style.cssText = "position:fixed;left:-99999px;top:0;width:1px;height:1px;overflow:hidden;";
  document.body.appendChild(holder);
  try {
    await document.fonts.ready;
    const stage = new Konva.Stage({ container: holder, width: size, height: size });
    const layer = new Konva.Layer();
    stage.add(layer);
    for (const el of elements) {
      if (el.kind === "image") {
        const img = await loadHtmlImage(el.src);
        layer.add(
          new Konva.Image({
            image: img,
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height,
            scaleX: el.scaleX,
            scaleY: el.scaleY,
            rotation: el.rotation,
          }),
        );
      } else {
        layer.add(
          new Konva.Text({
            x: el.x,
            y: el.y,
            text: el.text,
            fontSize: el.fontSize,
            fontFamily: el.fontFamily,
            fontStyle: el.fontStyle,
            fill: el.fill,
            letterSpacing: el.letterSpacing,
            stroke: el.stroke,
            strokeWidth: el.strokeWidth,
            scaleX: el.scaleX,
            scaleY: el.scaleY,
            rotation: el.rotation,
            opacity: el.opacity,
          }),
        );
      }
    }
    layer.draw();
    const url = stage.toDataURL({ mimeType: "image/png", pixelRatio: 1 });
    stage.destroy();
    return url;
  } finally {
    holder.remove();
  }
}

/**
 * Rebuild the live multiply stack on a flat canvas for the quote attachment.
 * Returns a JPEG data URL on a soft studio backdrop.
 */
export async function compositePreview(
  mockup: ProcessedMockup,
  colorHex: string,
  designPng: string | null,
  fabricBlend = false,
  outSize = 900,
): Promise<string> {
  const base = await loadHtmlImage(mockup.url, false);
  const canvas = document.createElement("canvas");
  canvas.width = outSize;
  canvas.height = outSize;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#f1ece2";
  ctx.fillRect(0, 0, outSize, outSize);
  ctx.drawImage(base, 0, 0, outSize, outSize);

  if (colorHex.toLowerCase() !== "#ffffff") {
    const tint = document.createElement("canvas");
    tint.width = outSize;
    tint.height = outSize;
    const tctx = tint.getContext("2d")!;
    tctx.fillStyle = colorHex;
    tctx.fillRect(0, 0, outSize, outSize);
    tctx.globalCompositeOperation = "destination-in";
    tctx.drawImage(base, 0, 0, outSize, outSize);
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(tint, 0, 0);
    ctx.globalCompositeOperation = "source-over";
  }

  if (designPng) {
    const design = await loadHtmlImage(designPng, false);
    // Vivid is the default: artwork stays bright and color-accurate. Customers
    // can opt into a softer multiply blend when they want a fabric-ink preview.
    ctx.globalCompositeOperation = fabricBlend ? "multiply" : "source-over";
    ctx.drawImage(design, 0, 0, outSize, outSize);
    ctx.globalCompositeOperation = "source-over";
  }

  return canvas.toDataURL("image/jpeg", 0.92);
}
