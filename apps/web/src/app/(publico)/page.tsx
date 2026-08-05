import { Suspense } from "react";
import { env } from "@/env";
import { AgendamentoRapido } from "@/components/home/AgendamentoRapido";
import { ComoFunciona } from "@/components/home/ComoFunciona";
import { HeroPrincipal } from "@/components/home/HeroPrincipal";
import { InformacoesPista } from "@/components/home/InformacoesPista";
import { PerguntasFrequentes } from "@/components/home/PerguntasFrequentes";
import { EsqueletoRanking, RankingEmDestaque } from "@/components/home/RankingEmDestaque";
import { formatarHorariosPublicos, resumirHorariosPublicos } from "@/components/publico/horarios";
import { obterConfiguracaoPadroesAgendamento } from "@/server/agendamentos";

/**
 * Ordem da home: agendar, ver quem esta na frente, entender como funciona,
 * conferir os dados da pista, tirar duvida. Cada secao entrega uma informacao
 * que a anterior nao entregou.
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
      <Suspense fallback={<EsqueletoRanking />}>
        <RankingEmDestaque />
      </Suspense>
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
      <PerguntasFrequentes />
    </>
  );
}
