import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Lamiex — Dashboard OS",
  description: "Painel de ordens de serviço da Lamiex, sincronizado com o Pipefy.",
  icons: { icon: "/lamiex-logo.png" },
};

// Aplica a classe "dark" no <html> antes da página pintar, lendo a preferência
// salva (ou o tema do sistema operacional na primeira visita). Isso evita o
// "flash" de tema claro por uma fração de segundo antes do React montar.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("dashboard-os-theme");
    var theme =
      stored === "dark" || stored === "light"
        ? stored
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    if (theme === "dark") document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          <NavBar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
