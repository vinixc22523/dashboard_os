import type {
  EquipmentMetric,
  MaintenanceKpis,
  MaintenanceRecord,
  PipefyCard,
} from "./types";

export const DEFAULT_OPERATING_HOURS = 620;

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function pick(card: PipefyCard, matchers: ((key: string) => boolean)[]) {
  for (const match of matchers) {
    const field = card.fields.find((f) => match(normalize(f.name)));
    if (field?.value) return String(field.value).trim();
  }
  return "";
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const br = value.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (br) {
    const [, d, m, y, hh = "0", mm = "0", ss = "0"] = br;
    return new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss));
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isYes(value: string) {
  const v = normalize(value);
  return v === "sim" || v === "s" || v === "true" || v === "yes";
}

// Converte os cards crus do Pipefy em registros de manutenção, tentando
// localizar os campos certos mesmo que o nome exato do campo no Pipefy varie
// (ex.: "Equipamento", "Máquina/Ativo", "Local").
export function toRecords(cards: PipefyCard[]): MaintenanceRecord[] {
  return cards.map((card) => {
    const equipment =
      pick(card, [
        (k) => k.includes("equipament"),
        (k) => k.includes("maquina") && !k.includes("parada"),
        (k) => k.includes("ativo"),
        (k) => k.includes("local"),
      ]) || "Não informado";
    const technician =
      pick(card, [(k) => k.includes("tecnic"), (k) => k.includes("responsav")]) ||
      "Não informado";
    const type = pick(card, [(k) => k.includes("tipo")]) || "Não informado";
    const priority = pick(card, [(k) => k.includes("priorid")]) || "Não informado";
    const stopped = isYes(pick(card, [(k) => k.includes("parada")]));
    const startRaw = pick(card, [(k) => k.includes("inicio"), (k) => k.includes("abertura")]);
    const endRaw = pick(card, [
      (k) => k.includes("termino"),
      (k) => k.includes("encerr"),
      (k) => k.includes("fim"),
    ]);

    const start = parseDate(startRaw) ?? parseDate(card.createdAt);
    const end = parseDate(endRaw) ?? (card.finishedAt ? parseDate(card.finishedAt) : null);

    // Teto de sanidade: 30 dias contínuos de máquina parada já é um valor
    // extremo para uma única OS. Isso protege o painel contra erro de
    // digitação de data no Pipefy (ex.: alguém digitar o ano "0202" em vez
    // de "2026"), que senão inflaria MTTR/downtime para milhares de anos.
    const MAX_PLAUSIBLE_DOWNTIME_HOURS = 24 * 30;
    let downtimeHours = 0;
    if (stopped && start && end) {
      const diff = (end.getTime() - start.getTime()) / 3_600_000;
      const plausible = diff > 0 && Number.isFinite(diff) && diff <= MAX_PLAUSIBLE_DOWNTIME_HOURS;
      downtimeHours = plausible ? Math.round(diff * 1000) / 1000 : 0;
    }

    const osNumber = card.title.match(/\d+/)?.[0] ?? card.id;

    return {
      id: card.id,
      osNumber,
      title: card.title,
      equipment,
      technician,
      type,
      priority,
      stopped,
      startedAt: start ? start.toISOString() : null,
      endedAt: end ? end.toISOString() : null,
      downtimeHours,
      createdAt: card.createdAt,
      phaseName: card.phaseName,
      done: card.done,
      late: card.late,
    };
  });
}

export function computeMaintenanceKpis(
  records: MaintenanceRecord[],
  operatingHours = DEFAULT_OPERATING_HOURS,
): MaintenanceKpis {
  const totalOs = records.length;
  const failures = records.filter((r) => r.stopped);
  const downtime = failures.reduce((sum, r) => sum + r.downtimeHours, 0);
  const mttr = failures.length ? downtime / failures.length : 0;
  // MTBF = tempo disponível / número de falhas.
  const upTime = Math.max(operatingHours - downtime, 0);
  const mtbf = failures.length ? upTime / failures.length : operatingHours;
  const availability = operatingHours > 0 ? (upTime / operatingHours) * 100 : 100;

  return {
    totalOs,
    failures: failures.length,
    downtime: Math.round(downtime * 10) / 10,
    mttr: Math.round(mttr * 10) / 10,
    mtbf: Math.round(mtbf * 10) / 10,
    availability: Math.round(availability * 10) / 10,
    operatingHours,
  };
}

// Agrupa registros por uma chave qualquer (equipamento, técnico, tipo...) e
// calcula os mesmos indicadores de manutenção para cada grupo.
export function metricsBy(
  records: MaintenanceRecord[],
  keyFn: (record: MaintenanceRecord) => string,
): EquipmentMetric[] {
  const groups = new Map<string, MaintenanceRecord[]>();
  for (const record of records) {
    const key = keyFn(record);
    const list = groups.get(key) ?? [];
    list.push(record);
    groups.set(key, list);
  }

  return [...groups.entries()]
    .map(([equipment, list]) => {
      const kpis = computeMaintenanceKpis(list, DEFAULT_OPERATING_HOURS);
      return {
        equipment,
        os: list.length,
        failures: kpis.failures,
        downtime: kpis.downtime,
        mttr: kpis.mttr,
        availability: kpis.availability,
      };
    })
    .sort((a, b) => b.os - a.os);
}

export function equipmentBreakdown(records: MaintenanceRecord[]): EquipmentMetric[] {
  return metricsBy(records, (r) => r.equipment);
}

export function volumeSeries(records: MaintenanceRecord[], days = 30) {
  const buckets = new Map<string, number>();
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86_400_000);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const record of records) {
    const key = record.createdAt.slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return [...buckets.entries()].map(([date, total]) => ({ date, total }));
}
