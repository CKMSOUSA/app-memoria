"use client";

import { createDefaultProgress, mergeProgress } from "@/lib/scoring";
import type { ChallengeProgress, ProgressState, SessionMode } from "@/lib/types";
import { getStoredSupabaseSession, hasSupabaseAuthConfig } from "@/lib/supabase-auth";

type SupabaseProgressRow = {
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

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
}

function getSupabaseKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";
}

async function progressFetch(path: string, init?: RequestInit) {
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

function assignChallengeProgress(target: ProgressState, row: SupabaseProgressRow) {
  const modeMap = target[row.mode] as Record<number, ChallengeProgress>;
  modeMap[row.challenge_id] = {
    attempts: row.attempts,
    bestScore: row.best_score,
    lastScore: row.last_score,
    bestTimeSeconds: row.best_time_seconds,
    completed: row.completed,
    lastPlayedAt: row.last_played_at,
    lastVariationIndex: row.last_variation_index,
  };
}

function flattenProgress(email: string, progress: ProgressState): SupabaseProgressRow[] {
  const rows: SupabaseProgressRow[] = [];
  const modes = Object.keys(progress) as SessionMode[];

  for (const mode of modes) {
    const challengeMap = progress[mode] as Record<number, ChallengeProgress>;
    for (const [challengeId, item] of Object.entries(challengeMap)) {
      rows.push({
        email,
        mode,
        challenge_id: Number(challengeId),
        attempts: item.attempts,
        best_score: item.bestScore,
        last_score: item.lastScore,
        best_time_seconds: item.bestTimeSeconds,
        completed: item.completed,
        last_played_at: item.lastPlayedAt,
        last_variation_index: item.lastVariationIndex,
      });
    }
  }

  return rows;
}

export async function loadSupabaseProgress(email: string) {
  const response = await progressFetch(
    `/user_progress?email=eq.${encodeURIComponent(email)}&select=email,mode,challenge_id,attempts,best_score,last_score,best_time_seconds,completed,last_played_at,last_variation_index`,
    {
      method: "GET",
    },
  );

  if (!response?.ok) return null;
  const rows = (await response.json()) as SupabaseProgressRow[];
  if (!rows.length) return createDefaultProgress();

  const next = mergeProgress();
  for (const row of rows) {
    assignChallengeProgress(next, row);
  }

  return next;
}

export async function saveSupabaseProgress(email: string, progress: ProgressState) {
  const rows = flattenProgress(email, progress);
  const response = await progressFetch("/user_progress", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(rows),
  });

  return Boolean(response?.ok);
}
