"use client";

import { useMemo, useState } from "react";
import type { DashboardPayload } from "@/lib/types";
import { toRecords } from "@/lib/kpis";
import { filterByPeriod, listMonths } from "@/lib/period";
import { PeriodFilter } from "./PeriodFilter";
import { CardsTable } from "./CardsTable";

export function ChamadosView({ payload }: { payload: DashboardPayload }) {
  const [period, setPeriod] = useState("all");
  const allRecords = useMemo(() => toRecords(payload.snapshot?.cards ?? []), [payload.snapshot]);
  const months = useMemo(() => listMonths(allRecords), [allRecords]);
  const records = useMemo(() => filterByPeriod(allRecords, period), [allRecords, period]);

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-slate-100">Chamados</h2>
        <PeriodFilter value={period} onChange={setPeriod} months={months} />
      </div>
      <CardsTable records={records} />
    </main>
  );
}
