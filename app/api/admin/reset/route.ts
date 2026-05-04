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
  return process.env.ADMIN_SERVER_CODE?.trim() || process.env.NEXT_PUBLIC_ADMIN_CONFIRM_CODE?.trim() || "";
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

async function loadProfiles() {
  const response = await serviceFetch("/user_profiles?select=email,role,status&order=email.asc");
  if (!response?.ok) return null;
  return (await response.json()) as ProfileRow[];
}

async function deleteUserData(email: string) {
  const [profileResponse, progressResponse, historyResponse, helpResponse] = await Promise.all([
    serviceMutate(`/user_profiles?email=eq.${encodeURIComponent(email)}`, { method: "DELETE" }),
    serviceMutate(`/user_progress?email=eq.${encodeURIComponent(email)}`, { method: "DELETE" }),
    serviceMutate(`/session_history?email=eq.${encodeURIComponent(email)}`, { method: "DELETE" }),
    serviceMutate(`/help_requests?email=eq.${encodeURIComponent(email)}`, { method: "DELETE" }),
  ]);

  return [profileResponse, progressResponse, historyResponse, helpResponse].every((response) => response?.ok ?? false);
}

export async function POST(request: NextRequest) {
  const serviceKey = getServiceRoleKey();
  if (!getSupabaseUrl() || !getSupabaseAnonKey() || !serviceKey) {
    return NextResponse.json({ ok: false, error: "Configuração administrativa incompleta." }, { status: 503 });
  }

  const authorized = await authorizeAdmin(request);
  if (!authorized) {
    return NextResponse.json({ ok: false, error: "Acesso administrativo não autorizado." }, { status: 403 });
  }

  const profiles = await loadProfiles();
  if (!profiles) {
    return NextResponse.json({ ok: false, error: "Não foi possível listar os usuários." }, { status: 500 });
  }

  const nonAdminEmails = profiles.filter((profile) => profile.role !== "admin").map((profile) => profile.email);
  const results = await Promise.all(nonAdminEmails.map((email) => deleteUserData(email)));

  if (results.some((result) => !result)) {
    return NextResponse.json({ ok: false, error: "Não foi possível zerar todos os usuários." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
