import { exigirAdmin } from "@/server/auth/guardas";
import { NavegacaoAdmin } from "@/components/admin/NavegacaoAdmin";

/**
 * Layout do painel.
 *
 * O grupo (painel) existe para que /admin/entrar fique FORA desta guarda —
 * senao a pagina de login exigiria login e o acesso entraria em loop.
 */
export default async function LayoutPainel({ children }: { children: React.ReactNode }) {
  const admin = await exigirAdmin();

  return (
    <div className="min-h-dvh bg-[#0d0d11] lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <a
        href="#conteudo-principal"
        className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition-transform focus:translate-y-0"
      >
        Ir para o conteúdo
      </a>
      <NavegacaoAdmin nome={admin.nome} nivel={admin.nivel} />
      <div id="conteudo-principal" tabIndex={-1} className="min-w-0 outline-none">
        {children}
      </div>
    </div>
  );
}
