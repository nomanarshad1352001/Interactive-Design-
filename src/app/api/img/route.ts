import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_HOSTS = new Set([
  "images.pexels.com",
  "images.unsplash.com",
  "plus.unsplash.com",
]);

/**
 * Same-origin image proxy. Remote stock imagery is piped through here so the
 * designer canvas stays untainted (required for exporting preview PNGs).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const u = searchParams.get("u");
  if (!u) return NextResponse.json({ error: "Missing url." }, { status: 400 });

  let target: URL;
  try {
    target = new URL(u);
  } catch {
    return NextResponse.json({ error: "Bad url." }, { status: 400 });
  }
  if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname)) {
    return NextResponse.json({ error: "Host not allowed." }, { status: 403 });
  }

  const upstream = await fetch(target.toString(), {
    headers: { "User-Agent": "CoastalCustomTees-Studio/1.0" },
    next: { revalidate: 86400 },
  });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Upstream fetch failed." }, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
