import type { MaintenanceRecord } from "./types";

export function monthKey(iso: string) {
  return iso.slice(0, 7);
}

function monthLabel(key: string) {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function listMonths(records: MaintenanceRecord[]) {
  const keys = [...new Set(records.map((r) => monthKey(r.createdAt)))].sort((a, b) =>
    b.localeCompare(a),
  );
  return keys.map((value) => ({ value, label: monthLabel(value) }));
}

export function filterByPeriod(records: MaintenanceRecord[], period: string) {
  if (period === "all") return records;
  return records.filter((r) => monthKey(r.createdAt) === period);
}
