import { exigirAdministrador } from "@/server/auth/guardas";

/** Criação e configuração da grade são exclusivas de ADMINISTRADOR. */
export default async function LayoutAgendaAdministrador({
  children,
}: {
  children: React.ReactNode;
}) {
  await exigirAdministrador();
  return children;
}
