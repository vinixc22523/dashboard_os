import { NextResponse } from "next/server";
import { runSync } from "@/lib/dashboard-data";

// Chamada automaticamente pelo Vercel Cron (veja vercel.json) uma vez por
// dia. É isso que faz os dados aparecerem sozinhos, sem ninguém precisar
// abrir o painel e clicar em nada.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = request.headers.get("authorization");
    if (header !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
    }
  }

  try {
    const snapshot = await runSync("scheduled");
    return NextResponse.json({ ok: true, syncedAt: snapshot.syncedAt, total: snapshot.kpis.total });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[sync:cron]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
