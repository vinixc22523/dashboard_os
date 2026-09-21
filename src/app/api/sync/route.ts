import { NextResponse } from "next/server";
import { runSync } from "@/lib/dashboard-data";

// Sincronização manual, disparada pelo botão "Atualizar" no header.
// Protegida por SYNC_SECRET: sem esse header, qualquer pessoa que descubra a
// URL poderia forçar chamadas ao Pipefy.
export async function POST(request: Request) {
  const secret = process.env.SYNC_SECRET;
  if (secret) {
    const header = request.headers.get("x-sync-secret");
    if (header !== secret) {
      return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
    }
  }

  try {
    const snapshot = await runSync("manual");
    return NextResponse.json({ ok: true, syncedAt: snapshot.syncedAt, total: snapshot.kpis.total });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[sync:manual]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
