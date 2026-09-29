"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type LoginState = { error: string | null };

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const proximo = String(formData.get("proximo") || "/");

  if (!email || !password) {
    return { error: "Preencha e-mail e senha." };
  }

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Mensagem genérica de propósito: não revela se o problema foi o e-mail
    // não existir ou a senha estar errada (evita que alguém use a tela de
    // login para descobrir quais e-mails têm conta no sistema).
    return { error: "E-mail ou senha incorretos." };
  }

  redirect(proximo.startsWith("/") ? proximo : "/");
}
