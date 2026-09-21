"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useTheme } from "./ThemeProvider";
import { getChartColors } from "@/lib/chart-theme";

export function BreakdownChart({
  title,
  data,
}: {
  title: string;
  data: { name: string; value: number }[];
}) {
  const { theme } = useTheme();
  const colors = getChartColors(theme === "dark");

  return (
    <div className="glass rise-in rounded-2xl p-4">
      <h3 className="mb-3 text-sm font-medium text-foreground">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {data.map((_, i) => (
                <Cell key={i} fill={colors.pie[i % colors.pie.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: colors.tooltipBg,
                border: `1px solid ${colors.tooltipBorder}`,
                borderRadius: 12,
                fontSize: 12,
                color: theme === "dark" ? "#ede9e3" : "#211d19",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: colors.tick }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
