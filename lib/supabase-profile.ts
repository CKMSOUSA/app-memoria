"use client";

import type { Usuario, UserRole } from "@/lib/types";
import { getStoredSupabaseSession, hasSupabaseAuthConfig } from "@/lib/supabase-auth";

type SupabaseProfileRow = {
  id: string;
  email: string;
  nome: string;
  avatar: string;
  idade: number;
  role: UserRole;
  premium: boolean;
  pontos: number;
  criado_em: string;
};

type ProfilePayload = {
  email: string;
  nome: string;
  avatar: string;
  idade: number;
  role?: UserRole;
  premium?: boolean;
  pontos?: number;
};

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
}

function getSupabaseKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";
}

function toPublicUser(profile: SupabaseProfileRow): Usuario {
  return {
    nome: profile.nome,
    email: profile.email,
    avatar: profile.avatar,
    premium: profile.premium,
    pontos: profile.pontos,
    criadoEm: profile.criado_em,
    idade: profile.idade,
    role: profile.role,
  };
}

async function profileFetch(path: string, init?: RequestInit) {
  const session = getStoredSupabaseSession();
  if (!session?.access_token || !hasSupabaseAuthConfig()) return null;

  const headers = new Headers(init?.headers);
  headers.set("apikey", getSupabaseKey());
  headers.set("Authorization", `Bearer ${session.access_token}`);
  headers.set("Content-Type", "application/json");

  const response = await fetch(`${getSupabaseUrl()}/rest/v1${path}`, {
    ...init,
    headers,
  });

  return response;
}

export async function loadSupabaseProfileByEmail(email: string) {
  const response = await profileFetch(
    `/user_profiles?email=eq.${encodeURIComponent(email)}&select=id,email,nome,avatar,idade,role,premium,pontos,criado_em`,
    { method: "GET" },
  );

  if (!response?.ok) return null;
  const rows = (await response.json()) as SupabaseProfileRow[];
  return rows[0] ? toPublicUser(rows[0]) : null;
}

export async function upsertSupabaseProfile(payload: ProfilePayload) {
  const response = await profileFetch("/user_profiles", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify([
      {
        email: payload.email,
        nome: payload.nome,
        avatar: payload.avatar,
        idade: payload.idade,
        role: payload.role ?? "aluno",
        premium: payload.premium ?? false,
        pontos: payload.pontos ?? 0,
      },
    ]),
  });

  if (!response?.ok) return null;
  const rows = (await response.json()) as SupabaseProfileRow[];
  return rows[0] ? toPublicUser(rows[0]) : null;
}

export async function updateSupabaseProfile(
  email: string,
  payload: Partial<Pick<Usuario, "nome" | "avatar" | "idade" | "premium" | "pontos" | "role">>,
) {
  const response = await profileFetch(`/user_profiles?email=eq.${encodeURIComponent(email)}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      ...(payload.nome ? { nome: payload.nome } : {}),
      ...(payload.avatar ? { avatar: payload.avatar } : {}),
      ...(typeof payload.idade === "number" ? { idade: payload.idade } : {}),
      ...(typeof payload.premium === "boolean" ? { premium: payload.premium } : {}),
      ...(typeof payload.pontos === "number" ? { pontos: payload.pontos } : {}),
      ...(payload.role ? { role: payload.role } : {}),
    }),
  });

  if (!response?.ok) return null;
  const rows = (await response.json()) as SupabaseProfileRow[];
  return rows[0] ? toPublicUser(rows[0]) : null;
}
