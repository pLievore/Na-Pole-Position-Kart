"use server";

import { redirect } from "next/navigation";
import { encerrarSessaoAdmin } from "@/server/auth/sessao";

export async function sairAdminAction() {
  await encerrarSessaoAdmin();
  redirect("/admin/entrar");
}
