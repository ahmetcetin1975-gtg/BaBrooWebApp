import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";

function normalizeInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function resolveJobseekersApiRoot(): string {
  return (process.env.JOBSEEKERS_API_ROOT || "https://api.babroo.com").replace(/\/$/, "");
}

async function parseResponse(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ nr: string }> }) {
  const { searchParams } = new URL(req.url);
  const { nr } = await params;
  const seekerNr = normalizeInt(nr, 0);
  if (!Number.isInteger(seekerNr) || seekerNr <= 0) {
    return NextResponse.json({ message: "Invalid job seeker id" }, { status: 400 });
  }

  const dil = normalizeInt(searchParams.get("dil"), 1);
  const pathBase = process.env.JOBSEEKERS_GET_ID_PATH ?? "/api/Eleman/getid";
  const path = `${pathBase}/${seekerNr}?dil=${dil}`;

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
      Authorization: authorization,
      ...(h.get("accept-language") ? { "Accept-Language": h.get("accept-language")! } : {}),
    },
  });

  const data = await parseResponse(res);
  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? data?.Message ?? "Failed to load job seeker detail", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
