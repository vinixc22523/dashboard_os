// Contas autorizadas a usar o botão "Atualizar agora" (sincronização manual com
// o Pipefy). Qualquer outra conta logada continua vendo o painel, mas não
// consegue disparar a sincronização. Para liberar mais alguém, adicione o
// e-mail aqui (sempre em minúsculas).
export const SYNC_ALLOWED_EMAILS = [
  "vinicius.derganho@lamiex.com.br",
  "gabriel.souza@lamiex.com.br",
  "eduardo.maie@lamiex.com.br",
];

export function canSync(email: string | null | undefined): boolean {
  if (!email) return false;
  return SYNC_ALLOWED_EMAILS.includes(email.trim().toLowerCase());
}
