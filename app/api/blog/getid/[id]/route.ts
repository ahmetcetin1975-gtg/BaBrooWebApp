import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";

function normalizeDil(value: string | null): number {
  const parsed = Number(value ?? 1);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? parsed : 1;
}

function parsePositiveInt(value: string): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const id = parsePositiveInt(resolvedParams.id);
  const { searchParams } = new URL(req.url);
  const dil = normalizeDil(searchParams.get("dil"));

  if (id == null) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }

  const pathBase = process.env.BLOG_GET_ID_PATH ?? "/api/Blog/getid";
  const path = `${pathBase}/${id}?${new URLSearchParams({ dil: String(dil) }).toString()}`;
  const result = await proxyJson({ path, method: "GET", forwardAuth: false }).catch(() => null);

  if (!result) {
    return NextResponse.json({ message: "Failed to load blog detail" }, { status: 502 });
  }

  const { res, data } = result;

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? "Failed to load blog detail", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
