import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";

function normalizeInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeBoolean(value: string | null, fallback: boolean): boolean {
  if (value == null) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === "false" || normalized === "0") return false;
  if (normalized === "true" || normalized === "1") return true;
  return fallback;
}

function normalizeLastId(value: string | null): string | null {
  if (value == null) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "" || normalized === "null" || normalized === "undefined") return null;
  return value.trim();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dil = normalizeInt(searchParams.get("dil"), 1);
  const pageSize = normalizeInt(searchParams.get("pageSize"), 6);
  const aktif = normalizeBoolean(searchParams.get("aktif"), true);
  const lastId = normalizeLastId(searchParams.get("lastId"));
  const searchRaw = searchParams.get("search");
  const pathBase =
    process.env.SERVICES_GET_FAVORITES_COMPILED_PATH ?? "/api/musteri-fav-hizmet/getall-compiled-web";

  const qp = new URLSearchParams({
    dil: String(dil),
    aktif: String(aktif),
    pageSize: String(pageSize),
  });
  if (searchRaw && searchRaw.trim() !== "") qp.set("search", searchRaw.trim());
  if (lastId != null) qp.set("lastId", lastId);

  const path = `${pathBase}?${qp.toString()}`;
  const { res, data } = await proxyJson({ path, method: "GET" });

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? "Failed to load favorite services", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
