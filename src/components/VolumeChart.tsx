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
      <h3 className="mb-3 text-sm font-medium text-foreground">Volume de OS abertas (30 dias)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formatted} margin={{ left: -20 }}>
            <defs>
              <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e8681f" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#e8681f" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee8e0" />
            <XAxis dataKey="label" tick={{ fill: "#8d8378", fontSize: 11 }} interval={4} />
            <YAxis tick={{ fill: "#8d8378", fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e5e0d8",
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Area type="monotone" dataKey="total" stroke="#e8681f" fill="url(#volumeFill)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
