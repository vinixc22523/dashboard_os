"use client";

import { useMemo, useState } from "react";
import type { DashboardPayload } from "@/lib/types";
import { toRecords, metricsBy } from "@/lib/kpis";
import { filterByPeriod, listMonths } from "@/lib/period";
import { PeriodFilter } from "./PeriodFilter";
import { EquipmentTable } from "./EquipmentTable";
import { BreakdownChart } from "./BreakdownChart";

function countBy<T>(items: T[], keyFn: (item: T) => string) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item) || "Não informado";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].map(([name, value]) => ({ name, value }));
}

export function RelatoriosView({ payload }: { payload: DashboardPayload }) {
  const [period, setPeriod] = useState("all");
  const allRecords = useMemo(() => toRecords(payload.snapshot?.cards ?? []), [payload.snapshot]);
  const months = useMemo(() => listMonths(allRecords), [allRecords]);
  const records = useMemo(() => filterByPeriod(allRecords, period), [allRecords, period]);
  const byEquipment = useMemo(() => metricsBy(records, (r) => r.equipment), [records]);
  const byType = useMemo(() => countBy(records, (r) => r.type), [records]);
  const byPriority = useMemo(() => countBy(records, (r) => r.priority), [records]);

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

      <EquipmentTable title="Desempenho por equipamento" rows={byEquipment} />
    </main>
  );
}
