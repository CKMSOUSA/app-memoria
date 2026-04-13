"use client";

import type { HelpRequest } from "@/lib/types";
import { getStoredSupabaseSession, hasSupabaseAuthConfig } from "@/lib/supabase-auth";

type SupabaseHelpRow = {
  id: string;
  email: string;
  name: string;
  subject: string;
  message: string;
  created_at: string;
  status: HelpRequest["status"];
};

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
}

function getSupabaseKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";
}

async function helpFetch(path: string, init?: RequestInit) {
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

function toHelpRequest(row: SupabaseHelpRow): HelpRequest {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    subject: row.subject,
    message: row.message,
    createdAt: row.created_at,
    status: row.status,
  };
}

export async function loadSupabaseHelpRequests() {
  const response = await helpFetch(
    "/help_requests?select=id,email,name,subject,message,created_at,status&order=created_at.desc&limit=200",
    {
      method: "GET",
    },
  );

  if (!response?.ok) return null;
  const rows = (await response.json()) as SupabaseHelpRow[];
  return rows.map(toHelpRequest);
}

export async function appendSupabaseHelpRequest(request: Omit<HelpRequest, "id" | "createdAt" | "status">) {
  const response = await helpFetch("/help_requests", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify([
      {
        email: request.email,
        name: request.name,
        subject: request.subject,
        message: request.message,
      },
    ]),
  });

  if (!response?.ok) return null;
  return loadSupabaseHelpRequests();
}
