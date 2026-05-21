import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";

function normalizeDil(value: string | null): number {
  const parsed = Number(value ?? 1);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? parsed : 1;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dil = normalizeDil(searchParams.get("dil"));

  const pathBase = process.env.TERMS_PUBLIC_GET_ALL_PATH ?? "/api/Kosul/getallany";
  const qp = new URLSearchParams({ dil: String(dil) });
  const path = `${pathBase}?${qp.toString()}`;
  const { res, data } = await proxyJson({ path, method: "GET", forwardAuth: false });

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? "Failed to load terms and conditions", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
