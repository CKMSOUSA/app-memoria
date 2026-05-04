import type { Metadata } from "next";
import "./globals.css";
import "./page.css";

export const metadata: Metadata = {
  title: "NeuroApp Memória",
  description: "Aplicativo de treino de memória, atenção, comparação e orientação espacial.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
