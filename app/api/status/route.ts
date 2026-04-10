import { NextResponse } from "next/server";

export function GET() {
  const mode = process.env.NEXT_PUBLIC_APP_DATA_MODE === "remote" ? "remote" : "local";
  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());

  return NextResponse.json({
    ok: true,
    message: "API pronta para integrar autenticacao, perfil e progresso online.",
    storageMode: mode,
    provider: hasSupabase ? "supabase" : "nao configurado",
    remoteReady: mode === "remote" && hasSupabase,
    timestamp: new Date().toISOString(),
  });
}
