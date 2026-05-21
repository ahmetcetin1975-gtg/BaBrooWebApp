import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";

function normalizeDil(value: string | null): number {
  const parsed = Number(value ?? 1);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? parsed : 1;
}

function toBackendDil(value: number): string {
  return ({ 1: "TR", 2: "EN", 3: "RU", 4: "ES", 5: "FR" } as Record<number, string>)[value] ?? "TR";
}

function normalizePageSize(value: string | null): number {
  const parsed = Number(value ?? 4);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 50 ? parsed : 4;
}

function normalizePositiveInt(value: string | null): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizePositiveIntList(values: string[]): number[] {
  const set = new Set<number>();
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed > 0) {
      set.add(parsed);
    }
  }
  return [...set];
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dil = normalizeDil(searchParams.get("dil"));
  const pageSize = normalizePageSize(searchParams.get("pageSize"));
  const lastId = normalizePositiveInt(searchParams.get("lastId"));
  const search = (searchParams.get("search") ?? "").trim();
  const ulke = normalizePositiveInt(searchParams.get("ulke"));
  const iller = normalizePositiveIntList(searchParams.getAll("il"));
  const hizmetGruplari = normalizePositiveIntList(searchParams.getAll("hizmetgrup"));
  const calismaSekilleri = normalizePositiveIntList(searchParams.getAll("calismasekil"));
  const h = await headers();
  const jar = await cookies();
  const hasBearerHeader = (h.get("authorization") ?? "").trim() !== "";
  const hasCookieToken = (jar.get("gtg_access")?.value ?? "").trim() !== "";

  if (!hasBearerHeader && !hasCookieToken) {
    return NextResponse.json({ message: "Bearer token is required" }, { status: 401 });
  }

  const pathBase = process.env.ILAN_GET_ALL_COMPILED_PATH ?? "/api/ilan/getallcompiled";
  const qp = new URLSearchParams({
    dil: toBackendDil(dil),
    pageSize: String(pageSize),
  });
  if (lastId != null) qp.set("lastId", String(lastId));
  if (search) qp.set("search", search);
  if (ulke != null) qp.set("ulke", String(ulke));
  for (const id of iller) qp.append("il", String(id));
  for (const id of hizmetGruplari) qp.append("hizmetgrup", String(id));
  for (const id of calismaSekilleri) qp.append("calismasekil", String(id));
  const path = `${pathBase}?${qp.toString()}`;
  const { res, data } = await proxyJson({ path, method: "GET" });

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? "Failed to load job posts", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
