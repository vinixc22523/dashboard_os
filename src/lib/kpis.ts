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

// O campo "técnico" no Pipefy permite selecionar mais de uma pessoa, e o valor
// bruto do card chega como uma string de array JSON, ex.: '["Glauco Savioli",
// "Marco Carneiro "]'. Esta função separa isso em nomes individuais, já
// aparados, para que cada técnico possa ser contabilizado separadamente em vez
// de a combinação inteira virar um "técnico" novo.
export function parseTechnicianNames(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return ["Não informado"];
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        const names = parsed.map((v) => String(v).trim()).filter(Boolean);
        return names.length ? names : ["Não informado"];
      }
    } catch {
      // valor não era um JSON válido: segue para o fallback abaixo.
    }
  }
  return [trimmed];
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
    const technicianRaw =
      pick(card, [(k) => k.includes("tecnic"), (k) => k.includes("responsav")]) ||
      "Não informado";
    const technicians = parseTechnicianNames(technicianRaw);
    const technician = technicians.join(", ");
    const type = pick(card, [(k) => k.includes("tipo")]) || "Não informado";
    // Campo "Manutenção" no Pipefy: Corretiva / Preventiva / Serviço interno /
    // Melhoria / Setup. É diferente do campo "Tipo de serviço" (Mecânica,
    // Elétrica, Predial...) acima. Casamento exato (não "includes") porque
    // "Início da Manutenção" (uma data) também contém a palavra "manutenção" e
    // não pode ser confundido com este campo.
    const maintenanceNature =
      pick(card, [(k) => k === "manutencao"]) || "Não informado";
    const isCorrective = normalize(maintenanceNature) === "corretiva";
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
      technicians,
      type,
      maintenanceNature,
      isCorrective,
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

// Estima quantas horas de calendário o conjunto de registros cobre, a partir
// da data mais antiga até a mais recente (criação ou conclusão). Usado como
// base de "horas de operação" quando nenhum valor fixo é informado, para que
// disponibilidade/MTBF continuem fazendo sentido tanto filtrando um mês
// quanto olhando todo o histórico.
function estimateOperatingHours(records: MaintenanceRecord[]): number {
  if (!records.length) return DEFAULT_OPERATING_HOURS;
  let min = Infinity;
  let max = -Infinity;
  for (const r of records) {
    const created = new Date(r.createdAt).getTime();
    if (Number.isFinite(created)) {
      min = Math.min(min, created);
      max = Math.max(max, created);
    }
    if (r.endedAt) {
      const ended = new Date(r.endedAt).getTime();
      if (Number.isFinite(ended)) max = Math.max(max, ended);
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return DEFAULT_OPERATING_HOURS;
  const spanHours = (max - min) / 3_600_000;
  return Math.max(spanHours, DEFAULT_OPERATING_HOURS);
}

// Amostra usada em Downtime/MTTR/MTBF/Disponibilidade: só OS já concluídas
// (tempo de parada final, não sujeito a mudar) e de natureza corretiva (MTTR/
// MTBF medem reparo depois de falha; preventiva, melhoria, setup e serviço
// interno não entram nessa conta).
export function isReliabilitySample(record: MaintenanceRecord): boolean {
  return record.done && record.isCorrective;
}

export function computeMaintenanceKpis(
  records: MaintenanceRecord[],
  operatingHours?: number,
): MaintenanceKpis {
  const resolvedOperatingHours = operatingHours ?? estimateOperatingHours(records);
  const totalOs = records.length;
  const failures = records.filter((r) => r.stopped);
  const downtime = failures.reduce((sum, r) => sum + r.downtimeHours, 0);
  const mttr = failures.length ? downtime / failures.length : 0;
  // MTBF = tempo disponível / número de falhas.
  const upTime = Math.max(resolvedOperatingHours - downtime, 0);
  const mtbf = failures.length ? upTime / failures.length : resolvedOperatingHours;
  const availability =
    resolvedOperatingHours > 0 ? (upTime / resolvedOperatingHours) * 100 : 100;
  const operatingHoursRounded = Math.round(resolvedOperatingHours);

  return {
    totalOs,
    failures: failures.length,
    downtime: Math.round(downtime * 10) / 10,
    mttr: Math.round(mttr * 10) / 10,
    mtbf: Math.round(mtbf * 10) / 10,
    availability: Math.round(availability * 10) / 10,
    operatingHours: operatingHoursRounded,
  };
}

// Agrupa registros por uma chave qualquer (equipamento, técnico, tipo...) e
// calcula os mesmos indicadores de manutenção para cada grupo.
//
// "OS" e "Falhas" contam todos os chamados (abertos ou concluídos, de
// qualquer natureza), mas Downtime/MTTR/Disponibilidade só usam OS já
// concluídas e de natureza corretiva (ver isReliabilitySample).
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

  // Todos os grupos usam a mesma base de horas (o período coberto pelas OS
  // corretivas concluídas do conjunto completo), para que a disponibilidade
  // de cada equipamento ou técnico seja comparável entre si.
  const sharedOperatingHours = computeMaintenanceKpis(
    records.filter(isReliabilitySample),
  ).operatingHours;

  return [...groups.entries()]
    .map(([equipment, list]) => {
      const reliability = computeMaintenanceKpis(
        list.filter(isReliabilitySample),
        sharedOperatingHours,
      );
      return {
        equipment,
        os: list.length,
        failures: list.filter((r) => r.stopped).length,
        downtime: reliability.downtime,
        mttr: reliability.mttr,
        availability: reliability.availability,
      };
    })
    .sort((a, b) => b.os - a.os);
}

export function equipmentBreakdown(records: MaintenanceRecord[]): EquipmentMetric[] {
  return metricsBy(records, (r) => r.equipment);
}

// Igual a metricsBy, mas um mesmo registro pode entrar em mais de um grupo ao
// mesmo tempo (ex.: uma OS com dois técnicos responsáveis conta um serviço
// para cada um deles, em vez de virar um grupo "combinado" novo).
export function metricsByMulti(
  records: MaintenanceRecord[],
  keysFn: (record: MaintenanceRecord) => string[],
): EquipmentMetric[] {
  const groups = new Map<string, MaintenanceRecord[]>();
  for (const record of records) {
    const keys = new Set(keysFn(record).map((k) => k.trim()).filter(Boolean));
    for (const key of keys.size ? keys : ["Não informado"]) {
      const list = groups.get(key) ?? [];
      list.push(record);
      groups.set(key, list);
    }
  }

  // Mesma base de horas de todo o conjunto original (não duplicado), a partir
  // das OS corretivas já concluídas, para que a disponibilidade continue
  // comparável entre pessoas/grupos.
  const sharedOperatingHours = computeMaintenanceKpis(
    records.filter(isReliabilitySample),
  ).operatingHours;

  return [...groups.entries()]
    .map(([equipment, list]) => {
      const reliability = computeMaintenanceKpis(
        list.filter(isReliabilitySample),
        sharedOperatingHours,
      );
      return {
        equipment,
        os: list.length,
        failures: list.filter((r) => r.stopped).length,
        downtime: reliability.downtime,
        mttr: reliability.mttr,
        availability: reliability.availability,
      };
    })
    .sort((a, b) => b.os - a.os);
}

export function technicianBreakdown(records: MaintenanceRecord[]): EquipmentMetric[] {
  return metricsByMulti(records, (r) => r.technicians);
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
