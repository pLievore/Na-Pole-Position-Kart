import { exigirAdministrador } from "@/server/auth/guardas";

/** Somente administradores chegam as telas que alteram o cadastro. */
export default async function LayoutGestaoPiloto({ children }: { children: React.ReactNode }) {
  await exigirAdministrador();
  return children;
}
