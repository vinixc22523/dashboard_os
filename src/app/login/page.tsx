import Image from "next/image";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string }>;
}) {
  const params = await searchParams;
  const proximo = params.proximo && params.proximo.startsWith("/") ? params.proximo : "/";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="glass w-full max-w-sm rounded-2xl p-8">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Image src="/lamiex-logo.png" alt="Lamiex" width={140} height={28} priority />
          <p className="text-sm text-muted">Dashboard OS · Ordem de Serviço</p>
        </div>
        <LoginForm proximo={proximo} />
        <p className="mt-6 text-center text-xs text-muted">
          Acesso restrito a contas autorizadas da Lamiex. Se você deveria ter acesso e ainda não
          recebeu um convite, fale com o administrador do painel.
        </p>
      </div>
    </div>
  );
}
