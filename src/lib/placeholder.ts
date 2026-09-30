/** Fallback garment artwork rendered client-side when the photo asset fails. */

import { loadHtmlImage } from "./imaging";
import { resolveAssetUrl } from "./asset";
import type { ProcessedMockup } from "./imaging";

/**
 * If a photo file is unreachable (common on fresh deployments where binary
 * assets didn't ship), draw a soft neutral garment panel scaled to the same
 * 1024 design space so the canvas still shows a product, a print area and a
 * garment color instead of a blank box.
 */
export function fallbackMockup(scale = 1024, label = "Product preview"): ProcessedMockup {
  const canvas = document.createElement("canvas");
  canvas.width = scale;
  canvas.height = scale;
  const ctx = canvas.getContext("2d")!;

  const g = ctx.createLinearGradient(0, 0, 0, scale);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(1, "#f3ecdd");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, scale, scale);

  // Garment-ish silhouette guide.
  ctx.strokeStyle = "rgba(11, 39, 50, 0.25)";
  ctx.lineWidth = 4;
  ctx.setLineDash([14, 12]);
  ctx.strokeRect(scale * 0.31, scale * 0.31, scale * 0.38, scale * 0.44);

  ctx.setLineDash([]);
  ctx.font = `600 ${scale * 0.032}px sans-serif`;
  ctx.fillStyle = "rgba(11,39,50,0.45)";
  ctx.textAlign = "center";
  ctx.fillText(label, scale / 2, scale * 0.5);
  ctx.font = `${scale * 0.024}px sans-serif`;
  ctx.fillStyle = "rgba(11,39,50,0.3)";
  ctx.fillText("Artwork renders here once the photo loads", scale / 2, scale * 0.56);

  return { url: canvas.toDataURL("image/png"), width: scale, height: scale };
}

/** Load a photo first; on any load / CORS / network failure, render the placeholder. */
export async function robustLoadImage(
  src: string,
  crossOrigin = true,
): Promise<HTMLImageElement> {
  const resolved = /^https?:\/\//.test(src) ? src : resolveAssetUrl(src);
  const mock = fallbackMockup();
  const load = async () => {
    try {
      return await loadHtmlImage(resolved, crossOrigin);
    } catch {
      try {
        return await loadHtmlImage(src, crossOrigin);
      } catch {
        return null;
      }
    }
  };
  const img = await load();
  if (img) return img;
  const placeholder = new Image();
  placeholder.src = mock.url;
  await placeholder.decode().catch(() => undefined);
  return placeholder;
}
