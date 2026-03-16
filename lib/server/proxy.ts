import { cookies, headers } from "next/headers";

type ProxyOptions = {
  path: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  forwardAuth?: boolean;
};

function apiRoot() {
  return (
    process.env.API_ROOT ||
    process.env.NEXT_PUBLIC_API_ROOT ||
    "https://apitest.gotradego.com"
  ).replace(/\/$/, "");
}

export async function proxyJson({ path, method = "POST", body, forwardAuth = true }: ProxyOptions) {
  const url = `${apiRoot()}${path.startsWith("/") ? "" : "/"}${path}`;
  const h = await headers();
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
