import type { EquipmentMetric } from "@/lib/types";

export function EquipmentTable({
  title,
  rows,
  nameLabel = "Equipamento",
}: {
  title: string;
  rows: EquipmentMetric[];
  nameLabel?: string;
}) {
  return (
    <div className="glass rise-in rounded-2xl p-4">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <p className="mb-3 text-xs text-muted">
        OS e Falhas contam tudo · Downtime usa Início/Término da Ocorrência, MTTR usa
        Início/Término da Manutenção · ambos só corretivas concluídas
      </p>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>{nameLabel}</th>
              <th>OS</th>
              <th>Falhas</th>
              <th>Downtime (h)</th>
              <th>MTTR (h)</th>
              <th>Disponibilidade</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.equipment}>
                <td className="font-medium text-foreground">{r.equipment}</td>
                <td>{r.os}</td>
                <td>{r.failures}</td>
                <td>{r.downtime.toFixed(1)}</td>
                <td>{r.mttr.toFixed(1)}</td>
                <td>
                  <span
                    className={
                      r.availability >= 90
                        ? "text-success"
                        : r.availability >= 75
                          ? "text-warning"
                          : "text-destructive"
                    }
                  >
                    {r.availability.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-muted">
                  Sem dados no período selecionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
