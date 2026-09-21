"use client";

import { useMemo, useState } from "react";
import type { DashboardPayload } from "@/lib/types";
import { toRecords, metricsBy } from "@/lib/kpis";
import { filterByPeriod, listMonths } from "@/lib/period";
import { PeriodFilter } from "./PeriodFilter";
import { EquipmentTable } from "./EquipmentTable";
import { StatCard } from "./StatCard";
import { Users } from "lucide-react";

export function TecnicosView({ payload }: { payload: DashboardPayload }) {
  const [period, setPeriod] = useState("all");
  const allRecords = useMemo(() => toRecords(payload.snapshot?.cards ?? []), [payload.snapshot]);
  const months = useMemo(() => listMonths(allRecords), [allRecords]);
  const records = useMemo(() => filterByPeriod(allRecords, period), [allRecords, period]);
  const byTechnician = useMemo(() => metricsBy(records, (r) => r.technician), [records]);

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Técnicos</h2>
        <PeriodFilter value={period} onChange={setPeriod} months={months} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Técnicos ativos" value={String(byTechnician.length)} Icon={Users} />
        <StatCard
          label="Média de OS por técnico"
          value={
            byTechnician.length
              ? (records.length / byTechnician.length).toFixed(1)
              : "0"
          }
          Icon={Users}
          tone="info"
        />
      </div>

      <EquipmentTable title="Desempenho por técnico" rows={byTechnician} nameLabel="Técnico" />
    </main>
  );
}
