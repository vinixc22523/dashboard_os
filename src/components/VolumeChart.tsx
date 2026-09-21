"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function VolumeChart({ data }: { data: { date: string; total: number }[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(
      new Date(`${d.date}T12:00:00`),
    ),
  }));

  return (
    <div className="glass rise-in rounded-2xl p-4">
      <h3 className="mb-3 text-sm font-medium text-slate-200">Volume de OS abertas (30 dias)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formatted} margin={{ left: -20 }}>
            <defs>
              <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} interval={4} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: "#111a2e",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Area type="monotone" dataKey="total" stroke="#22d3ee" fill="url(#volumeFill)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
