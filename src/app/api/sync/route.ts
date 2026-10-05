import { NextResponse } from "next/server";
import { runSync } from "@/lib/dashboard-data";
import { supabaseServer } from "@/lib/supabase/server";
import { canSync } from "@/lib/sync-access";

// Sincronização manual, disparada pelo botão "Atualizar agora" no header.
// Autorizada de duas formas:
//   1. Usuário logado cujo e-mail está na lista SYNC_ALLOWED_EMAILS.
//   2. Chamada externa com o header x-sync-secret igual a SYNC_SECRET.
// Sem nenhuma das duas, qualquer pessoa que descubra a URL poderia forçar
// chamadas ao Pipefy.
export async function POST(request: Request) {
  const secret = process.env.SYNC_SECRET;
  const hasValidSecret = Boolean(secret) && request.headers.get("x-sync-secret") === secret;

  if (!hasValidSecret) {
    const supabase = await supabaseServer();
    const { data } = await supabase.auth.getUser();
    if (!canSync(data.user?.email)) {
      return NextResponse.json(
        { ok: false, error: "Você não tem permissão para sincronizar." },
        { status: 403 },
      );
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
