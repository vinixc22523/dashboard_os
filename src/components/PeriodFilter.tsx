"use client";

export function PeriodFilter({
  value,
  onChange,
  months,
}: {
  value: string;
  onChange: (value: string) => void;
  months: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-primary/50"
    >
      <option value="all">Todos os períodos</option>
      {months.map((m) => (
        <option key={m.value} value={m.value}>
          {m.label}
        </option>
      ))}
    </select>
  );
}
