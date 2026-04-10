"use client";

import {
  appendSessionHistory,
  appendHelpRequest,
  bootstrapStorage,
  clearActiveSession,
  getActiveSession,
  listUsers,
  loadAllHistories,
  loadHelpRequests,
  loadProgress,
  loadSessionHistory,
  loginUser,
  registerUser,
  saveProgress,
  simulateRecovery,
  updateUserProfile,
  updateUserPoints,
} from "@/lib/storage";
import type { DataMode, HelpRequest, ProgressState, SessionRecord, Usuario } from "@/lib/types";

type RegisterResult = {
  error: string | null;
  user: Usuario | null;
};

type AppRepository = {
  mode: DataMode;
  bootstrap: () => Promise<void>;
  getActiveSession: () => Usuario | null;
  clearActiveSession: () => void;
  loginUser: (email: string, password: string) => Promise<Usuario | null>;
  registerUser: (
    email: string,
    password: string,
    idade: number,
    nome: string,
    avatar: string,
  ) => Promise<RegisterResult>;
  updateUserProfile: (email: string, profile: Pick<Usuario, "idade" | "nome" | "avatar">) => Promise<Usuario | null>;
  updateUserPoints: (email: string, delta: number) => Promise<Usuario | null>;
  loadProgress: (email: string) => Promise<ProgressState>;
  saveProgress: (email: string, progress: ProgressState) => Promise<void>;
  loadSessionHistory: (email: string) => Promise<SessionRecord[]>;
  appendSessionHistory: (email: string, record: Omit<SessionRecord, "id" | "email">) => Promise<SessionRecord[]>;
  listUsers: () => Promise<Usuario[]>;
  loadAllHistories: () => Promise<Array<{ user: Usuario; history: SessionRecord[] }>>;
  loadHelpRequests: () => Promise<HelpRequest[]>;
  appendHelpRequest: (request: Omit<HelpRequest, "id" | "createdAt" | "status">) => Promise<HelpRequest[]>;
  simulateRecovery: (email: string) => string;
};

export type RemoteBackendStatus = {
  mode: DataMode;
  ready: boolean;
  provider: string;
  description: string;
};

function getRemoteBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "/api";
}

function getRepositoryMode(): DataMode {
  return process.env.NEXT_PUBLIC_APP_DATA_MODE === "remote" ? "remote" : "local";
}

export function getRemoteBackendStatus(): RemoteBackendStatus {
  const mode = getRepositoryMode();
  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());

  if (mode === "local") {
    return {
      mode,
      ready: false,
      provider: "Local",
      description: "Modo local ativo. O app funciona no navegador e ja aceita migracao para backend online.",
    };
  }

  if (hasSupabase) {
    return {
      mode,
      ready: true,
      provider: "Supabase",
      description: "Modo remoto configurado com credenciais publicas para autenticar e sincronizar progresso online.",
    };
  }

  return {
    mode,
    ready: false,
    provider: "Remoto pendente",
    description: "Modo remoto selecionado, mas ainda faltam credenciais de provedor para ativar contas e progresso online.",
  };
}

async function parseJson<T>(response: Response): Promise<T | null> {
  if (!response.ok) return null;
  return (await response.json()) as T;
}

const localRepository: AppRepository = {
  mode: "local",
  bootstrap: bootstrapStorage,
  getActiveSession,
  clearActiveSession,
  loginUser,
  registerUser,
  updateUserProfile: async (email, profile) => updateUserProfile(email, profile),
  updateUserPoints: async (email, delta) => updateUserPoints(email, delta),
  loadProgress: async (email) => loadProgress(email),
  saveProgress: async (email, progress) => saveProgress(email, progress),
  loadSessionHistory: async (email) => loadSessionHistory(email),
  appendSessionHistory: async (email, record) => appendSessionHistory(email, record),
  listUsers: async () => listUsers(),
  loadAllHistories: async () => loadAllHistories(),
  loadHelpRequests: async () => loadHelpRequests(),
  appendHelpRequest: async (request) => appendHelpRequest(request),
  simulateRecovery: (email) => simulateRecovery(email),
};

const remoteRepository: AppRepository = {
  mode: "remote",
  bootstrap: async () => undefined,
  getActiveSession: () => null,
  clearActiveSession: () => undefined,
  loginUser: async (email, password) => {
    const response = await fetch(`${getRemoteBaseUrl()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return parseJson<Usuario>(response);
  },
  registerUser: async (email, password, idade, nome, avatar) => {
    const response = await fetch(`${getRemoteBaseUrl()}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, idade, nome, avatar }),
    });

    const result = await parseJson<RegisterResult>(response);
    return result ?? { error: "Nao foi possivel cadastrar no backend remoto.", user: null };
  },
  updateUserProfile: async (email, profile) => {
    const response = await fetch(`${getRemoteBaseUrl()}/users/${encodeURIComponent(email)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    return parseJson<Usuario>(response);
  },
  updateUserPoints: async (email, delta) => {
    const response = await fetch(`${getRemoteBaseUrl()}/users/${encodeURIComponent(email)}/points`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta }),
    });
    return parseJson<Usuario>(response);
  },
  loadProgress: async (email) => {
    const response = await fetch(`${getRemoteBaseUrl()}/progress/${encodeURIComponent(email)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    const result = await parseJson<ProgressState>(response);
    if (!result) {
      throw new Error("O backend remoto ainda nao expôs a rota de progresso.");
    }
    return result;
  },
  saveProgress: async (email, progress) => {
    await fetch(`${getRemoteBaseUrl()}/progress/${encodeURIComponent(email)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(progress),
    });
  },
  loadSessionHistory: async (email) => {
    const response = await fetch(`${getRemoteBaseUrl()}/history/${encodeURIComponent(email)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    return (await parseJson<SessionRecord[]>(response)) ?? [];
  },
  appendSessionHistory: async (email, record) => {
    const response = await fetch(`${getRemoteBaseUrl()}/history/${encodeURIComponent(email)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    return (await parseJson<SessionRecord[]>(response)) ?? [];
  },
  listUsers: async () => {
    const response = await fetch(`${getRemoteBaseUrl()}/users`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    return (await parseJson<Usuario[]>(response)) ?? [];
  },
  loadAllHistories: async () => {
    const response = await fetch(`${getRemoteBaseUrl()}/admin/histories`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    return (await parseJson<Array<{ user: Usuario; history: SessionRecord[] }>>(response)) ?? [];
  },
  loadHelpRequests: async () => {
    const response = await fetch(`${getRemoteBaseUrl()}/help`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    return (await parseJson<HelpRequest[]>(response)) ?? [];
  },
  appendHelpRequest: async (request) => {
    const response = await fetch(`${getRemoteBaseUrl()}/help`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    return (await parseJson<HelpRequest[]>(response)) ?? [];
  },
  simulateRecovery: () =>
    "Modo remoto preparado. Em producao, use um endpoint de recuperacao com email e token temporario.",
};

let cachedRepository: AppRepository | null = null;

export function getAppRepository() {
  if (cachedRepository) return cachedRepository;
  cachedRepository = getRepositoryMode() === "remote" ? remoteRepository : localRepository;
  return cachedRepository;
}

export function getDataModeLabel(mode: DataMode) {
  return mode === "remote" ? "Backend online" : "Dados locais";
}

export function getDataModeDescription(mode: DataMode) {
  return mode === "remote"
    ? "Pronto para usar API real de contas e progresso online."
    : "Salva no navegador, mas a interface ja esta preparada para migrar para API.";
}
