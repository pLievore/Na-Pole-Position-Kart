import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Na Pole Position Racing Club",
    template: "%s | Na Pole Position Racing Club",
  },
  description:
    "Seu tempo. Seu ranking. Sua proxima disputa. Sistema oficial de ranking da Na Pole Position Kart Indoor.",
};

// O acesso e majoritariamente pelo celular (secao 2.1 do escopo).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0b0f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
