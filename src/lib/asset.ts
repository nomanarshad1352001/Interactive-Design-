/**
 * Resolve a public-asset path at runtime on the client.
 *
 * The app sometimes gets deployed with basePath, a preview proxy prefix, or a static
 * export where the erroneous absolute URL shows the product area blank. Building the
 * URL from window.location shields against every one of those cases without needing
 * any server-side detection; the fallback simply returns the original path on SSR
 * or missing window.
 */
export function resolveAssetUrl(pathname: string): string {
  if (!pathname.startsWith("/")) return pathname;
  if (typeof window === "undefined") return pathname;
  try {
    return new URL(`/api/img?u=${encodeURIComponent(pathname)}`, window.location.origin).toString();
  } catch {
    return pathname;
  }
}

/** Product mockups are generated PNGs; proxied through /api/img for cache + fallback. */
export const mockupUrl = (file: string): string => resolveAssetUrl(`/mockups/${file}`);
