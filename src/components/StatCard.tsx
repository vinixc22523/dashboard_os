import type { LucideIcon } from "lucide-react";

const TONES: Record<string, string> = {
  default: "text-primary bg-primary/10",
  destructive: "text-destructive bg-destructive/10",
  warning: "text-warning bg-warning/10",
  info: "text-info bg-info/10",
  success: "text-success bg-success/10",
};

export function StatCard({
  label,
  value,
  hint,
  Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  Icon?: LucideIcon;
  tone?: keyof typeof TONES;
}) {
  return (
    <div className="glass rise-in rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
        {Icon && (
          <span className={`rounded-lg p-1.5 ${TONES[tone]}`}>
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-semibold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
