import { NextRequest, NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";

function joinSegments(segments: string[]): string {
  return segments
    .map((segment) => String(segment ?? "").trim())
    .filter(Boolean)
    .join("/");
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ segments: string[] }> }
) {
  const { segments } = await context.params;
  const target = joinSegments(segments);
  if (!target) {
    return NextResponse.json({ message: "main path is required" }, { status: 400 });
  }

  const search = request.nextUrl.search;
  const path = `/api/Main/${target}${search}`;
  const { res, data } = await proxyJson({ path, method: "GET" });

  return NextResponse.json(data, { status: res.status });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ segments: string[] }> }
) {
  const { segments } = await context.params;
  const target = joinSegments(segments);
  if (!target) {
    return NextResponse.json({ message: "main path is required" }, { status: 400 });
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const search = request.nextUrl.search;
  const path = `/api/Main/${target}${search}`;
  const { res, data } = await proxyJson({ path, method: "POST", body });

  return NextResponse.json(data, { status: res.status });
}
