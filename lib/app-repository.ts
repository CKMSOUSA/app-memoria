"use client";

import {
  appendSessionHistory,
  appendHelpRequest,
  bootstrapStorage,
  clearActiveSession,
  setActiveSession,
  syncAuthUserProfile,
  ensureAdminUser,
  getActiveSession,
  listUsers,
  loadAllHistories,
  loadHelpRequests,
  loadProgress,
  loadSessionHistory,
  saveHelpRequests,
  saveSessionHistory,
  loginUser,
  registerUser,
  saveProgress,
  simulateRecovery,
  updateUserProfile,
  updateUserPoints as updateStoredUserPoints,
} from "@/lib/storage";
import {
  clearStoredSupabaseSession,
  getStoredSupabaseSession,
  hasSupabaseAuthConfig,
  requestSupabaseRecovery,
  signInWithSupabase,
  signUpWithSupabase,
} from "@/lib/supabase-auth";
import {
  loadSupabaseProfileByEmail,
  updateSupabaseProfile,
  upsertSupabaseProfile,
} from "@/lib/supabase-profile";
import { appendSupabaseHelpRequest, loadSupabaseHelpRequests } from "@/lib/supabase-help";
import { appendSupabaseSessionHistory, loadSupabaseSessionHistory } from "@/lib/supabase-history";
import { loadSupabaseProgress, saveSupabaseProgress } from "@/lib/supabase-progress";
import type { AdminOverview, DataMode, HelpRequest, ProgressState, SessionRecord, Usuario } from "@/lib/types";

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
  loadAdminOverview: (adminCode?: string) => Promise<AdminOverview>;
  updateHelpRequestStatus: (
    requestId: string,
    status: HelpRequest["status"],
    adminReply?: string,
    adminCode?: string,
  ) => Promise<HelpRequest[]>;
  ensureAdminUser: () => Promise<Usuario | null>;
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

function hasSupabaseConfig() {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim())
  );
}

function getRepositoryMode(): DataMode {
  if (process.env.NEXT_PUBLIC_APP_DATA_MODE === "local") {
    return "local";
  }

  return hasSupabaseConfig() ? "remote" : "local";
}

export function getRemoteBackendStatus(): RemoteBackendStatus {
  const mode = getRepositoryMode();
  const hasSupabase = hasSupabaseConfig();

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

async function loadAdminOverviewFromApi(adminCode?: string) {
  const session = getStoredSupabaseSession();
  const headers = new Headers();

  if (adminCode?.trim()) {
    headers.set("x-admin-code", adminCode.trim());
  }

  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  const response = await fetch("/api/admin/overview", {
    method: "GET",
    headers,
    cache: "no-store",
  });

  return parseJson<AdminOverview>(response);
}

async function updateAdminHelpRequestStatus(
  requestId: string,
  status: HelpRequest["status"],
  adminReply?: string,
  adminCode?: string,
) {
  const session = getStoredSupabaseSession();
  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (adminCode?.trim()) {
    headers.set("x-admin-code", adminCode.trim());
  }

  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  const response = await fetch("/api/admin/overview", {
    method: "PATCH",
    headers,
    body: JSON.stringify({ requestId, status, adminReply }),
  });

  return parseJson<{ helpRequests: HelpRequest[] }>(response);
}

function mergeHelpRequests(localItems: HelpRequest[], remoteItems: HelpRequest[]) {
  const map = new Map<string, HelpRequest>();

  for (const item of [...remoteItems, ...localItems]) {
    map.set(item.id, item);
  }

  return Array.from(map.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 200);
}

const localRepository: AppRepository = {
  mode: "local",
  bootstrap: bootstrapStorage,
  getActiveSession: () => {
    const authSession = getStoredSupabaseSession();
    if (authSession?.user?.email && hasSupabaseAuthConfig()) {
      return syncAuthUserProfile({
        email: authSession.user.email,
        nome:
          typeof authSession.user.user_metadata?.nome === "string"
            ? authSession.user.user_metadata.nome
            : "Jogador",
        avatar:
          typeof authSession.user.user_metadata?.avatar === "string"
            ? authSession.user.user_metadata.avatar
            : undefined,
        idade:
          typeof authSession.user.user_metadata?.idade === "number"
            ? authSession.user.user_metadata.idade
            : undefined,
        premium:
          typeof authSession.user.user_metadata?.premium === "boolean"
            ? authSession.user.user_metadata.premium
            : undefined,
        pontos:
          typeof authSession.user.user_metadata?.pontos === "number"
            ? authSession.user.user_metadata.pontos
            : undefined,
      });
    }

    return getActiveSession();
  },
  clearActiveSession: () => {
    clearActiveSession();
    clearStoredSupabaseSession();
  },
  loginUser: async (email, password) => {
    if (hasSupabaseAuthConfig()) {
      const result = await signInWithSupabase(email, password);
      if (result.session?.user?.email) {
        const remoteProfile =
          (await loadSupabaseProfileByEmail(result.session.user.email)) ??
          (await upsertSupabaseProfile({
            email: result.session.user.email,
            nome:
              typeof result.session.user.user_metadata?.nome === "string"
                ? result.session.user.user_metadata.nome
                : "Jogador",
            avatar:
              typeof result.session.user.user_metadata?.avatar === "string"
                ? result.session.user.user_metadata.avatar
                : "🧠",
            idade:
              typeof result.session.user.user_metadata?.idade === "number"
                ? result.session.user.user_metadata.idade
                : 25,
          }));

        const user = syncAuthUserProfile({
          email: result.session.user.email,
          nome: remoteProfile?.nome ?? "Jogador",
          avatar: remoteProfile?.avatar,
          idade: remoteProfile?.idade,
          premium: remoteProfile?.premium,
          pontos: remoteProfile?.pontos,
          role: remoteProfile?.role,
          criadoEm: remoteProfile?.criadoEm,
        });
        setActiveSession(user.email);
        return user;
      }
    }

    return loginUser(email, password);
  },
  registerUser: async (email, password, idade, nome, avatar) => {
    if (hasSupabaseAuthConfig()) {
      const result = await signUpWithSupabase(email, password, { idade, nome, avatar });
      if (result.error) {
        return { error: result.error, user: null };
      }

      const remoteProfile =
        (await upsertSupabaseProfile({
          email: email.trim().toLowerCase(),
          nome,
          avatar,
          idade,
        })) ??
        syncAuthUserProfile({
          email: email.trim().toLowerCase(),
          nome,
          avatar,
          idade,
        });

      const user = syncAuthUserProfile({
        email: email.trim().toLowerCase(),
        nome: remoteProfile.nome,
        avatar: remoteProfile.avatar,
        idade: remoteProfile.idade,
        premium: remoteProfile.premium,
        pontos: remoteProfile.pontos,
        role: remoteProfile.role,
        criadoEm: remoteProfile.criadoEm,
      });

      if (result.session) {
        setActiveSession(user.email);
      }

      return {
        error: null,
        user,
      };
    }

    return registerUser(email, password, idade, nome, avatar);
  },
  updateUserProfile: async (email, profile) => {
    const localUser = updateUserProfile(email, profile);

    if (hasSupabaseAuthConfig()) {
      const remoteUser = await updateSupabaseProfile(email, profile);
      if (remoteUser) {
        return syncAuthUserProfile({
          email: remoteUser.email,
          nome: remoteUser.nome,
          avatar: remoteUser.avatar,
          idade: remoteUser.idade,
          premium: remoteUser.premium,
          pontos: remoteUser.pontos,
          role: remoteUser.role,
          criadoEm: remoteUser.criadoEm,
        });
      }
    }

    return localUser;
  },
  updateUserPoints: async (email, delta) => {
    const localUser: Usuario | null = updateStoredUserPoints(email, delta);

    if (hasSupabaseAuthConfig()) {
      const currentRemoteUser = await loadSupabaseProfileByEmail(email);
      if (!currentRemoteUser) {
        return localUser;
      }

      const remoteUser = await updateSupabaseProfile(email, {
        pontos: currentRemoteUser.pontos + delta,
      });

      if (remoteUser) {
        return syncAuthUserProfile({
          email: remoteUser.email,
          nome: remoteUser.nome,
          avatar: remoteUser.avatar,
          idade: remoteUser.idade,
          premium: remoteUser.premium,
          pontos: remoteUser.pontos,
          role: remoteUser.role,
          criadoEm: remoteUser.criadoEm,
        });
      }
    }

    return localUser;
  },
  loadProgress: async (email) => {
    if (hasSupabaseAuthConfig()) {
      const remoteProgress = await loadSupabaseProgress(email);
      if (remoteProgress) {
        saveProgress(email, remoteProgress);
        return remoteProgress;
      }
    }

    return loadProgress(email);
  },
  saveProgress: async (email, progress) => {
    saveProgress(email, progress);

    if (hasSupabaseAuthConfig()) {
      await saveSupabaseProgress(email, progress);
    }
  },
  loadSessionHistory: async (email) => {
    if (hasSupabaseAuthConfig()) {
      const remoteHistory = await loadSupabaseSessionHistory(email);
      if (remoteHistory) {
        saveSessionHistory(email, remoteHistory);
        return remoteHistory;
      }
    }

    return loadSessionHistory(email);
  },
  appendSessionHistory: async (email, record) => {
    const localHistory = appendSessionHistory(email, record);

    if (hasSupabaseAuthConfig()) {
      const remoteHistory = await appendSupabaseSessionHistory(email, record);
      if (remoteHistory) {
        saveSessionHistory(email, remoteHistory);
        return remoteHistory;
      }
    }

    return localHistory;
  },
  listUsers: async () => listUsers(),
  loadAllHistories: async () => loadAllHistories(),
  loadHelpRequests: async () => {
    const localItems = loadHelpRequests();

    if (hasSupabaseAuthConfig()) {
      const remoteItems = await loadSupabaseHelpRequests();
      if (remoteItems) {
        const merged = mergeHelpRequests(localItems, remoteItems);
        saveHelpRequests(merged);
        return merged;
      }
    }

    return localItems;
  },
  appendHelpRequest: async (request) => {
    const localItems = appendHelpRequest(request);

    if (hasSupabaseAuthConfig()) {
      const remoteItems = await appendSupabaseHelpRequest(request);
      if (remoteItems) {
        const merged = mergeHelpRequests(localItems, remoteItems);
        saveHelpRequests(merged);
        return merged;
      }
    }

    return localItems;
  },
  loadAdminOverview: async (adminCode) => {
    const remoteOverview = await loadAdminOverviewFromApi(adminCode);
    if (remoteOverview) return remoteOverview;

    const users = listUsers();
    const localHistories = loadAllHistories().map((item) => ({
      ...item,
      progress: loadProgress(item.user.email),
    }));

    return {
      users,
      histories: localHistories,
      helpRequests: loadHelpRequests(),
      source: "local",
    };
  },
  updateHelpRequestStatus: async (requestId, status, adminReply, adminCode) => {
    const remoteResult = await updateAdminHelpRequestStatus(requestId, status, adminReply, adminCode);
    if (remoteResult?.helpRequests) {
      saveHelpRequests(remoteResult.helpRequests);
      return remoteResult.helpRequests;
    }

    const current = loadHelpRequests();
    const next = current.map((item) =>
      item.id === requestId ? { ...item, status, adminReply: adminReply ?? item.adminReply ?? null } : item,
    );
    saveHelpRequests(next);
    return next;
  },
  ensureAdminUser: async () => ensureAdminUser(),
  simulateRecovery: (email) => {
    if (hasSupabaseAuthConfig()) {
      void requestSupabaseRecovery(email);
      return "Se este email existir, um fluxo de recuperacao sera iniciado pelo Supabase.";
    }
    return simulateRecovery(email);
  },
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
  loadAdminOverview: async (adminCode) => {
    const overview = await loadAdminOverviewFromApi(adminCode);
    if (!overview) {
      throw new Error("Nao foi possivel carregar a visao administrativa online.");
    }
    return overview;
  },
  updateHelpRequestStatus: async (requestId, status, adminReply, adminCode) => {
    const result = await updateAdminHelpRequestStatus(requestId, status, adminReply, adminCode);
    return result?.helpRequests ?? [];
  },
  ensureAdminUser: async () => null,
  simulateRecovery: () =>
    "Modo remoto preparado. Em producao, use um endpoint de recuperacao com email e token temporario.",
};

let cachedRepository: AppRepository | null = null;

export function getAppRepository() {
  if (cachedRepository) return cachedRepository;
  cachedRepository =
    getRepositoryMode() === "remote"
      ? { ...localRepository, mode: "remote" as DataMode }
      : { ...localRepository, mode: "local" as DataMode };
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
