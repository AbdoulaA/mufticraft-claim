// src/lib/api.ts
const API_BASE =
  (import.meta as any).env?.VITE_API_BASE?.toString() ||
  "https://api.mufticraft.store";

const TOKEN_KEY = "mufticraft_jwt";

export type Me = {
  sub: string;
  username: string;
  uuid: string | null;
  role: "player" | "admin" | string;
  iat: number;
  exp: number;
};

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  // Try parse JSON either way
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text || "non-json response" };
  }

  if (!res.ok) {
    const msg = data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

export async function register(username: string, password: string) {
  return api<{
    ok: true;
    token: string;
    user: { id: string; username: string; uuid: string | null; role: string };
  }>("/api/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function login(username: string, password: string) {
  return api<{
    ok: true;
    token: string;
    user: { id: string; username: string; uuid: string | null; role: string };
  }>("/api/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function me() {
  return api<{ ok: true; me: Me }>("/api/me", { method: "GET" });
}
