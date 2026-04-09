import type { Metadata } from "next";
import "./globals.css";
import "./page.css";

export const metadata: Metadata = {
  title: "NeuroApp",
  description: "Aplicativo de treino de memoria e atencao",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
