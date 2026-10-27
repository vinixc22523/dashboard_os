import "server-only";
import { supabaseAdmin } from "./supabase-admin";
import { fetchPipeSnapshot } from "./pipefy";
import { toRecords, computeMaintenanceKpis } from "./kpis";
import { buildDemoSnapshot } from "./demo";
import type { DashboardPayload, PipefyCard, PipefySnapshot } from "./types";

// O Pipefy às vezes devolve o campo "Responsável" vazio ("[]") para OS antigas
// (aconteceu em 21/10/2026, quando ~300 OS perderam o nome). Para não perder o
// histórico de quem atendeu cada OS, copiamos o Responsável do snapshot anterior
// para toda OS que veio sem ele agora. OS que já têm "Técnico envolvido" ou um
// Responsável preenchido não são alteradas.
const RESPONSAVEL = "responsavel";

function normName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function isEmptyFieldValue(value: unknown) {
  const v = String(value ?? "").trim();
  return v === "" || v === "[]";
}

function carryForwardResponsavel(
  cards: PipefyCard[],
  previousCards: PipefyCard[],
): PipefyCard[] {
  const previousById = new Map<string, string>();
  for (const prev of previousCards) {
    const field = prev.fields.find(
      (f) => normName(f.name) === RESPONSAVEL && !isEmptyFieldValue(f.value),
    );
    if (field) previousById.set(prev.id, String(field.value));
  }
  if (previousById.size === 0) return cards;

  return cards.map((card) => {
    const hasResponsavel = card.fields.some(
      (f) => normName(f.name) === RESPONSAVEL && !isEmptyFieldValue(f.value),
    );
    if (hasResponsavel) return card;
    const old = previousById.get(card.id);
    if (!old) return card;
    return {
      ...card,
      fields: [
        ...card.fields.filter((f) => normName(f.name) !== RESPONSAVEL),
        { name: "Responsável", value: old },
      ],
    };
  });
}


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
    const fetched = await fetchPipeSnapshot(pipeId, token);
    const { pipeName, phases } = fetched;

    // Snapshot anterior (último com sucesso), usado para não perder o
    // Responsável de OS antigas quando o Pipefy devolve o campo vazio.
    const { data: previous } = await admin
      .from("pipefy_snapshots")
      .select("cards")
      .eq("status", "success")
      .order("synced_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const cards = carryForwardResponsavel(
      fetched.cards,
      ((previous?.cards ?? []) as PipefyCard[]),
    );

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
