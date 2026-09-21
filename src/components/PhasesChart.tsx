"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PipefyPhase } from "@/lib/types";

export function PhasesChart({ phases }: { phases: PipefyPhase[] }) {
  const data = phases.map((p) => ({ name: p.name, cards: p.cardsCount }));

  return (
    <div className="glass rise-in rounded-2xl p-4">
      <h3 className="mb-3 text-sm font-medium text-slate-200">Cards por fase</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: "#111a2e",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Bar dataKey="cards" fill="#22d3ee" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
