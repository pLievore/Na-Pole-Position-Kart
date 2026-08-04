"use server";

import { exigirAdmin } from "@/server/auth/guardas";
import {
  buscarPilotos,
  listarPilotos,
  type PilotoEncontrado,
} from "@/server/pilotos/busca";

export interface EstadoBuscaPilotosAdmin {
  pilotos: PilotoEncontrado[];
  termo: string;
}

export async function buscarPilotosAdminAction(
  _estado: EstadoBuscaPilotosAdmin,
  dados: FormData,
): Promise<EstadoBuscaPilotosAdmin> {
  await exigirAdmin();
  const termo = dados.get("limpar") === "1" ? "" : texto(dados, "q").slice(0, 120);
  return {
    termo,
    pilotos: termo ? await buscarPilotos(termo) : await listarPilotos(),
  };
}

function texto(dados: FormData, campo: string): string {
  const valor = dados.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}
