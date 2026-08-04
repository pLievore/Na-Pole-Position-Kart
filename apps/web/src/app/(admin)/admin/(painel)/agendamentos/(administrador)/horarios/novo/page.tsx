import type { Metadata } from "next";
import Link from "next/link";
import {
  dataHoraOperacionalISO,
  dataOperacionalISO,
  parseDataHoraOperacional,
} from "@napole/core";
import { Cartao } from "@/components/ui";
import { resumirHorariosPublicos } from "@/components/publico/horarios";
import { obterConfiguracaoPadroesAgendamento } from "@/server/agendamentos/configuracao";
import { FormularioGeracaoPadrao, FormularioHorarioManual } from "./FormularioHorarios";

export const metadata: Metadata = { title: "Criar horários" };
export const dynamic = "force-dynamic";

export default async function PaginaCriarHorarios() {
  const configuracao = await obterConfiguracaoPadroesAgendamento();
  const amanha = new Date(Date.now() + 86_400_000);
  const emDuasSemanas = new Date(Date.now() + 14 * 86_400_000);
  const emQuarentaECincoDias = new Date(Date.now() + 45 * 86_400_000);
  const dataAmanha = dataOperacionalISO(amanha);
  const horaInicial = configuracao.faixas[0]?.horaInicio ?? "18:00";
  const inicioManual = parseDataHoraOperacional(`${dataAmanha}T${horaInicial}`);
  const fimManual = new Date(
    inicioManual.getTime() + configuracao.duracaoMinutos * 60_000,
  );

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <Link
        href="/admin/agendamentos"
        className="inline-flex min-h-11 items-center text-sm text-neutral-400 hover:text-white"
      >
        ← Voltar para a agenda
      </Link>

      <header className="mt-4 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-acelera-texto)]">
          Configuração operacional
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Criar horários</h1>
        <p className="mt-3 leading-7 text-neutral-400">
          Gere a grade recorrente para um período ou cadastre uma saída excepcional. Horários
          existentes são preservados e nada é apagado.
        </p>
        <Link
          href="/admin/agendamentos/configuracao"
          className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-white underline underline-offset-4"
        >
          Editar padrões da agenda
        </Link>
      </header>

      <div className="mt-8 grid gap-5 xl:grid-cols-2">
        <Cartao className="p-6 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
            Mais rápido
          </p>
          <h2 className="mt-2 text-xl font-bold">Gerar com o padrão atual</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            {resumirHorariosPublicos(configuracao)}. Saídas a cada {" "}
            {configuracao.intervaloEntreIniciosMinutos} min, bateria de {configuracao.duracaoMinutos}{" "}
            min e {configuracao.capacidade} vagas.
          </p>
          <FormularioGeracaoPadrao
            dataInicial={dataOperacionalISO(amanha)}
            dataFinal={dataOperacionalISO(emDuasSemanas)}
            dataMaxima={dataOperacionalISO(emQuarentaECincoDias)}
          />
        </Cartao>

        <Cartao className="p-6 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
            Exceção
          </p>
          <h2 className="mt-2 text-xl font-bold">Criar horário manual</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            Use para evento especial, feriado ou ajuste pontual fora da grade recorrente.
          </p>
          <FormularioHorarioManual
            inicioPadrao={dataHoraOperacionalISO(inicioManual)}
            fimPadrao={dataHoraOperacionalISO(fimManual)}
            capacidadePadrao={configuracao.capacidade}
          />
        </Cartao>
      </div>
    </main>
  );
}
