"use client";

import { createDefaultProgress, mergeProgress } from "@/lib/scoring";
import type { HelpRequest, ProgressState, SessionRecord, Usuario, UsuarioPersistido, UserStatus } from "@/lib/types";

export const USERS_KEY = "app_memoria_usuarios_v2";
export const SESSION_KEY = "app_memoria_usuario_ativo_v2";
export const PROGRESS_PREFIX = "app_memoria_progresso_v2";
export const HISTORY_PREFIX = "app_memoria_historico_v1";
export const HELP_REQUESTS_KEY = "app_memoria_ajuda_v1";
export const AVATAR_OPTIONS = ["🧠", "🚀", "🦊", "🐼", "🦁", "🧩"];

type RegisterResult = {
  error: string | null;
  user: Usuario | null;
};

const DEFAULT_IDADE = 25;

function canUseStorage() {
  return typeof window !== "undefined";
}

function normalizeUser(user: UsuarioPersistido): UsuarioPersistido {
  const legacyUser = user as UsuarioPersistido & { faixaEtaria?: string; idade?: number };
  const idadeLegada =
    legacyUser.faixaEtaria
      ? legacyUser.faixaEtaria === "6-8"
        ? 7
        : legacyUser.faixaEtaria === "9-12"
          ? 10
          : legacyUser.faixaEtaria === "13-15"
            ? 14
            : legacyUser.faixaEtaria === "15-18"
              ? 17
              : DEFAULT_IDADE
      : DEFAULT_IDADE;

  return {
    ...user,
    nome: user.nome ?? "Jogador",
    avatar: user.avatar ?? AVATAR_OPTIONS[0],
    idade: typeof legacyUser.idade === "number" ? legacyUser.idade : idadeLegada,
    role: user.role ?? "aluno",
    status: user.status ?? "ativo",
    turma: typeof (user as UsuarioPersistido & { turma?: string | null }).turma === "string" ? (user as UsuarioPersistido & { turma?: string | null }).turma : null,
  };
}

function toPublicUser(user: UsuarioPersistido): Usuario {
  const normalized = normalizeUser(user);
  const { passwordHash: _passwordHash, ...safeUser } = normalized;
  return safeUser;
}

async function hashPassword(password: string) {
  const bytes = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function readUsers(): UsuarioPersistido[] {
  if (!canUseStorage()) return [];
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) return [];

  try {
    return (JSON.parse(raw) as UsuarioPersistido[]).map(normalizeUser);
  } catch {
    return [];
  }
}

function writeUsers(users: UsuarioPersistido[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

async function createSeedAdminUser() {
  const seeded: UsuarioPersistido = {
    nome: "Usuario teste",
    email: "user@email.com",
    avatar: AVATAR_OPTIONS[0],
    passwordHash: await hashPassword("123456"),
    premium: true,
    pontos: 45,
    criadoEm: new Date().toISOString(),
    idade: DEFAULT_IDADE,
    role: "admin",
    status: "ativo",
    turma: "Equipe administrativa",
  };

  return seeded;
}

export async function bootstrapStorage() {
  if (!canUseStorage()) return;
  const users = readUsers();
  if (users.length === 0) {
    const seeded = await createSeedAdminUser();
    writeUsers([seeded]);
    localStorage.setItem(`${PROGRESS_PREFIX}:${seeded.email}`, JSON.stringify(createDefaultProgress()));
    return;
  }

  if (!users.some((user) => user.role === "admin")) {
    const seeded = await createSeedAdminUser();
    writeUsers([...users, seeded]);
    localStorage.setItem(`${PROGRESS_PREFIX}:${seeded.email}`, JSON.stringify(createDefaultProgress()));
  }
}

export async function ensureAdminUser() {
  const users = readUsers();
  const existingAdmin = users.find((user) => user.role === "admin");
  if (existingAdmin) return toPublicUser(existingAdmin);

  const seeded = await createSeedAdminUser();
  writeUsers([...users, seeded]);
  localStorage.setItem(`${PROGRESS_PREFIX}:${seeded.email}`, JSON.stringify(createDefaultProgress()));
  return toPublicUser(seeded);
}

export async function loginUser(email: string, password: string) {
  const users = readUsers();
  const found = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  if (!found) return null;
  if (found.status !== "ativo") return null;

  const hash = await hashPassword(password);
  if (found.passwordHash !== hash) return null;

  localStorage.setItem(SESSION_KEY, found.email);
  return toPublicUser(found);
}

export async function registerUser(
  email: string,
  password: string,
  idade: number,
  nome: string,
  avatar: string,
  role: Usuario["role"] = "aluno",
  turma: string | null = null,
): Promise<RegisterResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const users = readUsers();

  if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    return { error: "Este email ja esta cadastrado.", user: null };
  }

  const createdUser: UsuarioPersistido = {
    nome: nome.trim(),
    email: normalizedEmail,
    avatar,
    passwordHash: await hashPassword(password),
    premium: false,
    pontos: 0,
    criadoEm: new Date().toISOString(),
    idade,
    role,
    status: "ativo",
    turma,
  };

  const nextUsers = [...users, createdUser];
  writeUsers(nextUsers);
  localStorage.setItem(`${PROGRESS_PREFIX}:${createdUser.email}`, JSON.stringify(createDefaultProgress()));

  return { error: null, user: toPublicUser(createdUser) };
}

export function getActiveSession() {
  if (!canUseStorage()) return null;
  const email = localStorage.getItem(SESSION_KEY);
  if (!email) return null;

  const found = readUsers().find((user) => user.email === email);
  if (!found || found.status !== "ativo") {
    clearActiveSession();
    return null;
  }
  return toPublicUser(found);
}

export function clearActiveSession() {
  if (!canUseStorage()) return;
  localStorage.removeItem(SESSION_KEY);
}

export function setActiveSession(email: string) {
  if (!canUseStorage()) return;
  localStorage.setItem(SESSION_KEY, email);
}

export function updateUserPoints(email: string, delta: number) {
  const users = readUsers();
  let updatedUser: Usuario | null = null;

  const nextUsers = users.map((user) => {
    if (user.email !== email) return user;
    const next = { ...user, pontos: user.pontos + delta };
    updatedUser = toPublicUser(next);
    return next;
  });

  writeUsers(nextUsers);
  return updatedUser;
}

export function updateUserAge(email: string, idade: number) {
  const users = readUsers();
  let updatedUser: Usuario | null = null;

  const nextUsers = users.map((user) => {
    if (user.email !== email) return user;
    const next = { ...user, idade };
    updatedUser = toPublicUser(next);
    return next;
  });

  writeUsers(nextUsers);
  return updatedUser;
}

export function updateUserProfile(
  email: string,
  profile: Pick<Usuario, "idade" | "nome" | "avatar"> & Partial<Pick<Usuario, "role" | "turma">>,
) {
  const users = readUsers();
  let updatedUser: Usuario | null = null;

  const nextUsers = users.map((user) => {
    if (user.email !== email) return user;
    const next = { ...user, ...profile };
    updatedUser = toPublicUser(next);
    return next;
  });

  writeUsers(nextUsers);
  return updatedUser;
}

export function updateUserStatus(email: string, status: UserStatus) {
  const users = readUsers();
  let updatedUser: Usuario | null = null;

  const nextUsers = users.map((user) => {
    if (user.email !== email) return user;
    const next = { ...user, status };
    updatedUser = toPublicUser(next);
    return next;
  });

  writeUsers(nextUsers);

  if (canUseStorage() && localStorage.getItem(SESSION_KEY) === email && status !== "ativo") {
    clearActiveSession();
  }

  return updatedUser;
}

export function excludeUser(email: string) {
  const updatedUser = updateUserStatus(email, "excluido");
  if (!canUseStorage()) return updatedUser;

  localStorage.removeItem(`${PROGRESS_PREFIX}:${email}`);
  localStorage.removeItem(`${HISTORY_PREFIX}:${email}`);
  const nextRequests = loadHelpRequests().filter((item) => item.email !== email);
  saveHelpRequests(nextRequests);

  return updatedUser;
}

export function syncAuthUserProfile(profile: {
  email: string;
  nome?: string;
  avatar?: string;
  idade?: number;
  premium?: boolean;
  pontos?: number;
  role?: Usuario["role"];
  status?: Usuario["status"];
  criadoEm?: string;
  turma?: string | null;
}) {
  const users = readUsers();
  const existing = users.find((user) => user.email === profile.email);

  if (existing) {
    const nextUsers = users.map((user) =>
      user.email !== profile.email
        ? user
        : {
            ...user,
            nome: profile.nome ?? user.nome,
            avatar: profile.avatar ?? user.avatar,
            idade: profile.idade ?? user.idade,
            premium: typeof profile.premium === "boolean" ? profile.premium : user.premium,
            pontos: typeof profile.pontos === "number" ? profile.pontos : user.pontos,
            role: profile.role ?? user.role,
            status: profile.status ?? user.status,
            criadoEm: profile.criadoEm ?? user.criadoEm,
            turma: profile.turma ?? user.turma ?? null,
          },
    );
    writeUsers(nextUsers);
    return toPublicUser(nextUsers.find((user) => user.email === profile.email) ?? existing);
  }

  const created: UsuarioPersistido = {
    nome: profile.nome ?? "Jogador",
    email: profile.email,
    avatar: profile.avatar ?? AVATAR_OPTIONS[0],
    passwordHash: "__supabase__",
    premium: profile.premium ?? false,
    pontos: profile.pontos ?? 0,
    criadoEm: profile.criadoEm ?? new Date().toISOString(),
    idade: profile.idade ?? DEFAULT_IDADE,
    role: profile.role ?? "aluno",
    status: profile.status ?? "ativo",
    turma: profile.turma ?? null,
  };

  writeUsers([...users, created]);
  localStorage.setItem(`${PROGRESS_PREFIX}:${created.email}`, JSON.stringify(createDefaultProgress()));
  return toPublicUser(created);
}

export function loadProgress(email: string) {
  if (!canUseStorage()) return createDefaultProgress();
  const raw = localStorage.getItem(`${PROGRESS_PREFIX}:${email}`);
  if (!raw) return createDefaultProgress();

  try {
    return mergeProgress(JSON.parse(raw) as Partial<ProgressState>);
  } catch {
    return createDefaultProgress();
  }
}

export function saveProgress(email: string, progress: ProgressState) {
  if (!canUseStorage()) return;
  localStorage.setItem(`${PROGRESS_PREFIX}:${email}`, JSON.stringify(progress));
}

export function listUsers() {
  return readUsers().map(toPublicUser);
}

export function loadSessionHistory(email: string) {
  if (!canUseStorage()) return [] as SessionRecord[];
  const raw = localStorage.getItem(`${HISTORY_PREFIX}:${email}`);
  if (!raw) return [] as SessionRecord[];

  try {
    return JSON.parse(raw) as SessionRecord[];
  } catch {
    return [] as SessionRecord[];
  }
}

export function saveSessionHistory(email: string, history: SessionRecord[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(`${HISTORY_PREFIX}:${email}`, JSON.stringify(history.slice(0, 120)));
}

export function appendSessionHistory(email: string, record: Omit<SessionRecord, "id" | "email">) {
  if (!canUseStorage()) return [] as SessionRecord[];
  const current = loadSessionHistory(email);
  const next: SessionRecord[] = [
    {
      ...record,
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      email,
    },
    ...current,
  ].slice(0, 120);

  saveSessionHistory(email, next);
  return next;
}

export function loadAllHistories() {
  return listUsers().map((user) => ({
    user,
    history: loadSessionHistory(user.email),
  }));
}

export function loadHelpRequests() {
  if (!canUseStorage()) return [] as HelpRequest[];
  const raw = localStorage.getItem(HELP_REQUESTS_KEY);
  if (!raw) return [] as HelpRequest[];

  try {
    return JSON.parse(raw) as HelpRequest[];
  } catch {
    return [] as HelpRequest[];
  }
}

export function saveHelpRequests(requests: HelpRequest[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(HELP_REQUESTS_KEY, JSON.stringify(requests.slice(0, 200)));
}

export function appendHelpRequest(request: Omit<HelpRequest, "id" | "createdAt" | "status">) {
  if (!canUseStorage()) return [] as HelpRequest[];
  const current = loadHelpRequests();
  const next: HelpRequest[] = [
    {
      ...request,
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      status: "aberta" as const,
    },
    ...current,
  ].slice(0, 200);

  saveHelpRequests(next);
  return next;
}

export function simulateRecovery(email: string) {
  const exists = readUsers().some((user) => user.email.toLowerCase() === email.trim().toLowerCase());
  if (exists) {
    return "Se este email existir, um fluxo de recuperacao sera iniciado. Em producao, envie um link temporario em vez de exibir a senha.";
  }

  return "Nao encontramos uma conta com este email.";
}
