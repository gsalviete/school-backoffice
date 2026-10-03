import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Escola",
  description: "Chamada e mensalidades da escola",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1f5fbf",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        {/* POC: a sessão é simulada — nunca usar com dados reais. */}
        <footer className="rodape-teste">Versão de teste — os dados são de exemplo</footer>
      </body>
    </html>
  );
}
