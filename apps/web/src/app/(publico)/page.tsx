import { Suspense } from "react";
import { env } from "@/env";
import { AgendamentoRapido } from "@/components/home/AgendamentoRapido";
import { ComoFunciona } from "@/components/home/ComoFunciona";
import { HeroPrincipal } from "@/components/home/HeroPrincipal";
import { InformacoesPista } from "@/components/home/InformacoesPista";
import { Localizacao } from "@/components/home/Localizacao";
import { PerguntasFrequentes } from "@/components/home/PerguntasFrequentes";
import { Pizzaria } from "@/components/home/Pizzaria";
import { EsqueletoRanking, RankingEmDestaque } from "@/components/home/RankingEmDestaque";
import { formatarHorariosPublicos, resumirHorariosPublicos } from "@/components/publico/horarios";
import { obterConfiguracaoPadroesAgendamento } from "@/server/agendamentos";

/**
 * Ordem da home: agendar, como funciona, dados da pista, pizzaria, duvidas,
 * ranking e — por ultimo — onde fica.
 *
 * O ranking vem perto do fim porque interessa a quem ja correu e volta ao site,
 * nao a quem esta decidindo se vem. O mapa fecha a pagina: e a ultima duvida de
 * quem ja decidiu, entao encerra a leitura em vez de interromper.
 */
export default async function PaginaInicial() {
  const whatsapp = env.NEXT_PUBLIC_WHATSAPP ? "https://wa.me/" + env.NEXT_PUBLIC_WHATSAPP : null;
  const configuracao = await obterConfiguracaoPadroesAgendamento();
  const horarios = formatarHorariosPublicos(configuracao);

  return (
    <>
      <HeroPrincipal />
      <AgendamentoRapido
        resumoHorarios={resumirHorariosPublicos(configuracao)}
        configuracao={configuracao}
      />
      <ComoFunciona
        chegadaAntecedenciaMinutos={configuracao.chegadaAntecedenciaMinutos}
        duracaoMinutos={configuracao.duracaoMinutos}
      />
      <InformacoesPista
        whatsapp={whatsapp}
        horarios={horarios}
        duracaoMinutos={configuracao.duracaoMinutos}
        chegadaAntecedenciaMinutos={configuracao.chegadaAntecedenciaMinutos}
        capacidade={configuracao.capacidade}
      />
      <Pizzaria />
      <PerguntasFrequentes />
      <Suspense fallback={<EsqueletoRanking />}>
        <RankingEmDestaque />
      </Suspense>
      <Localizacao />
    </>
  );
}
