"use client";

import {
  appendSessionHistory,
  appendHelpRequest,
  bootstrapStorage,
  clearActiveSession,
  excludeUser,
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
  registerUser as registerStoredUser,
  saveProgress,
  simulateRecovery,
  updateUserStatus,
  updateUserProfile as updateStoredUserProfile,
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
import {
  enqueuePendingSyncOperation,
  getOfflineSyncStatus,
  initializeOfflineStore,
  listPendingSyncOperations,
  loadHelpRequestsSnapshot,
  loadProgressSnapshot,
  loadSessionHistorySnapshot,
  persistHelpRequestsSnapshot,
  persistProgressSnapshot,
  persistSessionHistorySnapshot,
  persistSessionSnapshot,
  persistUsersSnapshot,
  removePendingSyncOperation,
  updateOfflineSyncStatus,
  type OfflineSyncStatus,
} from "@/lib/offline-store";
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
  getOfflineSyncStatus: () => Promise<OfflineSyncStatus>;
  syncOfflineData: () => Promise<OfflineSyncStatus>;
  loginUser: (email: string, password: string) => Promise<Usuario | null>;
  registerUser: (
    email: string,
    password: string,
    idade: number,
    nome: string,
    avatar: string,
    role?: Usuario["role"],
    turma?: string | null,
  ) => Promise<RegisterResult>;
  updateUserProfile: (
    email: string,
    profile: Pick<Usuario, "idade" | "nome" | "avatar"> & Partial<Pick<Usuario, "role" | "turma">>,
  ) => Promise<Usuario | null>;
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
  updateManagedUserStatus: (email: string, status: Usuario["status"], adminCode?: string) => Promise<void>;
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

function isLocalAdminCodeValid(adminCode?: string) {
  const expectedCode = process.env.NEXT_PUBLIC_ADMIN_CONFIRM_CODE?.trim() || "";
  if (!expectedCode) return true;
  return adminCode?.trim() === expectedCode;
}

function getRemoteCompatibleRole(role: Usuario["role"]) {
  return role === "admin" ? "admin" : "aluno";
}

function resolveStoredRole(email: string, remoteRole?: Usuario["role"]) {
  const storedRole = listUsers().find((item) => item.email === email)?.role;
  if (remoteRole === "admin") return "admin";
  if (storedRole === "responsavel" || storedRole === "professor") return storedRole;
  return remoteRole ?? storedRole ?? "aluno";
}

function resolveStoredTurma(email: string, turma?: string | null) {
  const storedTurma = listUsers().find((item) => item.email === email)?.turma ?? null;
  return turma ?? storedTurma;
}

async function persistUsersToOfflineStore() {
  await persistUsersSnapshot(listUsers());
}

async function persistSessionToOfflineStore(email: string | null) {
  await persistSessionSnapshot(email);
}

async function syncQueuedOfflineOperations() {
  const unsupportedStatus = await getOfflineSyncStatus();
  if (!unsupportedStatus.isSupported) return unsupportedStatus;
  if (!hasSupabaseAuthConfig() || typeof window === "undefined" || !window.navigator.onLine) {
    return getOfflineSyncStatus();
  }

  const queue = await listPendingSyncOperations();
  if (queue.length === 0) {
    return getOfflineSyncStatus();
  }

  let lastError: string | null = null;
  await updateOfflineSyncStatus({ isSyncing: true, lastError: null, pendingCount: queue.length });

  for (const item of queue) {
    try {
      if (item.type === "saveProgress") {
        await saveSupabaseProgress(item.email, item.progress);
      } else if (item.type === "appendSessionHistory") {
        const remoteHistory = await appendSupabaseSessionHistory(item.email, item.record);
        if (remoteHistory) {
          saveSessionHistory(item.email, remoteHistory);
          await persistSessionHistorySnapshot(item.email, remoteHistory);
        }
      } else if (item.type === "appendHelpRequest") {
        const remoteHelp = await appendSupabaseHelpRequest(item.request);
        if (remoteHelp) {
          const merged = mergeHelpRequests(loadHelpRequests(), remoteHelp);
          saveHelpRequests(merged);
          await persistHelpRequestsSnapshot(merged);
        }
      } else if (item.type === "updateUserProfile") {
        const remoteUser = await updateSupabaseProfile(item.email, {
          nome: item.profile.nome,
          avatar: item.profile.avatar,
          idade: item.profile.idade,
          role: item.profile.role ? getRemoteCompatibleRole(item.profile.role) : undefined,
        });
        if (remoteUser) {
          syncAuthUserProfile({
            email: remoteUser.email,
            nome: remoteUser.nome,
            avatar: remoteUser.avatar,
            idade: remoteUser.idade,
            premium: remoteUser.premium,
            pontos: remoteUser.pontos,
            role: item.profile.role ?? resolveStoredRole(remoteUser.email, remoteUser.role),
            status: remoteUser.status,
            criadoEm: remoteUser.criadoEm,
            turma: item.profile.turma ?? resolveStoredTurma(remoteUser.email),
          });
          await persistUsersToOfflineStore();
        }
      }

      await removePendingSyncOperation(item.id);
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Falha ao sincronizar dados offline.";
      break;
    }
  }

  const status = await getOfflineSyncStatus();
  return updateOfflineSyncStatus({
    ...status,
    isSyncing: false,
    lastSyncedAt: lastError ? status.lastSyncedAt : new Date().toISOString(),
    lastError,
  });
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

async function updateManagedUserStatusFromApi(
  email: string,
  status: Usuario["status"],
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

  const response = await fetch("/api/admin/users", {
    method: "PATCH",
    headers,
    body: JSON.stringify({ email, status }),
  });

  return parseJson<{ ok: boolean }>(response);
}

function mergeHelpRequests(localItems: HelpRequest[], remoteItems: HelpRequest[]) {
  const map = new Map<string, HelpRequest>();

  for (const item of [...remoteItems, ...localItems]) {
    map.set(item.id, item);
  }

  return Array.from(map.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 200);
}

function mergeLocalUserFields(users: Usuario[]) {
  const localUsers = listUsers();
  const localByEmail = new Map(localUsers.map((user) => [user.email, user]));

  return users.map((user) => {
    const localUser = localByEmail.get(user.email);
    return localUser ? { ...user, turma: localUser.turma ?? user.turma ?? null } : user;
  });
}

function mergeLocalOverviewFields(overview: AdminOverview): AdminOverview {
  const localUsers = listUsers();
  const localByEmail = new Map(localUsers.map((user) => [user.email, user]));

  return {
    ...overview,
    users: overview.users.map((user) => {
      const localUser = localByEmail.get(user.email);
      return localUser ? { ...user, turma: localUser.turma ?? user.turma ?? null } : user;
    }),
    histories: overview.histories.map((entry) => {
      const localUser = localByEmail.get(entry.user.email);
      return localUser ? { ...entry, user: { ...entry.user, turma: localUser.turma ?? entry.user.turma ?? null } } : entry;
    }),
  };
}

const localRepository: AppRepository = {
  mode: "local",
  bootstrap: async () => {
    await bootstrapStorage();
    await initializeOfflineStore();
    await persistUsersToOfflineStore();
    const session = getStoredSupabaseSession();
    const email = session?.user?.email?.trim().toLowerCase();
    await persistSessionToOfflineStore(getActiveSession()?.email ?? email ?? null);
    if (!email || !hasSupabaseAuthConfig()) {
      await syncQueuedOfflineOperations();
      return;
    }

    let remoteProfile: Awaited<ReturnType<typeof loadSupabaseProfileByEmail>> = null;
    try {
      remoteProfile = await loadSupabaseProfileByEmail(email);
    } catch {
      await syncQueuedOfflineOperations();
      return;
    }
    if (remoteProfile) {
      syncAuthUserProfile({
        email: remoteProfile.email,
        nome: remoteProfile.nome,
        avatar: remoteProfile.avatar,
        idade: remoteProfile.idade,
        premium: remoteProfile.premium,
        pontos: remoteProfile.pontos,
        role: remoteProfile.role,
        status: remoteProfile.status,
        criadoEm: remoteProfile.criadoEm,
      });

      if (remoteProfile.status !== "ativo") {
        clearStoredSupabaseSession();
        clearActiveSession();
      }
    }
    await persistUsersToOfflineStore();
    await syncQueuedOfflineOperations();
  },
  getOfflineSyncStatus: async () => getOfflineSyncStatus(),
  syncOfflineData: async () => syncQueuedOfflineOperations(),
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
    void persistSessionToOfflineStore(null);
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
            status: "ativo",
          }));

        if (remoteProfile?.status && remoteProfile.status !== "ativo") {
          clearStoredSupabaseSession();
          clearActiveSession();
          return null;
        }

        const user = syncAuthUserProfile({
          email: result.session.user.email,
          nome: remoteProfile?.nome ?? "Jogador",
          avatar: remoteProfile?.avatar,
          idade: remoteProfile?.idade,
          premium: remoteProfile?.premium,
          pontos: remoteProfile?.pontos,
          role: resolveStoredRole(result.session.user.email, remoteProfile?.role),
          status: remoteProfile?.status,
          criadoEm: remoteProfile?.criadoEm,
          turma: resolveStoredTurma(result.session.user.email),
        });
        setActiveSession(user.email);
        await persistUsersToOfflineStore();
        await persistSessionToOfflineStore(user.email);
        return user;
      }
    }

    const user = await loginUser(email, password);
    if (user) {
      await persistUsersToOfflineStore();
      await persistSessionToOfflineStore(user.email);
    }
    return user;
  },
  registerUser: async (email, password, idade, nome, avatar, role = "aluno", turma = null) => {
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
          role: getRemoteCompatibleRole(role),
        })) ??
        syncAuthUserProfile({
          email: email.trim().toLowerCase(),
          nome,
          avatar,
          idade,
          role,
          turma,
        });

      const user = syncAuthUserProfile({
        email: email.trim().toLowerCase(),
        nome: remoteProfile.nome,
        avatar: remoteProfile.avatar,
        idade: remoteProfile.idade,
        premium: remoteProfile.premium,
        pontos: remoteProfile.pontos,
        role,
        status: remoteProfile.status,
        criadoEm: remoteProfile.criadoEm,
        turma,
      });

      if (result.session) {
        setActiveSession(user.email);
      }
      await persistUsersToOfflineStore();
      await persistSessionToOfflineStore(result.session ? user.email : null);
      await syncQueuedOfflineOperations();

      return {
        error: null,
        user,
      };
    }

    const result = await registerStoredUser(email, password, idade, nome, avatar, role, turma);
    await persistUsersToOfflineStore();
    return result;
  },
  updateUserProfile: async (email, profile) => {
    const localUser = updateStoredUserProfile(email, profile);
    const resolvedTurma = resolveStoredTurma(email, profile.turma ?? null);
    await persistUsersToOfflineStore();

    if (hasSupabaseAuthConfig()) {
      try {
        const remoteUser = await updateSupabaseProfile(email, {
          nome: profile.nome,
          avatar: profile.avatar,
          idade: profile.idade,
          role: profile.role ? getRemoteCompatibleRole(profile.role) : undefined,
        });
        if (remoteUser) {
          const synced = syncAuthUserProfile({
            email: remoteUser.email,
            nome: remoteUser.nome,
            avatar: remoteUser.avatar,
            idade: remoteUser.idade,
            premium: remoteUser.premium,
            pontos: remoteUser.pontos,
            role: profile.role ?? resolveStoredRole(remoteUser.email, remoteUser.role),
            status: remoteUser.status,
            criadoEm: remoteUser.criadoEm,
            turma: resolvedTurma,
          });
          await persistUsersToOfflineStore();
          return synced;
        }
      } catch {
        await enqueuePendingSyncOperation({
          type: "updateUserProfile",
          email,
          profile,
        });
      }
    }

    return localUser;
  },
  updateUserPoints: async (email, delta) => {
    const localUser: Usuario | null = updateStoredUserPoints(email, delta);
    await persistUsersToOfflineStore();

    if (hasSupabaseAuthConfig()) {
      const currentRemoteUser = await loadSupabaseProfileByEmail(email);
      if (!currentRemoteUser) {
        return localUser;
      }

      const remoteUser = await updateSupabaseProfile(email, {
        pontos: currentRemoteUser.pontos + delta,
      });

      if (remoteUser) {
        const synced = syncAuthUserProfile({
          email: remoteUser.email,
          nome: remoteUser.nome,
          avatar: remoteUser.avatar,
          idade: remoteUser.idade,
          premium: remoteUser.premium,
          pontos: remoteUser.pontos,
          role: remoteUser.role,
          status: remoteUser.status,
          criadoEm: remoteUser.criadoEm,
        });
        await persistUsersToOfflineStore();
        return synced;
      }
    }

    return localUser;
  },
  loadProgress: async (email) => {
    if (hasSupabaseAuthConfig()) {
      try {
        const remoteProgress = await loadSupabaseProgress(email);
        if (remoteProgress) {
          saveProgress(email, remoteProgress);
          await persistProgressSnapshot(email, remoteProgress);
          return remoteProgress;
        }
      } catch {
        const offlineProgress = await loadProgressSnapshot(email);
        if (offlineProgress) {
          return offlineProgress;
        }
      }
    }

    const localProgress = loadProgress(email);
    await persistProgressSnapshot(email, localProgress);
    return localProgress;
  },
  saveProgress: async (email, progress) => {
    saveProgress(email, progress);
    await persistProgressSnapshot(email, progress);

    if (hasSupabaseAuthConfig()) {
      try {
        await saveSupabaseProgress(email, progress);
      } catch {
        await enqueuePendingSyncOperation({
          type: "saveProgress",
          email,
          progress,
        });
      }
    }
  },
  loadSessionHistory: async (email) => {
    if (hasSupabaseAuthConfig()) {
      try {
        const remoteHistory = await loadSupabaseSessionHistory(email);
        if (remoteHistory) {
          saveSessionHistory(email, remoteHistory);
          await persistSessionHistorySnapshot(email, remoteHistory);
          return remoteHistory;
        }
      } catch {
        const offlineHistory = await loadSessionHistorySnapshot(email);
        if (offlineHistory) {
          return offlineHistory;
        }
      }
    }

    const localHistory = loadSessionHistory(email);
    await persistSessionHistorySnapshot(email, localHistory);
    return localHistory;
  },
  appendSessionHistory: async (email, record) => {
    const localHistory = appendSessionHistory(email, record);
    await persistSessionHistorySnapshot(email, localHistory);

    if (hasSupabaseAuthConfig()) {
      try {
        const remoteHistory = await appendSupabaseSessionHistory(email, record);
        if (remoteHistory) {
          saveSessionHistory(email, remoteHistory);
          await persistSessionHistorySnapshot(email, remoteHistory);
          return remoteHistory;
        }
      } catch {
        await enqueuePendingSyncOperation({
          type: "appendSessionHistory",
          email,
          record,
        });
      }
    }

    return localHistory;
  },
  listUsers: async () => {
    const users = listUsers();
    await persistUsersToOfflineStore();
    return users;
  },
  loadAllHistories: async () => loadAllHistories(),
  loadHelpRequests: async () => {
    const localItems = loadHelpRequests();
    await persistHelpRequestsSnapshot(localItems);

    if (hasSupabaseAuthConfig()) {
      try {
        const remoteItems = await loadSupabaseHelpRequests();
        if (remoteItems) {
          const merged = mergeHelpRequests(localItems, remoteItems);
          saveHelpRequests(merged);
          await persistHelpRequestsSnapshot(merged);
          return merged;
        }
      } catch {
        const offlineItems = await loadHelpRequestsSnapshot();
        if (offlineItems.length > 0) {
          return offlineItems;
        }
      }
    }

    return localItems;
  },
  appendHelpRequest: async (request) => {
    const localItems = appendHelpRequest(request);
    await persistHelpRequestsSnapshot(localItems);

    if (hasSupabaseAuthConfig()) {
      try {
        const remoteItems = await appendSupabaseHelpRequest(request);
        if (remoteItems) {
          const merged = mergeHelpRequests(localItems, remoteItems);
          saveHelpRequests(merged);
          await persistHelpRequestsSnapshot(merged);
          return merged;
        }
      } catch {
        await enqueuePendingSyncOperation({
          type: "appendHelpRequest",
          request,
        });
      }
    }

    return localItems;
  },
  loadAdminOverview: async (adminCode) => {
    const remoteOverview = await loadAdminOverviewFromApi(adminCode);
    if (remoteOverview) return mergeLocalOverviewFields(remoteOverview);
    if (!isLocalAdminCodeValid(adminCode)) {
      throw new Error("Acesso administrativo nao autorizado.");
    }

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
  updateManagedUserStatus: async (email, status, adminCode) => {
    const remoteResult = await updateManagedUserStatusFromApi(email, status, adminCode);
    if (remoteResult?.ok) {
      if (status === "excluido") {
        excludeUser(email);
      } else {
        updateUserStatus(email, status);
      }
      await persistUsersToOfflineStore();
      return;
    }
    if (!isLocalAdminCodeValid(adminCode)) {
      throw new Error("Acesso administrativo nao autorizado.");
    }

    if (status === "excluido") {
      excludeUser(email);
      await persistUsersToOfflineStore();
      return;
    }

    updateUserStatus(email, status);
    await persistUsersToOfflineStore();
  },
  updateHelpRequestStatus: async (requestId, status, adminReply, adminCode) => {
    const remoteResult = await updateAdminHelpRequestStatus(requestId, status, adminReply, adminCode);
    if (remoteResult?.helpRequests) {
      saveHelpRequests(remoteResult.helpRequests);
      await persistHelpRequestsSnapshot(remoteResult.helpRequests);
      return remoteResult.helpRequests;
    }
    if (!isLocalAdminCodeValid(adminCode)) {
      throw new Error("Acesso administrativo nao autorizado.");
    }

    const current = loadHelpRequests();
    const next = current.map((item) =>
      item.id === requestId ? { ...item, status, adminReply: adminReply ?? item.adminReply ?? null } : item,
    );
    saveHelpRequests(next);
    await persistHelpRequestsSnapshot(next);
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
  getOfflineSyncStatus: async () => getOfflineSyncStatus(),
  syncOfflineData: async () => syncQueuedOfflineOperations(),
  loginUser: async (email, password) => {
    const response = await fetch(`${getRemoteBaseUrl()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return parseJson<Usuario>(response);
  },
  registerUser: async (email, password, idade, nome, avatar, role = "aluno", turma = null) => {
    const response = await fetch(`${getRemoteBaseUrl()}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, idade, nome, avatar, role, turma }),
    });

    const result = await parseJson<RegisterResult>(response);
    if (!result?.user) return result ?? { error: "Nao foi possivel cadastrar no backend remoto.", user: null };
    return { ...result, user: { ...result.user, turma } };
  },
  updateUserProfile: async (email, profile) => {
    const response = await fetch(`${getRemoteBaseUrl()}/users/${encodeURIComponent(email)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const user = await parseJson<Usuario>(response);
    return user ? { ...user, turma: profile.turma ?? user.turma ?? null } : null;
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
    const users = (await parseJson<Usuario[]>(response)) ?? [];
    return mergeLocalUserFields(users);
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
  updateManagedUserStatus: async (email, status, adminCode) => {
    const result = await updateManagedUserStatusFromApi(email, status, adminCode);
    if (!result?.ok) {
      throw new Error("Nao foi possivel atualizar o usuario no backend administrativo.");
    }
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
