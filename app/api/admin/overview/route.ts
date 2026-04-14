import { NextRequest, NextResponse } from "next/server";

import { mergeProgress } from "@/lib/scoring";
import type { AdminOverview, HelpRequest, ProgressState, SessionMode, SessionRecord, Usuario, UserRole, UserStatus } from "@/lib/types";

type ProfileRow = {
  email: string;
  nome: string;
  avatar: string;
  premium: boolean;
  pontos: number;
  criado_em: string;
  idade: number;
  role: UserRole;
  status: UserStatus;
};

type ProgressRow = {
  email: string;
  mode: SessionMode;
  challenge_id: number;
  attempts: number;
  best_score: number;
  last_score: number;
  best_time_seconds: number | null;
  completed: boolean;
  last_played_at: string | null;
  last_variation_index: number | null;
};

type HistoryRow = {
  id: string;
  email: string;
  mode: SessionMode;
  challenge_id: number;
  score: number;
  time_seconds: number;
  completed: boolean;
  played_at: string;
};

type HelpRow = {
  id: string;
  email: string;
  name: string;
  subject: string;
  message: string;
  created_at: string;
  status: HelpRequest["status"];
  admin_reply: string | null;
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

  const response = await fetch(`${url}/rest/v1${path}`, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  return response;
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
  const response = await serviceFetch(`/user_profiles?email=eq.${encodeURIComponent(email)}&select=email,role,status&limit=1`);
  if (!response?.ok) return false;
  const rows = (await response.json()) as Array<{ email: string; role: UserRole; status: UserStatus }>;
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

function toUsuario(row: ProfileRow): Usuario {
  return {
    nome: row.nome,
    email: row.email,
    avatar: row.avatar,
    premium: row.premium,
    pontos: row.pontos,
    criadoEm: row.criado_em,
    idade: row.idade,
    role: row.role,
    status: row.status,
  };
}

function assignProgress(progressByEmail: Map<string, ProgressState>, row: ProgressRow) {
  const progress = progressByEmail.get(row.email) ?? mergeProgress();
  const challengeMap = progress[row.mode];

  challengeMap[row.challenge_id] = {
    attempts: row.attempts,
    bestScore: row.best_score,
    lastScore: row.last_score,
    bestTimeSeconds: row.best_time_seconds,
    completed: row.completed,
    lastPlayedAt: row.last_played_at,
    lastVariationIndex: row.last_variation_index,
  };

  progressByEmail.set(row.email, progress);
}

function toHistory(row: HistoryRow): SessionRecord {
  return {
    id: row.id,
    email: row.email,
    mode: row.mode,
    challengeId: row.challenge_id,
    score: row.score,
    timeSeconds: row.time_seconds,
    completed: row.completed,
    playedAt: row.played_at,
  };
}

function toHelp(row: HelpRow): HelpRequest {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    subject: row.subject,
    message: row.message,
    createdAt: row.created_at,
    status: row.status,
    adminReply: row.admin_reply,
  };
}

async function loadHelpRequestsWithService() {
  const helpResponse = await serviceFetch(
    "/help_requests?select=id,email,name,subject,message,created_at,status,admin_reply&order=created_at.desc&limit=300",
  );

  if (!helpResponse?.ok) return null;
  const helpRows = (await helpResponse.json()) as HelpRow[];
  return helpRows.map(toHelp);
}

export async function GET(request: NextRequest) {
  const serviceKey = getServiceRoleKey();
  if (!getSupabaseUrl() || !getSupabaseAnonKey() || !serviceKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "Configuração administrativa do Supabase ainda incompleta.",
      },
      { status: 503 },
    );
  }

  const authorized = await authorizeAdmin(request);
  if (!authorized) {
    return NextResponse.json(
      {
        ok: false,
        error: "Acesso administrativo nao autorizado.",
      },
      { status: 403 },
    );
  }

  const [profilesResponse, progressResponse, historyResponse, helpResponse] = await Promise.all([
    serviceFetch("/user_profiles?select=email,nome,avatar,premium,pontos,criado_em,idade,role,status&order=nome.asc"),
    serviceFetch("/user_progress?select=email,mode,challenge_id,attempts,best_score,last_score,best_time_seconds,completed,last_played_at,last_variation_index"),
    serviceFetch("/session_history?select=id,email,mode,challenge_id,score,time_seconds,completed,played_at&order=played_at.desc&limit=1000"),
    serviceFetch("/help_requests?select=id,email,name,subject,message,created_at,status,admin_reply&order=created_at.desc&limit=300"),
  ]);

  if (!profilesResponse?.ok || !progressResponse?.ok || !historyResponse?.ok || !helpResponse?.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "Nao foi possivel carregar a visao administrativa online.",
      },
      { status: 500 },
    );
  }

  const profileRows = (await profilesResponse.json()) as ProfileRow[];
  const progressRows = (await progressResponse.json()) as ProgressRow[];
  const historyRows = (await historyResponse.json()) as HistoryRow[];
  const helpRows = (await helpResponse.json()) as HelpRow[];

  const users = profileRows.map(toUsuario);
  const progressByEmail = new Map<string, ProgressState>();
  for (const user of users) {
    progressByEmail.set(user.email, mergeProgress());
  }
  for (const row of progressRows) {
    assignProgress(progressByEmail, row);
  }

  const historyByEmail = new Map<string, SessionRecord[]>();
  for (const row of historyRows) {
    const current = historyByEmail.get(row.email) ?? [];
    current.push(toHistory(row));
    historyByEmail.set(row.email, current);
  }

  const overview: AdminOverview = {
    users,
    histories: users.map((user) => ({
      user,
      history: historyByEmail.get(user.email) ?? [],
      progress: progressByEmail.get(user.email) ?? mergeProgress(),
    })),
    helpRequests: helpRows.map(toHelp),
    source: "supabase",
  };

  return NextResponse.json(overview);
}

export async function PATCH(request: NextRequest) {
  const serviceKey = getServiceRoleKey();
  if (!getSupabaseUrl() || !getSupabaseAnonKey() || !serviceKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "Configuração administrativa do Supabase ainda incompleta.",
      },
      { status: 503 },
    );
  }

  const authorized = await authorizeAdmin(request);
  if (!authorized) {
    return NextResponse.json(
      {
        ok: false,
        error: "Acesso administrativo nao autorizado.",
      },
      { status: 403 },
    );
  }

  const body = (await request.json()) as {
    requestId?: string;
    status?: HelpRequest["status"];
    adminReply?: string | null;
  };
  if (!body.requestId || !body.status || !["aberta", "respondida"].includes(body.status)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Dados invalidos para atualizar o pedido de ajuda.",
      },
      { status: 400 },
    );
  }

  const updateResponse = await serviceMutate(`/help_requests?id=eq.${encodeURIComponent(body.requestId)}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      status: body.status,
      admin_reply: body.adminReply?.trim() ? body.adminReply.trim() : null,
    }),
  });

  if (!updateResponse?.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "Nao foi possivel atualizar o status da duvida.",
      },
      { status: 500 },
    );
  }

  const helpRequests = await loadHelpRequestsWithService();
  if (!helpRequests) {
    return NextResponse.json(
      {
        ok: false,
        error: "A duvida foi atualizada, mas nao foi possivel recarregar a lista.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    helpRequests,
  });
}
