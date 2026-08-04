import path from "node:path";
import type { NextConfig } from "next";

// O monorepo mantem um unico .env na raiz. A Vercel injeta as variaveis no
// processo; localmente, o Next precisa carregar esse arquivo antes do app.
try {
  process.loadEnvFile(path.resolve(import.meta.dirname, "../../.env"));
} catch (erro) {
  if ((erro as NodeJS.ErrnoException).code !== "ENOENT") throw erro;
  // Sem arquivo local: CI e Vercel continuam usando o ambiente do processo.
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Os pacotes do workspace sao publicados como TypeScript, sem build proprio.
  // O Next compila junto — menos etapa de build, tipos sempre atualizados.
  transpilePackages: ["@napole/core", "@napole/db", "@napole/auth"],
  // Links para rotas inexistentes viram erro de compilacao.
  typedRoutes: true,
  async headers() {
    return [
      {
        // O hash no nome permite cache longo sem servir uma versao antiga ao trocar o video.
        source: "/videos/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
