"use client";

import { createDefaultProgress, mergeProgress } from "@/lib/scoring";
import type { ProgressState, SessionRecord, Usuario, UsuarioPersistido } from "@/lib/types";

const USERS_KEY = "app_memoria_usuarios_v2";
const SESSION_KEY = "app_memoria_usuario_ativo_v2";
const PROGRESS_PREFIX = "app_memoria_progresso_v2";
const HISTORY_PREFIX = "app_memoria_historico_v1";
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

export async function bootstrapStorage() {
  if (!canUseStorage()) return;
  const users = readUsers();
  if (users.length > 0) return;

  const seeded: UsuarioPersistido = {
    nome: "Usuario teste",
    email: "user@email.com",
    avatar: AVATAR_OPTIONS[0],
    passwordHash: await hashPassword("123456"),
    premium: true,
    pontos: 45,
    criadoEm: new Date().toISOString(),
    idade: DEFAULT_IDADE,
  };

  writeUsers([seeded]);
  localStorage.setItem(`${PROGRESS_PREFIX}:${seeded.email}`, JSON.stringify(createDefaultProgress()));
}

export async function loginUser(email: string, password: string) {
  const users = readUsers();
  const found = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  if (!found) return null;

  const hash = await hashPassword(password);
  if (found.passwordHash !== hash) return null;

  localStorage.setItem(SESSION_KEY, found.email);
  return toPublicUser(found);
}

export async function registerUser(email: string, password: string, idade: number, nome: string, avatar: string): Promise<RegisterResult> {
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
  return found ? toPublicUser(found) : null;
}

export function clearActiveSession() {
  if (!canUseStorage()) return;
  localStorage.removeItem(SESSION_KEY);
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

export function updateUserProfile(email: string, profile: Pick<Usuario, "idade" | "nome" | "avatar">) {
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

  localStorage.setItem(`${HISTORY_PREFIX}:${email}`, JSON.stringify(next));
  return next;
}

export function loadAllHistories() {
  return listUsers().map((user) => ({
    user,
    history: loadSessionHistory(user.email),
  }));
}

export function simulateRecovery(email: string) {
  const exists = readUsers().some((user) => user.email.toLowerCase() === email.trim().toLowerCase());
  if (exists) {
    return "Se este email existir, um fluxo de recuperacao sera iniciado. Em producao, envie um link temporario em vez de exibir a senha.";
  }

  return "Nao encontramos uma conta com este email.";
}
