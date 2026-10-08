"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CalendarCheck, CheckCircle2, Wrench } from "lucide-react";
import type { DashboardPayload, MaintenanceRecord } from "@/lib/types";
import { toRecords, metricsBy } from "@/lib/kpis";
import { filterByPeriod, listMonths } from "@/lib/period";
import { PeriodFilter } from "./PeriodFilter";
import { EquipmentTable } from "./EquipmentTable";
import { BreakdownChart } from "./BreakdownChart";
import { StatCard } from "./StatCard";

function countBy<T>(items: T[], keyFn: (item: T) => string) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item) || "Não informado";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].map(([name, value]) => ({ name, value }));
}

type PreventiveRow = {
  equipment: string;
  total: number;
  done: number;
  open: number;
  late: number;
};

function preventiveByEquipment(records: MaintenanceRecord[]): PreventiveRow[] {
  const groups = new Map<string, PreventiveRow>();
  for (const r of records) {
    const row = groups.get(r.equipment) ?? {
      equipment: r.equipment,
      total: 0,
      done: 0,
      open: 0,
      late: 0,
    };
    row.total += 1;
    if (r.done) row.done += 1;
    else row.open += 1;
    if (r.late) row.late += 1;
    groups.set(r.equipment, row);
  }
  return [...groups.values()].sort((a, b) => b.total - a.total);
}

export function RelatoriosView({ payload }: { payload: DashboardPayload }) {
  const [period, setPeriod] = useState("all");
  const allRecords = useMemo(() => toRecords(payload.snapshot?.cards ?? []), [payload.snapshot]);
  const months = useMemo(() => listMonths(allRecords), [allRecords]);
  const records = useMemo(() => filterByPeriod(allRecords, period), [allRecords, period]);
  const byEquipment = useMemo(() => metricsBy(records, (r) => r.equipment), [records]);
  const byType = useMemo(() => countBy(records, (r) => r.type), [records]);
  const byPriority = useMemo(() => countBy(records, (r) => r.priority), [records]);
  const byNature = useMemo(() => countBy(records, (r) => r.maintenanceNature), [records]);

  const preventive = useMemo(() => records.filter((r) => r.isPreventive), [records]);
  const preventiveDone = preventive.filter((r) => r.done).length;
  const preventiveOpen = preventive.length - preventiveDone;
  const preventiveLate = preventive.filter((r) => r.late).length;
  const preventiveShare = records.length
    ? Math.round((preventive.length / records.length) * 1000) / 10
    : 0;
  const preventiveRows = useMemo(() => preventiveByEquipment(preventive), [preventive]);

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Relatórios</h2>
        <PeriodFilter value={period} onChange={setPeriod} months={months} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <BreakdownChart title="Chamados por tipo de manutenção" data={byType} />
        <BreakdownChart title="Chamados por prioridade" data={byPriority} />
      </div>

      <section className="space-y-4">
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          Manutenção preventiva
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="OS preventivas"
            value={String(preventive.length)}
            hint={`${preventiveShare}% do total de OS do período`}
            Icon={CalendarCheck}
          />
          <StatCard
            label="Concluídas"
            value={String(preventiveDone)}
            hint="Preventivas já finalizadas"
            Icon={CheckCircle2}
            tone="success"
          />
          <StatCard
            label="Em andamento"
            value={String(preventiveOpen)}
            hint="Preventivas ainda abertas"
            Icon={Wrench}
            tone="info"
          />
          <StatCard
            label="Em atraso"
            value={String(preventiveLate)}
            hint="Abertas e fora do prazo"
            Icon={AlertTriangle}
            tone="warning"
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <BreakdownChart title="Chamados por natureza da manutenção" data={byNature} />

          <div className="glass rise-in rounded-2xl p-4">
            <h3 className="text-sm font-medium text-foreground">Preventivas por equipamento</h3>
            <p className="mb-3 text-xs text-muted">
              Todas as OS com Manutenção = Preventiva, abertas ou concluídas
            </p>
            <div className="max-h-64 overflow-auto">
              <table>
                <thead>
                  <tr>
                    <th>Equipamento</th>
                    <th>OS</th>
                    <th>Concluídas</th>
                    <th>Em andamento</th>
                    <th>Em atraso</th>
                  </tr>
                </thead>
                <tbody>
                  {preventiveRows.map((r) => (
                    <tr key={r.equipment}>
                      <td className="font-medium text-foreground">{r.equipment}</td>
                      <td>{r.total}</td>
                      <td>{r.done}</td>
                      <td>{r.open}</td>
                      <td className={r.late > 0 ? "text-destructive" : undefined}>{r.late}</td>
                    </tr>
                  ))}
                  {preventiveRows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted">
                        Sem preventivas no período selecionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <EquipmentTable title="Desempenho por equipamento" rows={byEquipment} />
    </main>
  );
}
