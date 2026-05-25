import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

function apiRoot() {
  return (
    process.env.API_ROOT ||
    process.env.NEXT_PUBLIC_API_ROOT ||
    "https://api.babroo.com"
  ).replace(/\/$/, "");
}

function normalizeDil(value: string | null): number {
  const parsed = Number(value ?? 1);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? parsed : 1;
}

function normalizeKaynak(value: string | null): number {
  return value === "2" ? 2 : 1;
}

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

function isNewReplaceItemKey(key: string) {
  return /^ReplaceItems\[\d+\]\.(Id|File|IsDefault)$/.test(key);
}

function isNewAddItemKey(key: string) {
  return /^AddItems\[\d+\]\.(File|IsDefault)$/.test(key);
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const dil = normalizeDil(searchParams.get("dil"));
  const kaynak = normalizeKaynak(
    searchParams.get("kaynak") ?? process.env.SERVICES_IMAGES_SAVE_ALL_KAYNAK ?? "2"
  );
  const formData = await req.formData();
  const h = await headers();
  const jar = await cookies();
  const inboundAuth = h.get("authorization");
  const cookieAccess = jar.get("gtg_access")?.value;
  const authorization =
    inboundAuth && inboundAuth.trim() !== ""
      ? inboundAuth
      : cookieAccess
      ? `Bearer ${cookieAccess}`
      : undefined;

  if (!authorization) {
    return NextResponse.json({ message: "Bearer token is required" }, { status: 401 });
  }

  const outbound = new FormData();
  const entries = Array.from(formData.entries());
  const alreadyUsesNewShape = entries.some(([key]) => isNewReplaceItemKey(key) || isNewAddItemKey(key));

  if (alreadyUsesNewShape) {
    for (const [key, value] of entries) {
      if (value instanceof File) outbound.append(key, value, value.name);
      else outbound.append(key, value);
    }
  } else {
    const legacyIsDefault = formData.get("IsDefault") === "true";
    const addFiles = formData.getAll("AddFiles").filter((value): value is File => value instanceof File);
    const replaceItems = new Map<number, { id: string; file: File }>();

    for (const [key, value] of entries) {
      if (key === "AddFiles" || key === "IsDefault" || key === "FirstHizmetResimNr") {
        continue;
      }

      const replaceIdMatch = key.match(/^ReplaceItems\[(\d+)\]\.Id$/);
      if (replaceIdMatch) {
        const index = Number(replaceIdMatch[1]);
        const current = replaceItems.get(index) ?? { id: "", file: null as unknown as File };
        replaceItems.set(index, {
          ...current,
          id: String(value),
        });
        continue;
      }

      const replaceFileMatch = key.match(/^ReplaceItems\[(\d+)\]\.File$/);
      if (replaceFileMatch && value instanceof File) {
        const index = Number(replaceFileMatch[1]);
        const current = replaceItems.get(index) ?? { id: "", file: value };
        replaceItems.set(index, {
          ...current,
          file: value,
        });
        continue;
      }

      if (value instanceof File) outbound.append(key, value, value.name);
      else outbound.append(key, value);
    }

    Array.from(replaceItems.entries())
      .sort((left, right) => left[0] - right[0])
      .forEach(([index, item]) => {
        if (!item.id || !(item.file instanceof File)) return;
        outbound.append(`ReplaceItems[${index}].Id`, item.id);
        outbound.append(`ReplaceItems[${index}].File`, item.file, item.file.name);
        outbound.append(`ReplaceItems[${index}].IsDefault`, legacyIsDefault && addFiles.length === 0 && index === 0 ? "true" : "false");
      });

    addFiles.forEach((file, index) => {
      outbound.append(`AddItems[${index}].File`, file, file.name);
      outbound.append(`AddItems[${index}].IsDefault`, index === 0 ? "true" : "false");
    });
  }

  const pathBase = process.env.SERVICES_IMAGES_SAVE_ALL_PATH ?? "/api/hizmet-resim/save-all-web";
  const qp = new URLSearchParams({
    dil: String(dil),
    kaynak: String(kaynak),
  });
  const url = `${apiRoot()}${pathBase.startsWith("/") ? "" : "/"}${pathBase}?${qp.toString()}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authorization,
      ...(h.get("accept-language") ? { "Accept-Language": h.get("accept-language")! } : {}),
    },
    body: outbound,
  });

  const data = await safeJson(res);
  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? data?.Message ?? "Failed to save service images", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
