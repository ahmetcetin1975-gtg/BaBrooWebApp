import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

function apiRoot() {
  return (
    process.env.API_ROOT ||
    process.env.NEXT_PUBLIC_API_ROOT ||
    "https://api.babroo.com"
  ).replace(/\/$/, "");
}

function parsePositiveInt(value: string | null): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function normalizeDil(value: string | null): number {
  const parsed = Number(value ?? 1);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? parsed : 1;
}

function normalizeKaynak(value: string | null): number {
  return value === "1" ? 1 : 2;
}

async function parseResponse(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

async function forwardRemoveFavorite(path: string, method: "GET" | "POST", authorization?: string, withJsonBody = false) {
  const h = await headers();
  const res = await fetch(`${apiRoot()}${path}`, {
    method,
    headers: {
      ...(authorization ? { Authorization: authorization } : {}),
      ...(h.get("accept-language") ? { "Accept-Language": h.get("accept-language")! } : {}),
      ...(withJsonBody ? { "Content-Type": "application/json" } : {}),
    },
    ...(method === "POST" && withJsonBody ? { body: JSON.stringify({}) } : {}),
  });

  return { res, data: await parseResponse(res) };
}

async function handleRemoveFavorite(req: Request) {
  const { searchParams } = new URL(req.url);
  const urunNr = parsePositiveInt(searchParams.get("urunNr"));
  const dil = normalizeDil(searchParams.get("dil"));
  const kaynak = normalizeKaynak(searchParams.get("kaynak") ?? process.env.PRODUCTS_FAVORITE_KAYNAK ?? "2");
  const h = await headers();
  const jar = await cookies();
  const inboundAuth = (h.get("authorization") ?? "").trim();
  const cookieAccess = (jar.get("gtg_access")?.value ?? "").trim();
  const authorization =
    inboundAuth !== "" ? inboundAuth : cookieAccess !== "" ? `Bearer ${cookieAccess}` : undefined;

  if (urunNr == null) {
    return NextResponse.json({ message: "Invalid urunNr" }, { status: 400 });
  }
  if (!authorization) {
    return NextResponse.json({ message: "Bearer token is required" }, { status: 401 });
  }

  const pathBase =
    process.env.PRODUCTS_FAVORITE_REMOVE_PATH ?? "/api/musteri-fav-urun/remove-favorite";
  const qp = new URLSearchParams({
    urunNr: String(urunNr),
    kaynak: String(kaynak),
    dil: String(dil),
  });
  const path = `${pathBase}?${qp.toString()}`;

  const attempts = [
    () => forwardRemoveFavorite(path, "POST", authorization, false),
    () => forwardRemoveFavorite(path, "POST", authorization, true),
    () => forwardRemoveFavorite(path, "GET", authorization, false),
  ] as const;

  let lastResult: { res: Response; data: any } | null = null;
  for (const attempt of attempts) {
    const result = await attempt();
    if (result.res.ok) {
      return NextResponse.json(result.data);
    }
    lastResult = result;
  }

  return NextResponse.json(
    {
      message: lastResult?.data?.message ?? lastResult?.data?.Message ?? "Failed to remove favorite product",
      ...lastResult?.data,
    },
    { status: lastResult?.res.status ?? 500 }
  );
}

export async function POST(req: Request) {
  return handleRemoveFavorite(req);
}

export async function GET(req: Request) {
  return handleRemoveFavorite(req);
}
