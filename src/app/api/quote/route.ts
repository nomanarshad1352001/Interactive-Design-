import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Demo quote intake (no database — per request).
 *
 * In production this endpoint forwards the payload to
 * coastalcustomtees@gmail.com with the original full-resolution artwork and
 * the rendered previews attached. Here it validates the payload, logs a
 * summary and returns a plausible confirmation.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  const customer = (body.customer ?? {}) as Record<string, unknown>;
  const name = String(customer.name ?? "").trim();
  const email = String(customer.email ?? "").trim();
  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "A valid name and email address are required." },
      { status: 422 },
    );
  }

  const totalPieces = Number(body.totalPieces ?? 0);
  if (!Number.isFinite(totalPieces) || totalPieces < 1) {
    return NextResponse.json(
      { ok: false, error: "Add at least one piece to your order." },
      { status: 422 },
    );
  }

  const previews = (body.previews ?? {}) as Record<string, string>;
  const previewBytes = Object.values(previews).reduce((acc, v) => acc + (v?.length ?? 0), 0);
  const artwork = Array.isArray(body.artwork) ? body.artwork.length : 0;

  const stamp = Date.now().toString(36).toUpperCase();
  const quoteId = `CCT-${new Date().getFullYear()}-${stamp.slice(-6)}`;

  console.log(
    `[quote] ${quoteId} · ${name} <${email}> · ${totalPieces} pcs · ` +
      `${artwork} artwork file(s) · previews ${(previewBytes / 1024).toFixed(0)} KB (demo mode, not emailed)`,
  );

  return NextResponse.json({
    ok: true,
    quoteId,
    eta: "1–2 business days",
    received: {
      totalPieces,
      artworkFiles: artwork,
      previewKB: Math.round(previewBytes / 1024),
    },
  });
}
