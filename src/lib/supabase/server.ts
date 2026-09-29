import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente Supabase para uso em Server Components, Server Actions e Route
// Handlers. Lê/escreve a sessão via cookies httpOnly (o próprio Supabase SSR
// cuida disso), então o token de acesso nunca fica exposto a JavaScript no
// navegador.
export async function supabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Chamado de um Server Component (não pode escrever cookies).
            // O middleware já cuida de renovar a sessão a cada requisição,
            // então isso pode ser ignorado com segurança.
          }
        },
      },
    },
  );
}
