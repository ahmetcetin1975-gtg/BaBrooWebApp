import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";

function normalizeDil(value: string | null): number {
  return value === "2" ? 2 : 1;
}

function parseRequiredPositiveInt(value: string | null): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dil = normalizeDil(searchParams.get("dil"));
  const urunNr = parseRequiredPositiveInt(searchParams.get("urunNr"));
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

  const basePath = process.env.PRODUCTS_IMAGES_BASE_PATH ?? "/api/Urun/urun";
  const qp = new URLSearchParams({ dil: String(dil) });
  const path = `${basePath}/${urunNr}/resimler?${qp.toString()}`;
  const { res, data } = await proxyJson({ path, method: "GET" });

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? "Failed to load product images", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
