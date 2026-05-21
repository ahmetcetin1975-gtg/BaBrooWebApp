import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";

function normalizeInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeBoolean(value: string | null): boolean | null {
  if (value == null) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "false" || normalized === "0") return false;
  if (normalized === "true" || normalized === "1") return true;
  return null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dil = normalizeInt(searchParams.get("dil"), 1);
  const page = Math.max(1, normalizeInt(searchParams.get("page"), 1));
  const pageSize = Math.max(1, normalizeInt(searchParams.get("pageSize"), 10));
  const aktif = normalizeBoolean(searchParams.get("aktif"));
  const searchRaw = searchParams.get("search");
  const pathBase = process.env.JOBS_FAVORITES_GET_PATH ?? "/api/musteri-fav-ilan/getall";

  const qp = new URLSearchParams({
    dil: String(dil),
    page: String(page),
    pageSize: String(pageSize),
  });
  if (searchRaw && searchRaw.trim() !== "") qp.set("search", searchRaw.trim());
  if (aktif != null) qp.set("aktif", String(aktif));

  const path = `${pathBase}?${qp.toString()}`;
  const { res, data } = await proxyJson({ path, method: "GET" });

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? "Failed to load favorite jobs", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}

