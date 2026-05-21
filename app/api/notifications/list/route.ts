import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";

function normalizeInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function hasAuthToken(): Promise<boolean> {
  const h = await headers();
  const jar = await cookies();
  const hasBearerHeader = (h.get("authorization") ?? "").trim() !== "";
  const hasCookieToken = (jar.get("gtg_access")?.value ?? "").trim() !== "";
  return hasBearerHeader || hasCookieToken;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dil = normalizeInt(searchParams.get("dil"), 1);
  const page = normalizeInt(searchParams.get("page"), 1);
  const pageSize = normalizeInt(searchParams.get("pageSize"), 10);

  if (!(await hasAuthToken())) {
    return NextResponse.json({ message: "Bearer token is required" }, { status: 401 });
  }

  const pathBase = process.env.NOTIFICATIONS_GET_ALL_PATH ?? "/api/bildirim/getall";
  const qp = new URLSearchParams({
    dil: String(dil),
    page: String(page),
    pageSize: String(pageSize),
  });
  const path = `${pathBase}?${qp.toString()}`;
  const { res, data } = await proxyJson({ path, method: "GET" });

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? "Failed to load notifications", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
