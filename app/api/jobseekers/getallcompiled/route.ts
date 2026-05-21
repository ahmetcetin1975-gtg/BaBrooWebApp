import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";

function normalizeInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function resolveJobseekersApiRoot(): string {
  return (
    process.env.JOBSEEKERS_API_ROOT ||
    "http://localhost:8081"
  ).replace(/\/$/, "");
}

async function parseResponse(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dil = normalizeInt(searchParams.get("dil"), 1);
  const pageSize = Math.max(1, normalizeInt(searchParams.get("pageSize"), 4));
  const search = (searchParams.get("search") ?? "").trim();
  const lastIdRaw = searchParams.get("lastId");
  const pathBase = process.env.JOBSEEKERS_GET_ALL_COMPILED_PATH ?? "/api/Eleman/getallcompiled";

  const qp = new URLSearchParams({
    dil: String(dil),
    pageSize: String(pageSize),
  });
  if (search) qp.set("search", search);
  if (lastIdRaw && lastIdRaw.trim() !== "") qp.set("lastId", lastIdRaw.trim());

  const path = `${pathBase}?${qp.toString()}`;
  const h = await headers();
  const jar = await cookies();
  const inboundAuth = (h.get("authorization") ?? "").trim();
  const cookieAccess = (jar.get("gtg_access")?.value ?? "").trim();
  const authorization = inboundAuth !== "" ? inboundAuth : cookieAccess !== "" ? `Bearer ${cookieAccess}` : undefined;
  if (!authorization) {
    return NextResponse.json({ message: "Bearer token is required" }, { status: 401 });
  }
  const res = await fetch(`${resolveJobseekersApiRoot()}${path}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      ...(authorization ? { Authorization: authorization } : {}),
      ...(h.get("accept-language") ? { "Accept-Language": h.get("accept-language")! } : {}),
    },
  });
  const data = await parseResponse(res);

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? data?.Message ?? "Failed to load job seekers", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
