"use client";

import { APP_SETTINGS_KEY } from "@/lib/app-settings";
import {
  HELP_REQUESTS_KEY,
  HISTORY_PREFIX,
  PROGRESS_PREFIX,
  SESSION_KEY,
  USERS_KEY,
} from "@/lib/storage";
import type { HelpRequest, ProgressState, SessionRecord, Usuario } from "@/lib/types";

const DB_NAME = "app-memoria-offline-v1";
const DB_VERSION = 1;
const SNAPSHOT_STORE = "snapshots";
const QUEUE_STORE = "syncQueue";
const STATUS_EVENT = "app-memoria-offline-sync-updated";
const STATUS_KEY = "offlineSyncStatus";

type SnapshotRecord<T> = {
  key: string;
  value: T;
  updatedAt: string;
};

export type PendingSyncOperation =
  | {
      id: string;
      type: "saveProgress";
      email: string;
      progress: ProgressState;
      createdAt: string;
    }
  | {
      id: string;
      type: "appendSessionHistory";
      email: string;
      record: Omit<SessionRecord, "id" | "email">;
      createdAt: string;
    }
  | {
      id: string;
      type: "appendHelpRequest";
      request: Omit<HelpRequest, "id" | "createdAt" | "status">;
      createdAt: string;
    }
  | {
      id: string;
      type: "updateUserProfile";
      email: string;
      profile: Pick<Usuario, "idade" | "nome" | "avatar"> & Partial<Pick<Usuario, "role" | "turma">>;
      createdAt: string;
    };

export type PendingSyncOperationInput =
  | {
      type: "saveProgress";
      email: string;
      progress: ProgressState;
    }
  | {
      type: "appendSessionHistory";
      email: string;
      record: Omit<SessionRecord, "id" | "email">;
    }
  | {
      type: "appendHelpRequest";
      request: Omit<HelpRequest, "id" | "createdAt" | "status">;
    }
  | {
      type: "updateUserProfile";
      email: string;
      profile: Pick<Usuario, "idade" | "nome" | "avatar"> & Partial<Pick<Usuario, "role" | "turma">>;
    };

export type OfflineSyncStatus = {
  isSupported: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  lastError: string | null;
};

const DEFAULT_SYNC_STATUS: OfflineSyncStatus = {
  isSupported: true,
  pendingCount: 0,
  isSyncing: false,
  lastSyncedAt: null,
  lastError: null,
};

function canUseIndexedDb() {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

function createSnapshotKey(
  type: "users" | "session" | "settings" | "helpRequests" | "progress" | "history",
  email?: string,
) {
  return email ? `${type}:${email}` : type;
}

function createOperationId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function cloneForStorage<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (!canUseIndexedDb()) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(SNAPSHOT_STORE)) {
        database.createObjectStore(SNAPSHOT_STORE, { keyPath: "key" });
      }
      if (!database.objectStoreNames.contains(QUEUE_STORE)) {
        database.createObjectStore(QUEUE_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Nao foi possivel abrir o IndexedDB."));
  });
}

async function readSnapshot<T>(key: string): Promise<T | null> {
  const database = await openDatabase();
  if (!database) return null;

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(SNAPSHOT_STORE, "readonly");
    const store = transaction.objectStore(SNAPSHOT_STORE);
    const request = store.get(key);

    request.onsuccess = () => {
      const record = request.result as SnapshotRecord<T> | undefined;
      resolve(record?.value ?? null);
    };
    request.onerror = () => reject(request.error ?? new Error("Falha ao ler snapshot offline."));
  });
}

async function writeSnapshot<T>(key: string, value: T) {
  const database = await openDatabase();
  if (!database) return;

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(SNAPSHOT_STORE, "readwrite");
    const store = transaction.objectStore(SNAPSHOT_STORE);
    store.put({
      key,
      value: cloneForStorage(value),
      updatedAt: new Date().toISOString(),
    } satisfies SnapshotRecord<T>);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Falha ao salvar snapshot offline."));
  });
}

async function deleteFromStore(storeName: string, key: string) {
  const database = await openDatabase();
  if (!database) return;

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).delete(key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Falha ao remover item offline."));
  });
}

async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const database = await openDatabase();
  if (!database) return [];

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).getAll();
    request.onsuccess = () => resolve((request.result as T[]) ?? []);
    request.onerror = () => reject(request.error ?? new Error("Falha ao listar dados offline."));
  });
}

function emitSyncStatus(status: OfflineSyncStatus) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<OfflineSyncStatus>(STATUS_EVENT, { detail: status }));
}

export async function getOfflineSyncStatus(): Promise<OfflineSyncStatus> {
  if (!canUseIndexedDb()) {
    return { ...DEFAULT_SYNC_STATUS, isSupported: false };
  }

  const stored = await readSnapshot<OfflineSyncStatus>(STATUS_KEY);
  return stored ? { ...DEFAULT_SYNC_STATUS, ...stored, isSupported: true } : DEFAULT_SYNC_STATUS;
}

export async function updateOfflineSyncStatus(partial: Partial<OfflineSyncStatus>) {
  const next = { ...(await getOfflineSyncStatus()), ...partial };
  await writeSnapshot(STATUS_KEY, next);
  emitSyncStatus(next);
  return next;
}

export function subscribeOfflineSyncStatus(listener: (status: OfflineSyncStatus) => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = (event: Event) => {
    const detail = (event as CustomEvent<OfflineSyncStatus>).detail;
    if (detail) listener(detail);
  };

  window.addEventListener(STATUS_EVENT, handler);
  return () => window.removeEventListener(STATUS_EVENT, handler);
}

export async function initializeOfflineStore() {
  if (!canUseIndexedDb()) {
    return { ...DEFAULT_SYNC_STATUS, isSupported: false };
  }

  await openDatabase();

  const localUsers = window.localStorage.getItem(USERS_KEY);
  const localSession = window.localStorage.getItem(SESSION_KEY);
  const localSettings = window.localStorage.getItem(APP_SETTINGS_KEY);
  const localHelp = window.localStorage.getItem(HELP_REQUESTS_KEY);

  if (localUsers) {
    await writeSnapshot(createSnapshotKey("users"), JSON.parse(localUsers) as Usuario[]);
  } else {
    const storedUsers = await readSnapshot<Usuario[]>(createSnapshotKey("users"));
    if (storedUsers) window.localStorage.setItem(USERS_KEY, JSON.stringify(storedUsers));
  }

  if (localSession) {
    await writeSnapshot(createSnapshotKey("session"), localSession);
  } else {
    const storedSession = await readSnapshot<string>(createSnapshotKey("session"));
    if (storedSession) window.localStorage.setItem(SESSION_KEY, storedSession);
  }

  if (localSettings) {
    await writeSnapshot(createSnapshotKey("settings"), JSON.parse(localSettings) as Record<string, unknown>);
  } else {
    const storedSettings = await readSnapshot<Record<string, unknown>>(createSnapshotKey("settings"));
    if (storedSettings) window.localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(storedSettings));
  }

  if (localHelp) {
    await writeSnapshot(createSnapshotKey("helpRequests"), JSON.parse(localHelp) as HelpRequest[]);
  } else {
    const storedHelp = await readSnapshot<HelpRequest[]>(createSnapshotKey("helpRequests"));
    if (storedHelp) window.localStorage.setItem(HELP_REQUESTS_KEY, JSON.stringify(storedHelp));
  }

  const users = localUsers ? ((JSON.parse(localUsers) as Usuario[]) ?? []) : await readSnapshot<Usuario[]>(createSnapshotKey("users")) ?? [];
  for (const user of users) {
    const progressKey = `${PROGRESS_PREFIX}:${user.email}`;
    const historyKey = `${HISTORY_PREFIX}:${user.email}`;
    const localProgress = window.localStorage.getItem(progressKey);
    const localHistory = window.localStorage.getItem(historyKey);

    if (localProgress) {
      await writeSnapshot(createSnapshotKey("progress", user.email), JSON.parse(localProgress) as ProgressState);
    } else {
      const storedProgress = await readSnapshot<ProgressState>(createSnapshotKey("progress", user.email));
      if (storedProgress) window.localStorage.setItem(progressKey, JSON.stringify(storedProgress));
    }

    if (localHistory) {
      await writeSnapshot(createSnapshotKey("history", user.email), JSON.parse(localHistory) as SessionRecord[]);
    } else {
      const storedHistory = await readSnapshot<SessionRecord[]>(createSnapshotKey("history", user.email));
      if (storedHistory) window.localStorage.setItem(historyKey, JSON.stringify(storedHistory));
    }
  }

  const pending = await listPendingSyncOperations();
  return updateOfflineSyncStatus({ pendingCount: pending.length, isSupported: true });
}

export async function persistUsersSnapshot(users: Usuario[]) {
  await writeSnapshot(createSnapshotKey("users"), users);
}

export async function loadUsersSnapshot() {
  return (await readSnapshot<Usuario[]>(createSnapshotKey("users"))) ?? [];
}

export async function persistSessionSnapshot(email: string | null) {
  if (email) {
    await writeSnapshot(createSnapshotKey("session"), email);
    return;
  }
  await deleteFromStore(SNAPSHOT_STORE, createSnapshotKey("session"));
}

export async function loadSessionSnapshot() {
  return readSnapshot<string>(createSnapshotKey("session"));
}

export async function persistSettingsSnapshot(settings: Record<string, unknown>) {
  await writeSnapshot(createSnapshotKey("settings"), settings);
}

export async function persistProgressSnapshot(email: string, progress: ProgressState) {
  await writeSnapshot(createSnapshotKey("progress", email), progress);
}

export async function loadProgressSnapshot(email: string) {
  return readSnapshot<ProgressState>(createSnapshotKey("progress", email));
}

export async function persistSessionHistorySnapshot(email: string, history: SessionRecord[]) {
  await writeSnapshot(createSnapshotKey("history", email), history);
}

export async function loadSessionHistorySnapshot(email: string) {
  return readSnapshot<SessionRecord[]>(createSnapshotKey("history", email));
}

export async function persistHelpRequestsSnapshot(requests: HelpRequest[]) {
  await writeSnapshot(createSnapshotKey("helpRequests"), requests);
}

export async function loadHelpRequestsSnapshot() {
  return (await readSnapshot<HelpRequest[]>(createSnapshotKey("helpRequests"))) ?? [];
}

function mergePendingOperations(
  queue: PendingSyncOperation[],
  operation: PendingSyncOperation,
): PendingSyncOperation[] {
  if (operation.type === "saveProgress") {
    return [...queue.filter((item) => !(item.type === "saveProgress" && item.email === operation.email)), operation];
  }

  if (operation.type === "updateUserProfile") {
    const current = queue.find(
      (item): item is Extract<PendingSyncOperation, { type: "updateUserProfile" }> =>
        item.type === "updateUserProfile" && item.email === operation.email,
    );
    if (!current) return [...queue, operation];

    return [
      ...queue.filter((item) => item.id !== current.id),
      {
        ...operation,
        profile: {
          ...current.profile,
          ...operation.profile,
        },
      },
    ];
  }

  return [...queue, operation];
}

export async function enqueuePendingSyncOperation(
  operation: PendingSyncOperationInput,
) {
  const queue = await listPendingSyncOperations();
  const enriched = {
    ...operation,
    id: createOperationId(),
    createdAt: new Date().toISOString(),
  } as PendingSyncOperation;

  const nextQueue = mergePendingOperations(queue, enriched);
  const database = await openDatabase();
  if (!database) return enriched;

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(QUEUE_STORE, "readwrite");
    const store = transaction.objectStore(QUEUE_STORE);
    store.clear();
    nextQueue.forEach((item) => store.put(item));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Falha ao salvar fila offline."));
  });

  await updateOfflineSyncStatus({ pendingCount: nextQueue.length });
  return enriched;
}

export async function listPendingSyncOperations() {
  const queue = await getAllFromStore<PendingSyncOperation>(QUEUE_STORE);
  return queue.sort((left, right) => (left.createdAt < right.createdAt ? -1 : 1));
}

export async function removePendingSyncOperation(id: string) {
  await deleteFromStore(QUEUE_STORE, id);
  const pending = await listPendingSyncOperations();
  await updateOfflineSyncStatus({ pendingCount: pending.length });
}
