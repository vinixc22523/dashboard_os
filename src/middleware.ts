import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Caminhos acessíveis sem estar logado. Tudo o resto (Painel, Chamados,
// Técnicos, Relatórios) exige sessão válida.
const PUBLIC_PATHS = ["/login", "/auth/callback"];

// Roda em toda requisição de página (ver "matcher" no fim do arquivo).
// Duas coisas acontecem aqui:
// 1. Renova o token de sessão se estiver perto de expirar (sem isso, a
//    pessoa seria deslogada a cada ~1h mesmo estando ativa).
// 2. Bloqueia o acesso a qualquer página do painel para quem não tem sessão,
//    redirecionando para /login.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: getUser() valida o token direto com o servidor do Supabase
  // (diferente de getSession(), que só lê o cookie sem verificar). É o que a
  // documentação do Supabase recomenda para decisões de autorização.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath = PUBLIC_PATHS.some((path) => request.nextUrl.pathname.startsWith(path));

  if (!user && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("proximo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Roda em tudo, exceto: arquivos estáticos do Next, favicon, imagens
    // públicas (logo) e as rotas de API (que têm sua própria proteção por
    // segredo, usada pelo Vercel Cron e pelo botão "Atualizar").
    "/((?!_next/static|_next/image|favicon.ico|lamiex-logo.png|api/).*)",
  ],
};
