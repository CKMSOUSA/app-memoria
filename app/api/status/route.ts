import { NextResponse } from "next/server";

export function GET() {
  const mode = process.env.NEXT_PUBLIC_APP_DATA_MODE === "remote" ? "remote" : "local";
  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());
  const hasAdminServer =
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) &&
    Boolean(
      process.env.ADMIN_SERVER_CODE?.trim() || process.env.NEXT_PUBLIC_ADMIN_CONFIRM_CODE?.trim(),
    );

  return NextResponse.json({
    ok: true,
    message: "API pronta para integrar autenticacao, perfil e progresso online.",
    storageMode: mode,
    provider: hasSupabase ? "supabase" : "nao configurado",
    remoteReady: mode === "remote" && hasSupabase,
    adminOnlineReady: hasSupabase && hasAdminServer,
    timestamp: new Date().toISOString(),
  });
}
