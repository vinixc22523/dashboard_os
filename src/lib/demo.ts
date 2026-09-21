import type { PipefyCard, PipefyLabel, PipefyPhase, PipefySnapshot } from "./types";
import { toRecords, computeMaintenanceKpis, DEFAULT_OPERATING_HOURS } from "./kpis";

// Dados de demonstração, gerados de forma determinística (mesma seed sempre
// produz o mesmo resultado), para o painel funcionar antes de configurar o
// Pipefy de verdade.
const DEMO_PHASES = [
  "Solicitação",
  "Triagem técnica",
  "Orçamento",
  "Execução",
  "Validação",
  "Finalizada",
];
const DEMO_LABELS: PipefyLabel[] = [
  { id: "l1", name: "Urgente", color: "#f87171" },
  { id: "l2", name: "Preventiva", color: "#34d399" },
  { id: "l3", name: "Corretiva", color: "#818cf8" },
  { id: "l4", name: "Garantia", color: "#fbbf24" },
];
const DEMO_EQUIPMENT = [
  "TRI01",
  "TRI02",
  "SECCIONADORA",
  "DESTOPADEIRA",
  "TORRE DE RESFRIAMENTO",
  "MAQ03",
  "MAQ05",
  "BARRACÃO",
  "PREDIAL",
];
const DEMO_TECHS = ["Glauco Savioli", "Josemar Rosa", "Marco Carneiro", "Rafael Cruz", "Eduardo Lima"];
const DEMO_TYPES = ["CORRETIVA", "PREVENTIVA", "MELHORIA", "SETUP"];
const DEMO_PRIORITIES = ["Emergencial", "Média", "Baixa"];

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function buildDemoSnapshot(): PipefySnapshot {
  const rand = rng(20260921);
  const base = new Date();
  base.setUTCHours(12, 0, 0, 0);
  const cards: PipefyCard[] = [];

  for (let i = 0; i < 96; i++) {
    const phaseIndex = Math.floor(rand() * DEMO_PHASES.length);
    const phaseName = DEMO_PHASES[phaseIndex] as string;
    const done = phaseName === "Finalizada";
    const createdAt = new Date(base.getTime() - Math.floor(rand() * 29) * 86_400_000);
    const dueDate = new Date(createdAt.getTime() + (2 + Math.floor(rand() * 10)) * 86_400_000);
    const finishedAt = done
      ? new Date(createdAt.getTime() + (1 + Math.floor(rand() * 9)) * 86_400_000)
      : null;
    const late = !done && dueDate.getTime() < base.getTime();
    const equipment = DEMO_EQUIPMENT[Math.floor(rand() * DEMO_EQUIPMENT.length)] as string;
    const stopped = rand() > 0.6;
    const start = new Date(createdAt.getTime() + Math.floor(rand() * 8) * 3_600_000);
    const durationMin = 10 + Math.floor(rand() * 300);
    const end = new Date(start.getTime() + durationMin * 60_000);

    cards.push({
      id: `demo-${i + 1}`,
      title: `OS-${2400 + i} — ${equipment}`,
      phaseId: `p${phaseIndex}`,
      phaseName,
      labels: rand() > 0.45 ? [DEMO_LABELS[Math.floor(rand() * DEMO_LABELS.length)] as PipefyLabel] : [],
      fields: [
        { name: "Equipamento", value: equipment },
        {
          name: "Tipo de Manutenção",
          value: (rand() > 0.25
            ? DEMO_TYPES[0]
            : DEMO_TYPES[1 + Math.floor(rand() * (DEMO_TYPES.length - 1))]) as string,
        },
        { name: "Prioridade", value: DEMO_PRIORITIES[Math.floor(rand() * DEMO_PRIORITIES.length)] as string },
        { name: "Máquina Parada", value: stopped ? "Sim" : "Não" },
        { name: "Início da Ocorrência", value: start.toISOString() },
        { name: "Término da Ocorrência", value: end.toISOString() },
        { name: "Técnico(s)", value: DEMO_TECHS[Math.floor(rand() * DEMO_TECHS.length)] as string },
      ],
      createdAt: createdAt.toISOString(),
      dueDate: dueDate.toISOString(),
      finishedAt: finishedAt ? finishedAt.toISOString() : null,
      done,
      late,
    });
  }

  const phases: PipefyPhase[] = DEMO_PHASES.map((name, index) => ({
    id: `p${index}`,
    name,
    done: name === "Finalizada",
    cardsCount: cards.filter((c) => c.phaseName === name).length,
  }));

  const records = toRecords(cards);
  const maintenanceKpis = computeMaintenanceKpis(records, DEFAULT_OPERATING_HOURS);
  const total = cards.length;
  const late = cards.filter((c) => c.late).length;
  const done = cards.filter((c) => c.done).length;

  return {
    id: "demo-snapshot",
    pipeId: "demo",
    pipeName: "Ordem de Serviço (demonstração)",
    syncedAt: new Date().toISOString(),
    source: "demo",
    status: "success",
    errorMessage: null,
    kpis: {
      total,
      onTime: total - late,
      late,
      avgCycleHours: maintenanceKpis.mttr,
      conversionRate: total ? Math.round((done / total) * 1000) / 10 : 0,
    },
    phases,
    cards,
  };
}
