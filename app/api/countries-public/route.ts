import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";

function normalizeDil(value: string | null): number {
  return value === "2" ? 2 : 1;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dil = normalizeDil(searchParams.get("dil"));

  const pathBase = process.env.COUNTRIES_PUBLIC_PATH ?? "/api/Main/GetUlkeler";
  const qp = new URLSearchParams({ dil: String(dil) });
  const path = `${pathBase}?${qp.toString()}`;
  const { res, data } = await proxyJson({ path, method: "GET", forwardAuth: false });

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? "Failed to load countries", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
