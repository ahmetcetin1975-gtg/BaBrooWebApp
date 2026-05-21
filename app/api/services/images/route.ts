import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";

function normalizeDil(value: string | null): number {
  const parsed = Number(value ?? 1);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? parsed : 1;
}

function parseRequiredPositiveInt(value: string | null): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dil = normalizeDil(searchParams.get("dil"));
  const hizmetNr = parseRequiredPositiveInt(searchParams.get("hizmetNr"));
  const h = await headers();
  const jar = await cookies();
  const hasBearerHeader = (h.get("authorization") ?? "").trim() !== "";
  const hasCookieToken = (jar.get("gtg_access")?.value ?? "").trim() !== "";

  if (hizmetNr == null) {
    return NextResponse.json({ message: "Invalid hizmetNr" }, { status: 400 });
  }
  if (!hasBearerHeader && !hasCookieToken) {
    return NextResponse.json({ message: "Bearer token is required" }, { status: 401 });
  }

  const basePath = process.env.SERVICES_IMAGES_BASE_PATH ?? "/api/Hizmet/hizmet";
  const qp = new URLSearchParams({ dil: String(dil) });
  const path = `${basePath}/${hizmetNr}/resimler?${qp.toString()}`;
  const { res, data } = await proxyJson({ path, method: "GET" });

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? "Failed to load service images", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
