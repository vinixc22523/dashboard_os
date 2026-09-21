// Cores usadas pelos gráficos (Recharts), que não aceitam classes Tailwind e
// precisam receber valores em hexadecimal via JS. Mantém os dois temas em um
// único lugar, espelhando as variáveis CSS de globals.css.
export function getChartColors(isDark: boolean) {
  return {
    grid: isDark ? "#3a3329" : "#eee8e0",
    tick: isDark ? "#9e968c" : "#8d8378",
    tooltipBg: isDark ? "#241f19" : "#ffffff",
    tooltipBorder: isDark ? "#3a3329" : "#e5e0d8",
    primary: isDark ? "#ed7a3d" : "#e8681f",
    pie: isDark
      ? ["#ed7a3d", "#60a0e0", "#3dbf7a", "#d69e40", "#f0645a", "#b08a63"]
      : ["#e8681f", "#2e76bf", "#1e9e52", "#b9770e", "#dc3b30", "#7a5c3e"],
  };
}
