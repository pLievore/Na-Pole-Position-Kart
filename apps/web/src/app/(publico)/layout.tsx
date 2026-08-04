import { env } from "@/env";
import { NavegacaoPublica } from "@/components/publico/NavegacaoPublica";
import { RodapePublico } from "@/components/publico/RodapePublico";
import { formatarHorariosPublicos } from "@/components/publico/horarios";
import { obterConfiguracaoPadroesAgendamento } from "@/server/agendamentos";
import { pilotoAtual } from "@/server/auth/sessao";

export default async function LayoutPublico({ children }: { children: React.ReactNode }) {
  const [piloto, configuracao] = await Promise.all([
    pilotoAtual(),
    obterConfiguracaoPadroesAgendamento(),
  ]);
  const whatsapp = env.NEXT_PUBLIC_WHATSAPP ? `https://wa.me/${env.NEXT_PUBLIC_WHATSAPP}` : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#conteudo-principal" className="skip-link">
        Pular para o conteúdo
      </a>

      <NavegacaoPublica pilotoLogado={piloto !== null} />

      <main id="conteudo-principal" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>

      <RodapePublico whatsapp={whatsapp} horarios={formatarHorariosPublicos(configuracao)} />
    </div>
  );
}
