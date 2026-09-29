"use client";

import { createBrowserClient } from "@supabase/ssr";

// Cliente Supabase para uso no navegador (componentes "use client"), só para
// autenticação (login, logout). Usa a chave publicável, segura para expor no
// navegador: a tabela de dados do painel (pipefy_snapshots) tem Row Level
// Security ativado e nenhuma policy para o papel anônimo/autenticado, então
// essa chave não dá acesso a nenhum dado — só à API de autenticação.
export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
