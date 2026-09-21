"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Painel" },
  { href: "/chamados", label: "Chamados" },
  { href: "/tecnicos", label: "Técnicos" },
  { href: "/relatorios", label: "Relatórios" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-10 border-b border-border bg-surface">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-1 px-4 py-3 md:px-6">
        <Link href="/" className="mr-4 flex items-center gap-3">
          <Image src="/lamiex-logo.png" alt="Lamiex" width={104} height={20} priority />
          <span className="hidden text-xs font-medium text-muted sm:inline">
            Dashboard OS · Ordem de Serviço
          </span>
        </Link>
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:bg-black/5 hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
