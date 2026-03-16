"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api/client";

export type AppUser = {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  musteriNr?: number;
};

type AuthState = {
  user: AppUser | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshSession() {
    const res = await api.get<{ user: AppUser | null }>("/api/auth/session");
    setUser(res.user ?? null);
  }

  async function logout() {
    await api.post("/api/auth/refresh", { logout: true });
    setUser(null);
  }

  useEffect(() => {
    (async () => {
      try {
        await refreshSession();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const value = useMemo(() => ({ user, loading, refreshSession, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
