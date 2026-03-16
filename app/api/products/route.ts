import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";

function normalizeInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dil = normalizeInt(searchParams.get("dil"), 1);
  const pageSize = normalizeInt(searchParams.get("pageSize"), 4);
  const lastIdRaw = searchParams.get("lastId");
  const searchRaw = searchParams.get("search");
  const pathBase = process.env.PRODUCTS_GET_ALL_COMPILED_PATH ?? "/api/Urun/getallcompiled";

  const qp = new URLSearchParams({
    dil: String(dil),
    pageSize: String(pageSize),
  });
  if (searchRaw && searchRaw.trim() !== "") qp.set("search", searchRaw.trim());
  if (lastIdRaw && lastIdRaw.trim() !== "") qp.set("lastId", lastIdRaw);

  const path = `${pathBase}?${qp.toString()}`;
  const { res: r, data } = await proxyJson({ path, method: "GET" });

  if (!r.ok) {
    return NextResponse.json(
      { message: data?.message ?? "Failed to load products", ...data },
      { status: r.status }
    );
  }

  return NextResponse.json(data);
}
