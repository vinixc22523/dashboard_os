"use client";

import { useMemo, useState } from "react";
import { Activity, AlertTriangle, Clock, Layers, PauseCircle, ShieldCheck } from "lucide-react";
import type { DashboardPayload } from "@/lib/types";
import { toRecords, computeMaintenanceKpis } from "@/lib/kpis";
import { filterByPeriod, listMonths } from "@/lib/period";
import { DashboardHeader } from "./DashboardHeader";
import { StatCard } from "./StatCard";
import { PeriodFilter } from "./PeriodFilter";
import { PhasesChart } from "./PhasesChart";
import { VolumeChart } from "./VolumeChart";
import { volumeSeries } from "@/lib/kpis";

function formatHours(hours: number) {
  if (hours < 24) return `${hours.toFixed(1)} h`;
  return `${(hours / 24).toFixed(1)} d`;
}

export function DashboardView({ payload }: { payload: DashboardPayload }) {
  const [period, setPeriod] = useState("all");
  const snapshot = payload.snapshot;

  const allRecords = useMemo(() => toRecords(snapshot?.cards ?? []), [snapshot]);
  const months = useMemo(() => listMonths(allRecords), [allRecords]);
  const records = useMemo(() => filterByPeriod(allRecords, period), [allRecords, period]);
  const kpis = useMemo(() => computeMaintenanceKpis(records), [records]);
  const lateCount = records.filter((r) => r.late).length;
  const series = useMemo(() => volumeSeries(records), [records]);

  return (
    <div className="min-h-screen pb-16">
      <DashboardHeader
        connected={payload.configured && !payload.demo}
        demo={payload.demo}
        lastSync={snapshot?.syncedAt ?? null}
        pipeName={snapshot?.pipeName ?? null}
      />

      <main className="mx-auto max-w-7xl space-y-5 px-4 pt-6 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight text-slate-100">Visão geral</h2>
          <PeriodFilter value={period} onChange={setPeriod} months={months} />
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total de OS" value={String(kpis.totalOs)} Icon={Layers} />
          <StatCard
            label="Falhas (máquina parada)"
            value={String(kpis.failures)}
            Icon={PauseCircle}
            tone="destructive"
          />
          <StatCard
            label="Em atraso"
            value={String(lateCount)}
            Icon={AlertTriangle}
            tone="warning"
          />
          <StatCard
            label="Downtime total"
            value={formatHours(kpis.downtime)}
            Icon={Clock}
            tone="info"
          />
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard label="MTTR" value={formatHours(kpis.mttr)} hint="Tempo médio de reparo" Icon={Activity} tone="info" />
          <StatCard label="MTBF" value={formatHours(kpis.mtbf)} hint="Tempo médio entre falhas" Icon={Activity} />
          <StatCard
            label="Disponibilidade"
            value={`${kpis.availability}%`}
            hint={`Base de ${kpis.operatingHours} h de operação`}
            Icon={ShieldCheck}
            tone="success"
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <PhasesChart phases={snapshot?.phases ?? []} />
          <VolumeChart data={series} />
        </section>

        <p className="pt-2 text-center text-xs text-muted">
          {snapshot?.pipeName ?? "Ordem de Serviço"} · origem: {snapshot?.source} · rotina
          automática diária às 03:00 (America/Sao_Paulo)
        </p>
      </main>
    </div>
  );
}
