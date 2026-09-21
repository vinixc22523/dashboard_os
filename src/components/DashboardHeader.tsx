"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function formatSync(iso: string | null) {
  if (!iso) return "nunca sincronizado";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function DashboardHeader({
  connected,
  demo,
  lastSync,
  pipeName,
}: {
  connected: boolean;
  demo: boolean;
  lastSync: string | null;
  pipeName: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRefresh() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/sync", { method: "POST" });
      const data = await response.json();
      if (!data.ok) throw new Error(data.error ?? "Falha desconhecida.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao sincronizar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <header className="mx-auto max-w-7xl px-4 pt-6 md:px-6">
      <div className="glass rise-in flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">
            {pipeName ?? "Ordem de Serviço"}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-xs text-muted">
            <span
              className={`inline-block size-2 rounded-full ${
                connected ? "bg-success" : "bg-warning"
              }`}
            />
            {connected ? "Conectado ao Pipefy" : "Modo demonstração"} · última sincronização:{" "}
            {formatSync(lastSync)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-destructive">{error}</span>}
          <button
            onClick={handleRefresh}
            disabled={loading || demo}
            className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
            title={demo ? "Configure o Pipefy para habilitar a sincronização manual" : undefined}
          >
            {loading ? "Sincronizando…" : "Atualizar agora"}
          </button>
        </div>
      </div>
      {demo && (
        <div className="glass rise-in mt-3 rounded-2xl p-3 text-sm text-muted">
          Exibindo <strong className="text-slate-200">dados de demonstração</strong>. Configure
          PIPEFY_PIPE_ID e PIPEFY_API_TOKEN para conectar ao seu pipe real.
        </div>
      )}
    </header>
  );
}
