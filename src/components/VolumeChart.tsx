"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "./ThemeProvider";
import { getChartColors } from "@/lib/chart-theme";

export function VolumeChart({ data }: { data: { date: string; total: number }[] }) {
  const { theme } = useTheme();
  const colors = getChartColors(theme === "dark");
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
                <stop offset="0%" stopColor={colors.primary} stopOpacity={0.35} />
                <stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis dataKey="label" tick={{ fill: colors.tick, fontSize: 11 }} interval={4} />
            <YAxis tick={{ fill: colors.tick, fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: colors.tooltipBg,
                border: `1px solid ${colors.tooltipBorder}`,
                borderRadius: 12,
                fontSize: 12,
                color: theme === "dark" ? "#ede9e3" : "#211d19",
              }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke={colors.primary}
              fill="url(#volumeFill)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
