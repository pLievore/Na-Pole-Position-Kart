import { Suspense } from "react";
import { env } from "@/env";
import { AgendamentoRapido } from "@/components/home/AgendamentoRapido";
import { ComoFunciona } from "@/components/home/ComoFunciona";
import { ExperienciaPista } from "@/components/home/ExperienciaPista";
import { HeroPrincipal } from "@/components/home/HeroPrincipal";
import { InformacoesPista } from "@/components/home/InformacoesPista";
import { PerguntasFrequentes } from "@/components/home/PerguntasFrequentes";
import { EsqueletoRanking, RankingEmDestaque } from "@/components/home/RankingEmDestaque";
import { formatarHorariosPublicos } from "@/components/publico/horarios";
import { obterConfiguracaoPadroesAgendamento } from "@/server/agendamentos";

export default async function PaginaInicial() {
  const whatsapp = env.NEXT_PUBLIC_WHATSAPP ? "https://wa.me/" + env.NEXT_PUBLIC_WHATSAPP : null;
  const configuracao = await obterConfiguracaoPadroesAgendamento();
  const horarios = formatarHorariosPublicos(configuracao);

  return (
    <>
      <HeroPrincipal duracaoMinutos={configuracao.duracaoMinutos} />
      <AgendamentoRapido />
      <ExperienciaPista />
      <ComoFunciona
        chegadaAntecedenciaMinutos={configuracao.chegadaAntecedenciaMinutos}
        duracaoMinutos={configuracao.duracaoMinutos}
      />
      <Suspense fallback={<EsqueletoRanking />}>
        <RankingEmDestaque />
      </Suspense>
      <InformacoesPista
        whatsapp={whatsapp}
        horarios={horarios}
        duracaoMinutos={configuracao.duracaoMinutos}
        chegadaAntecedenciaMinutos={configuracao.chegadaAntecedenciaMinutos}
      />
      <PerguntasFrequentes
        chegadaAntecedenciaMinutos={configuracao.chegadaAntecedenciaMinutos}
      />
    </>
  );
}
