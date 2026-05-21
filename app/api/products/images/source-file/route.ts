import { NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set([
  "localhost/BabrooAdminNet",
  "localhost:8081",
  "admin.babroo.com",
  "api.babroo.com",
]);

function isAllowedHost(hostname: string) {
  return ALLOWED_HOSTS.has(hostname) || hostname.endsWith(".babroo.com");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawUrl = searchParams.get("url");

  if (!rawUrl) {
    return NextResponse.json({ message: "url is required" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    return NextResponse.json({ message: "invalid url" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(target.protocol) || !isAllowedHost(target.hostname)) {
    return NextResponse.json({ message: "url is not allowed" }, { status: 400 });
  }

  const upstream = await fetch(target.toString(), { cache: "no-store" });
  if (!upstream.ok) {
    return NextResponse.json(
      { message: `failed to fetch source file: ${upstream.status}` },
      { status: upstream.status }
    );
  }

  const arrayBuffer = await upstream.arrayBuffer();
  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "no-store",
    },
  });
}
