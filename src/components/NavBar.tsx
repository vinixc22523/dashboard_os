"use client";

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
    <nav className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-3 md:px-6">
        <span className="mr-4 text-sm font-semibold tracking-tight text-slate-200">
          Dashboard OS
        </span>
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted hover:bg-white/5 hover:text-slate-100"
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
