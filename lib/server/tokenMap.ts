type AnyObj = Record<string, any>;

function pick(root: AnyObj | undefined, keys: string[]): any {
  if (!root) return undefined;
  for (const key of keys) {
    const value = root[key];
    if (value != null && value !== "") return value;
  }
  return undefined;
}

export function extractTokens(data: any): { access?: string; refresh?: string } {
  const roots: Array<AnyObj | undefined> = [
    data,
    data?.data,
    data?.Data,
    data?.result,
    data?.Result,
  ];

  const accessKeys = [
    "Token",
    "AccessToken",
    "accessToken",
    "access_token",
    "token",
    "access",
    "jwt",
    "Jwt",
  ];

  const refreshKeys = [
    "RefreshToken",
    "refreshToken",
    "refresh_token",
    "refresh",
  ];

  let access: any;
  let refresh: any;

  for (const root of roots) {
    access ??= pick(root, accessKeys);
    refresh ??= pick(root, refreshKeys);
    if (access && refresh) break;
  }

  return {
    access: access ? String(access) : undefined,
    refresh: refresh ? String(refresh) : undefined,
  };
}
