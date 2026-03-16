import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";

function parsePositiveInt(value: string | null): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function normalizeDil(value: string | null): number {
  return value === "2" ? 2 : 1;
}

function normalizeKaynak(value: string | null): number {
  return value === "2" ? 2 : 1;
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const urunNr = parsePositiveInt(searchParams.get("urunNr"));
  const dil = normalizeDil(searchParams.get("dil"));
  const kaynak = normalizeKaynak(searchParams.get("kaynak") ?? process.env.PRODUCTS_FAVORITE_KAYNAK ?? "1");
  const h = await headers();
  const jar = await cookies();
  const hasBearerHeader = (h.get("authorization") ?? "").trim() !== "";
  const hasCookieToken = (jar.get("gtg_access")?.value ?? "").trim() !== "";

  if (urunNr == null) {
    return NextResponse.json({ message: "Invalid urunNr" }, { status: 400 });
  }
  if (!hasBearerHeader && !hasCookieToken) {
    return NextResponse.json({ message: "Bearer token is required" }, { status: 401 });
  }

  const pathBase =
    process.env.PRODUCTS_FAVORITE_ADD_PATH ?? "/api/musteri-fav-urun/add-favorite";
  const qp = new URLSearchParams({
    urunNr: String(urunNr),
    kaynak: String(kaynak),
    dil: String(dil),
  });
  const path = `${pathBase}?${qp.toString()}`;
  const { res, data } = await proxyJson({ path, method: "POST", body: {} });

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? "Failed to add favorite product", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
