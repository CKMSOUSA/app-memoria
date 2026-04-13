"use client";

const SUPABASE_SESSION_KEY = "app_memoria_supabase_session_v1";

type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

type SupabaseSession = {
  access_token: string;
  refresh_token?: string;
  user: SupabaseUser;
};

type SupabaseAuthResponse = {
  user?: SupabaseUser | null;
  session?: SupabaseSession | null;
  error_description?: string;
  msg?: string;
};

function canUseStorage() {
  return typeof window !== "undefined";
}

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
}

function getSupabaseKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";
}

export function hasSupabaseAuthConfig() {
  return Boolean(getSupabaseUrl()) && Boolean(getSupabaseKey());
}

async function supabaseFetch(path: string, init: RequestInit) {
  const url = `${getSupabaseUrl()}/auth/v1${path}`;
  const headers = new Headers(init.headers);
  headers.set("apikey", getSupabaseKey());

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, {
    ...init,
    headers,
  });
}

function readStoredSession() {
  if (!canUseStorage()) return null;
  const raw = localStorage.getItem(SUPABASE_SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SupabaseSession;
  } catch {
    return null;
  }
}

function writeStoredSession(session: SupabaseSession | null) {
  if (!canUseStorage()) return;

  if (!session) {
    localStorage.removeItem(SUPABASE_SESSION_KEY);
    return;
  }

  localStorage.setItem(SUPABASE_SESSION_KEY, JSON.stringify(session));
}

export function getStoredSupabaseSession() {
  return readStoredSession();
}

export function clearStoredSupabaseSession() {
  writeStoredSession(null);
}

export async function signInWithSupabase(email: string, password: string) {
  if (!hasSupabaseAuthConfig()) return { error: "Supabase nao configurado.", session: null };

  const response = await supabaseFetch("/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const result = (await response.json()) as SupabaseAuthResponse;
  if (!response.ok || !result.session) {
    return {
      error: result.error_description || result.msg || "Nao foi possivel autenticar no Supabase.",
      session: null,
    };
  }

  writeStoredSession(result.session);
  return { error: null, session: result.session };
}

export async function signUpWithSupabase(
  email: string,
  password: string,
  metadata: { nome: string; avatar: string; idade: number },
) {
  if (!hasSupabaseAuthConfig()) return { error: "Supabase nao configurado.", session: null, user: null };

  const response = await supabaseFetch("/signup", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      data: metadata,
    }),
  });

  const result = (await response.json()) as SupabaseAuthResponse;
  if (!response.ok) {
    return {
      error: result.error_description || result.msg || "Nao foi possivel criar a conta no Supabase.",
      session: null,
      user: null,
    };
  }

  if (result.session) {
    writeStoredSession(result.session);
  }

  return { error: null, session: result.session ?? null, user: result.user ?? null };
}

export async function requestSupabaseRecovery(email: string) {
  if (!hasSupabaseAuthConfig()) {
    return "Supabase nao configurado para recuperacao remota.";
  }

  const response = await supabaseFetch("/recover", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    return "Nao foi possivel iniciar a recuperacao pelo Supabase.";
  }

  return "Se este email existir no Supabase, um link de recuperacao sera enviado.";
}
