import Image from "next/image";
import { SetPasswordForm } from "./SetPasswordForm";

export const dynamic = "force-dynamic";

export default function SetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="glass w-full max-w-sm rounded-2xl p-8">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Image src="/lamiex-logo.png" alt="Lamiex" width={140} height={28} priority />
          <p className="text-sm text-muted">Defina sua senha de acesso</p>
        </div>
        <SetPasswordForm />
      </div>
    </div>
  );
}
