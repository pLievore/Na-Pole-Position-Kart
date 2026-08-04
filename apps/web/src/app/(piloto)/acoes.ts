"use server";

import { redirect } from "next/navigation";
import { encerrarSessaoPiloto } from "@/server/auth/sessao";

export async function sairAction() {
  await encerrarSessaoPiloto();
  redirect("/");
}
