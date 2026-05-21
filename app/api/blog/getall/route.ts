import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";

function normalizeDil(value: string | null): number {
  const parsed = Number(value ?? 1);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? parsed : 1;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dil = normalizeDil(searchParams.get("dil"));
  const pathBase = process.env.BLOG_GET_ALL_PATH ?? "/api/Blog/getall";
  const path = `${pathBase}?${new URLSearchParams({ dil: String(dil) }).toString()}`;
  const result = await proxyJson({ path, method: "GET", forwardAuth: false }).catch(() => null);

  if (!result) {
    return NextResponse.json({ message: "Failed to load blogs" }, { status: 502 });
  }

  const { res, data } = result;

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? "Failed to load blogs", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
