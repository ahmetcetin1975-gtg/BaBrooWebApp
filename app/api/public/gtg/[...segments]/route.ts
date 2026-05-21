import { NextRequest, NextResponse } from "next/server";
import { resolveApiRoot } from "@/lib/server/proxy";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ segments: string[] }> }
) {
  const { segments } = await context.params;
  const targetPath = segments.join("/");
  const search = request.nextUrl.search;
  const targetUrl = `${resolveApiRoot(request.headers.get("host"))}/api/${targetPath}${search}`;

  const response = await fetch(targetUrl, {
    cache: "no-store",
    headers: {
      accept: request.headers.get("accept") ?? "application/json",
      ...(request.headers.get("accept-language")
        ? { "accept-language": request.headers.get("accept-language") as string }
        : {}),
    },
  });

  const body = await response.text();
  const contentType = response.headers.get("content-type") ?? "application/json; charset=utf-8";

  return new NextResponse(body, {
    status: response.status,
    headers: {
      "content-type": contentType,
      "cache-control": "no-store",
    },
  });
}
