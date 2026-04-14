import { NextRequest, NextResponse } from "next/server";

import type { UserRole, UserStatus } from "@/lib/types";

type ProfileRow = {
  email: string;
  role: UserRole;
  status: UserStatus;
};

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
}

function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";
}

function getServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
}

function isOpaqueSecretKey(key: string) {
  return key.startsWith("sb_secret_");
}

function getAdminServerCode() {
  return (
    process.env.ADMIN_SERVER_CODE?.trim() ||
    process.env.NEXT_PUBLIC_ADMIN_CONFIRM_CODE?.trim() ||
    ""
  );
}

async function serviceFetch(path: string) {
  const url = getSupabaseUrl();
  const serviceKey = getServiceRoleKey();
  if (!url || !serviceKey) return null;

  const headers: Record<string, string> = {
    apikey: serviceKey,
    "Content-Type": "application/json",
  };

  if (!isOpaqueSecretKey(serviceKey)) {
    headers.Authorization = `Bearer ${serviceKey}`;
  }

  return fetch(`${url}/rest/v1${path}`, {
    method: "GET",
    headers,
    cache: "no-store",
  });
}

async function serviceMutate(path: string, init: RequestInit) {
  const url = getSupabaseUrl();
  const serviceKey = getServiceRoleKey();
  if (!url || !serviceKey) return null;

  const headers: Record<string, string> = {
    apikey: serviceKey,
    "Content-Type": "application/json",
  };

  if (!isOpaqueSecretKey(serviceKey)) {
    headers.Authorization = `Bearer ${serviceKey}`;
  }

  const requestHeaders = new Headers(init.headers);
  requestHeaders.forEach((value, key) => {
    headers[key] = value;
  });

  return fetch(`${url}/rest/v1${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

async function loadUserFromToken(token: string) {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey || !token) return null;

  const response = await fetch(`${url}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) return null;
  const user = (await response.json()) as { email?: string } | null;
  return user?.email?.trim().toLowerCase() || null;
}

async function isAdminEmail(email: string) {
  const response = await serviceFetch(
    `/user_profiles?email=eq.${encodeURIComponent(email)}&select=email,role,status&limit=1`,
  );
  if (!response?.ok) return false;
  const rows = (await response.json()) as ProfileRow[];
  return rows[0]?.role === "admin" && rows[0]?.status === "ativo";
}

async function authorizeAdmin(request: NextRequest) {
  const code = request.headers.get("x-admin-code")?.trim() || "";
  const expectedCode = getAdminServerCode();
  if (expectedCode && code === expectedCode) return true;

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) return false;

  const email = await loadUserFromToken(token);
  if (!email) return false;
  return isAdminEmail(email);
}

async function loadTargetUser(email: string) {
  const response = await serviceFetch(
    `/user_profiles?email=eq.${encodeURIComponent(email)}&select=email,role,status&limit=1`,
  );
  if (!response?.ok) return null;
  const rows = (await response.json()) as ProfileRow[];
  return rows[0] ?? null;
}

export async function PATCH(request: NextRequest) {
  const serviceKey = getServiceRoleKey();
  if (!getSupabaseUrl() || !getSupabaseAnonKey() || !serviceKey) {
    return NextResponse.json({ ok: false, error: "Configuracao administrativa incompleta." }, { status: 503 });
  }

  const authorized = await authorizeAdmin(request);
  if (!authorized) {
    return NextResponse.json({ ok: false, error: "Acesso administrativo nao autorizado." }, { status: 403 });
  }

  const body = (await request.json()) as { email?: string; status?: UserStatus };
  if (!body.email || !body.status || !["ativo", "bloqueado", "excluido"].includes(body.status)) {
    return NextResponse.json({ ok: false, error: "Dados invalidos para atualizar o usuario." }, { status: 400 });
  }

  const target = await loadTargetUser(body.email);
  if (!target) {
    return NextResponse.json({ ok: false, error: "Usuario nao encontrado." }, { status: 404 });
  }

  if (target.role === "admin" && body.status !== "ativo") {
    return NextResponse.json({ ok: false, error: "Nao e permitido bloquear ou excluir uma conta admin." }, { status: 400 });
  }

  const profileUpdate = await serviceMutate(`/user_profiles?email=eq.${encodeURIComponent(body.email)}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      status: body.status,
      ...(body.status === "excluido" ? { premium: false, pontos: 0 } : {}),
    }),
  });

  if (!profileUpdate?.ok) {
    return NextResponse.json({ ok: false, error: "Nao foi possivel atualizar o usuario." }, { status: 500 });
  }

  if (body.status === "excluido") {
    await Promise.all([
      serviceMutate(`/user_progress?email=eq.${encodeURIComponent(body.email)}`, { method: "DELETE" }),
      serviceMutate(`/session_history?email=eq.${encodeURIComponent(body.email)}`, { method: "DELETE" }),
      serviceMutate(`/help_requests?email=eq.${encodeURIComponent(body.email)}`, { method: "DELETE" }),
    ]);
  }

  return NextResponse.json({ ok: true });
}
