import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    message: "API pronta para integrar autenticacao, perfil e progresso online.",
    storageMode: process.env.NEXT_PUBLIC_APP_DATA_MODE === "remote" ? "remote" : "local",
    timestamp: new Date().toISOString(),
  });
}
