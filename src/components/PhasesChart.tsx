"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PipefyPhase } from "@/lib/types";
import { useTheme } from "./ThemeProvider";
import { getChartColors } from "@/lib/chart-theme";

export function PhasesChart({ phases }: { phases: PipefyPhase[] }) {
  const { theme } = useTheme();
  const colors = getChartColors(theme === "dark");

  // A fase de conclusão (marcada como "done" no Pipefy) não entra no gráfico:
  // o objetivo aqui é mostrar onde as OS estão paradas no fluxo, não as que já
  // terminaram.
  const data = phases.filter((p) => !p.done).map((p) => ({ name: p.name, cards: p.cardsCount }));

  return (
    <div className="glass rise-in rounded-2xl p-4">
      <h3 className="mb-3 text-sm font-medium text-foreground">Cards por fase</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis
              dataKey="name"
              tick={{ fill: colors.tick, fontSize: 11 }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={60}
            />
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
            <Bar dataKey="cards" fill={colors.primary} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
