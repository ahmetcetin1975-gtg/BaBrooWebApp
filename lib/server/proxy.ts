import { cookies, headers } from "next/headers";
import { apiRoot } from "@/lib/api-root";

type ProxyOptions = {
  path: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  forwardAuth?: boolean;
};

export function resolveApiRoot(host: string | null) {
  const explicitRoot = apiRoot();
  const normalizedHost = String(host ?? "").trim().toLowerCase();
  const isLocalFrontend =
    normalizedHost.startsWith("localhost:") ||
    normalizedHost === "localhost" ||
    normalizedHost.startsWith("127.0.0.1:") ||
    normalizedHost === "127.0.0.1";
  const pointsToRemoteTestApi = /https?:\/\/apitest\.gotradego\.com\/?$/i.test(explicitRoot);

  if (isLocalFrontend && pointsToRemoteTestApi) {
    return "http://127.0.0.1:8081";
  }

  return explicitRoot;
}

export async function proxyJson({ path, method = "POST", body, forwardAuth = true }: ProxyOptions) {
  const h = await headers();
  const url = `${resolveApiRoot(h.get("host"))}${path.startsWith("/") ? "" : "/"}${path}`;
  const jar = await cookies();
  const inboundAuth = h.get("authorization");
  const cookieAccess = jar.get("gtg_access")?.value;
  const authorization =
    !forwardAuth
      ? undefined
      : inboundAuth && inboundAuth.trim() !== ""
      ? inboundAuth
      : cookieAccess
      ? `Bearer ${cookieAccess}`
      : undefined;

  const init: RequestInit = {
    method,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(authorization ? { Authorization: authorization } : {}),
      ...(h.get("accept-language") ? { "Accept-Language": h.get("accept-language")! } : {}),
    },
    ...(method !== "GET" ? { body: JSON.stringify(body ?? {}) } : {}),
  };

  const res = await fetch(url, init);
  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  return { res, data };
}
