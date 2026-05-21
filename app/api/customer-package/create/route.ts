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

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const dil = normalizeDil(searchParams.get("dil"));
  const kaynak = normalizeKaynak(
    searchParams.get("kaynak") ?? process.env.CUSTOMER_PACKAGE_CREATE_KAYNAK ?? "2"
  );

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

  const paketNr = toFiniteNumber(body?.paketNr);
  const coin = toFiniteNumber(body?.coin);
  const fiyat = toFiniteNumber(body?.fiyat);
  const dovizNr = toFiniteNumber(body?.dovizNr);

  if (paketNr == null || coin == null || fiyat == null || dovizNr == null) {
    return NextResponse.json(
      { message: "paketNr, coin, fiyat and dovizNr are required" },
      { status: 400 }
    );
  }

  const pathBase = process.env.CUSTOMER_PACKAGE_CREATE_PATH ?? "/api/musteri-paket/create";
  const qp = new URLSearchParams({
    paketNr: String(paketNr),
    coin: String(coin),
    fiyat: String(fiyat),
    dovizNr: String(dovizNr),
    kaynak: String(kaynak),
    dil: String(dil),
  });
  const path = `${pathBase}?${qp.toString()}`;
  const { res, data } = await proxyJson({
    path,
    method: "POST",
    body: {},
  });

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? data?.Message ?? "Failed to create customer package", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
