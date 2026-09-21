import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cliente com a service role key: só é usado em rotas de servidor (API routes),
// nunca chega ao navegador. Ele ignora RLS de propósito, então qualquer rota
// que o use precisa validar autenticação/segredo antes de chamar.
function createAdminClient() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Variáveis SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configuradas no servidor.",
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let cached: ReturnType<typeof createAdminClient> | null = null;

export function supabaseAdmin() {
  if (!cached) cached = createAdminClient();
  return cached;
}
