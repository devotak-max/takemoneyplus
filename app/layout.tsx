import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monetheus — câmbio turismo entre pessoas",
  description:
    "Compre e venda moeda estrangeira direto com outras pessoas, sem spread de casa de câmbio. Limite legal de USD 500 por operação.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
