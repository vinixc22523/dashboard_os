import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// Recebe o link de convite (ou de redefinição de senha) que o Supabase manda
// por e-mail. Troca o código de um só uso por uma sessão de verdade e manda
// a pessoa definir a senha.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/definir-senha`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
