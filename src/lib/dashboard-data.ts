import "server-only";
import { supabaseAdmin } from "./supabase-admin";
import { fetchPipeSnapshot } from "./pipefy";
import { toRecords, computeMaintenanceKpis } from "./kpis";
import { buildDemoSnapshot } from "./demo";
import type { DashboardPayload, PipefySnapshot } from "./types";

function mapSnapshotRow(row: Record<string, unknown>): PipefySnapshot {
  return {
    id: String(row.id),
    pipeId: String(row.pipe_id),
    pipeName: (row.pipe_name as string | null) ?? null,
    syncedAt: String(row.synced_at),
    source: row.source as PipefySnapshot["source"],
    status: row.status as PipefySnapshot["status"],
    errorMessage: (row.error_message as string | null) ?? null,
    kpis: row.kpis as PipefySnapshot["kpis"],
    phases: (row.phases ?? []) as PipefySnapshot["phases"],
    cards: (row.cards ?? []) as PipefySnapshot["cards"],
  };
}

// Lê o Pipe ID configurado. Prioriza a variável de ambiente PIPEFY_PIPE_ID;
// se não existir, cai para o que estiver salvo na tabela pipefy_config (para
// permitir trocar o pipe sem precisar de um novo deploy).
async function resolvePipeId(): Promise<string | null> {
  if (process.env.PIPEFY_PIPE_ID) return process.env.PIPEFY_PIPE_ID;
  try {
    const { data } = await supabaseAdmin()
      .from("pipefy_config")
      .select("pipe_id")
      .limit(1)
      .maybeSingle();
    return (data?.pipe_id as string | null) ?? null;
  } catch {
    // Supabase ainda não configurado (.env vazio): segue em modo demo em vez
    // de derrubar a página.
    return null;
  }
}

// Retorna o snapshot mais recente salvo no banco, ou dados de demonstração
// se o Pipefy ainda não estiver configurado. É isso que a interface lê;
// nunca chama o Pipefy diretamente (quem faz isso é runSync).
export async function getDashboardPayload(): Promise<DashboardPayload> {
  const pipeId = await resolvePipeId();
  const token = process.env.PIPEFY_API_TOKEN;
  const configured = Boolean(pipeId && token);

  console.log(
    `[dashboard-data] pipeId=${pipeId ? "set" : "null"} token=${token ? "set" : "null"} configured=${configured}`,
  );

  if (!configured) {
    return { configured: false, demo: true, pipeId, snapshot: buildDemoSnapshot() };
  }

  try {
    const { data, error, status, statusText } = await supabaseAdmin()
      .from("pipefy_snapshots")
      .select("*")
      .eq("status", "success")
      .order("synced_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log(
      `[dashboard-data] query status=${status} statusText=${statusText} error=${error ? JSON.stringify(error) : "null"} dataFound=${Boolean(data)}`,
    );

    if (error || !data) {
      // Configurado mas ainda sem nenhuma sincronização bem-sucedida: mostra
      // demonstração e deixa claro que falta rodar o primeiro sync.
      return { configured: true, demo: true, pipeId, snapshot: buildDemoSnapshot() };
    }

    return { configured: true, demo: false, pipeId, snapshot: mapSnapshotRow(data) };
  } catch (err) {
    console.error("[dashboard-data] falha ao ler snapshot:", err);
    return { configured: true, demo: true, pipeId, snapshot: buildDemoSnapshot() };
  }
}

// Executa a sincronização de verdade com o Pipefy e salva um novo snapshot.
// Chamada pela rota manual (/api/sync) e pela rota de cron (/api/cron).
export async function runSync(source: "manual" | "scheduled"): Promise<PipefySnapshot> {
  const pipeId = await resolvePipeId();
  if (!pipeId) throw new Error("Pipe ID não configurado (PIPEFY_PIPE_ID ou pipefy_config).");

  const token = process.env.PIPEFY_API_TOKEN;
  if (!token) throw new Error("Variável PIPEFY_API_TOKEN não configurada no servidor.");

  const admin = supabaseAdmin();

  try {
    const { pipeName, phases, cards } = await fetchPipeSnapshot(pipeId, token);
    const records = toRecords(cards);
    const maintenanceKpis = computeMaintenanceKpis(records);
    const total = cards.length;
    const late = cards.filter((c) => c.late).length;
    const done = cards.filter((c) => c.done).length;

    const { data, error } = await admin
      .from("pipefy_snapshots")
      .insert({
        pipe_id: pipeId,
        pipe_name: pipeName,
        source,
        status: "success",
        kpis: {
          total,
          onTime: total - late,
          late,
          avgCycleHours: maintenanceKpis.mttr,
          conversionRate: total ? Math.round((done / total) * 1000) / 10 : 0,
        },
        phases,
        cards,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return mapSnapshotRow(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await admin.from("pipefy_snapshots").insert({
      pipe_id: pipeId,
      source,
      status: "error",
      error_message: message,
    });
    throw new Error(message);
  }
}
