import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Os pacotes do workspace sao publicados como TypeScript, sem build proprio.
  // O Next compila junto — menos etapa de build, tipos sempre atualizados.
  transpilePackages: ["@napole/core", "@napole/db", "@napole/auth"],
  // Links para rotas inexistentes viram erro de compilacao.
  typedRoutes: true,
};

export default nextConfig;
