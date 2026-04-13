"use client";

import type { SessionRecord } from "@/lib/types";
import { getStoredSupabaseSession, hasSupabaseAuthConfig } from "@/lib/supabase-auth";

type SupabaseHistoryRow = {
  id: string;
  email: string;
  mode: SessionRecord["mode"];
  challenge_id: number;
  score: number;
  time_seconds: number;
  completed: boolean;
  played_at: string;
};

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
}

function getSupabaseKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";
}

async function historyFetch(path: string, init?: RequestInit) {
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

function toSessionRecord(row: SupabaseHistoryRow): SessionRecord {
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

export async function loadSupabaseSessionHistory(email: string) {
  const response = await historyFetch(
    `/session_history?email=eq.${encodeURIComponent(email)}&select=id,email,mode,challenge_id,score,time_seconds,completed,played_at&order=played_at.desc&limit=120`,
    {
      method: "GET",
    },
  );

  if (!response?.ok) return null;
  const rows = (await response.json()) as SupabaseHistoryRow[];
  return rows.map(toSessionRecord);
}

export async function appendSupabaseSessionHistory(email: string, record: Omit<SessionRecord, "id" | "email">) {
  const response = await historyFetch("/session_history", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify([
      {
        email,
        mode: record.mode,
        challenge_id: record.challengeId,
        score: record.score,
        time_seconds: record.timeSeconds,
        completed: record.completed,
        played_at: record.playedAt,
      },
    ]),
  });

  if (!response?.ok) return null;
  return loadSupabaseSessionHistory(email);
}
