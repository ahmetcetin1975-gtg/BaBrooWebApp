import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";

function normalizeDil(value: string | null): number {
  const parsed = Number(value ?? 1);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? parsed : 1;
}

function normalizeKaynak(value: string | null): number {
  return value === "1" ? 1 : 2;
}

function sanitizeText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toPositiveInt(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const dil = normalizeDil(searchParams.get("dil"));
  const kaynak = normalizeKaynak(searchParams.get("kaynak") ?? process.env.SERVICE_OFFER_KAYNAK ?? "2");
  const h = await headers();
  const jar = await cookies();
  const hasBearerHeader = (h.get("authorization") ?? "").trim() !== "";
  const hasCookieToken = (jar.get("gtg_access")?.value ?? "").trim() !== "";

  if (!hasBearerHeader && !hasCookieToken) {
    return NextResponse.json({ message: "Bearer token is required" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const mesajHizmetNr = toPositiveInt(body?.mesajHizmetNr);
  const mesajMetin = sanitizeText(body?.mesajMetin);

  if (mesajHizmetNr == null || !mesajMetin.trim()) {
    return NextResponse.json({ message: "mesajHizmetNr and mesajMetin are required" }, { status: 400 });
  }

  const pathBase = process.env.SERVICE_OFFER_PATH ?? "/api/mesaj/HizmeteTeklifVer";
  const path = `${pathBase}?${new URLSearchParams({
    dil: String(dil),
    kaynak: String(kaynak),
  }).toString()}`;
  const { res, data } = await proxyJson({
    path,
    method: "POST",
    body: {
      mesajHizmetNr,
      mesajMetin,
    },
  });

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? data?.Message ?? "Failed to send service offer", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
