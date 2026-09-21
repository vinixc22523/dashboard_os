import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Lamiex — Dashboard OS",
  description: "Painel de ordens de serviço da Lamiex, sincronizado com o Pipefy.",
  icons: { icon: "/lamiex-logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
