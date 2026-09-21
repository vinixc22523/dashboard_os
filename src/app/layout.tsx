import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Dashboard OS — Ordem de Serviço",
  description: "Painel de ordens de serviço sincronizado com o Pipefy.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
