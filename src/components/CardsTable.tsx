"use client";

import { useMemo, useState } from "react";
import type { MaintenanceRecord } from "@/lib/types";

const PAGE_SIZE = 15;

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(iso));
}

export function CardsTable({ records }: { records: MaintenanceRecord[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      [r.osNumber, r.title, r.equipment, r.technician, r.phaseName]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [records, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="glass rise-in rounded-2xl p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-slate-200">
          Chamados <span className="text-muted">({filtered.length})</span>
        </h3>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Buscar por OS, equipamento, técnico…"
          className="w-64 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-primary/50"
        />
      </div>

      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>OS</th>
              <th>Equipamento</th>
              <th>Técnico</th>
              <th>Tipo</th>
              <th>Fase</th>
              <th>Aberta em</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((r) => (
              <tr key={r.id}>
                <td className="font-medium text-slate-200">{r.osNumber}</td>
                <td>{r.equipment}</td>
                <td>{r.technician}</td>
                <td>{r.type}</td>
                <td>{r.phaseName}</td>
                <td>{formatDate(r.createdAt)}</td>
                <td>
                  {r.late ? (
                    <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs text-destructive">
                      Atrasada
                    </span>
                  ) : r.done ? (
                    <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs text-success">
                      Concluída
                    </span>
                  ) : (
                    <span className="rounded-full bg-info/15 px-2 py-0.5 text-xs text-info">
                      Em andamento
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-muted">
                  Nenhum chamado encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted">
        <span>
          Página {currentPage + 1} de {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="rounded-lg border border-border px-3 py-1 disabled:opacity-30"
          >
            Anterior
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="rounded-lg border border-border px-3 py-1 disabled:opacity-30"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}
