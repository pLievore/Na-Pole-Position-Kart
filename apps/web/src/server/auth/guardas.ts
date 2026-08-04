import "server-only";

import { redirect } from "next/navigation";
import { adminAtual, pilotoAtual, type AdminLogado, type PilotoLogado } from "./sessao";

/**
 * Guardas de rota.
 *
 * Use no `layout.tsx` do grupo de rotas, nao em cada pagina — um lugar so para
 * proteger evita que uma pagina nova nasca desprotegida por esquecimento.
 */

export async function exigirPiloto(): Promise<PilotoLogado> {
  const piloto = await pilotoAtual();
  if (!piloto) redirect("/entrar");
  return piloto;
}

export async function exigirAdmin(): Promise<AdminLogado> {
  const admin = await adminAtual();
  if (!admin) redirect("/admin/entrar");
  return admin;
}

/** Rotas que so o ADMINISTRADOR acessa (configuracoes, usuarios, exclusoes). */
export async function exigirAdministrador(): Promise<AdminLogado> {
  const admin = await exigirAdmin();
  if (admin.nivel !== "ADMINISTRADOR") redirect("/admin");
  return admin;
}
