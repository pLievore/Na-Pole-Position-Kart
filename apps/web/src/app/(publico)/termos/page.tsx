import type { Metadata } from "next";
import { Aviso, Cartao } from "@/components/ui";
import { VERSAO_TERMOS } from "@/server/pilotos/cadastro";

export const metadata: Metadata = { title: "Termos e privacidade" };

/**
 * ATENCAO: o texto legal ainda nao existe.
 *
 * Esta pagina descreve com precisao o que o sistema faz com os dados, mas os
 * itens marcados abaixo dependem de definicao da Na Pole Position (razao
 * social, encarregado, prazo de retencao) — ver docs/lgpd.md. Nao publicar o
 * site sem fechar isso: o cadastro registra o aceite a um texto que precisa
 * existir de verdade.
 */
export default function PaginaTermos() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-3xl font-bold">Termos e privacidade</h1>
      <p className="mt-2 text-sm text-neutral-500">Versão {VERSAO_TERMOS}</p>

      <div className="mt-6">
        <Aviso tipo="info">
          Texto em elaboração. As informações abaixo descrevem o funcionamento real do sistema;
          a redação jurídica final será publicada antes da abertura dos cadastros.
        </Aviso>
      </div>

      <section className="mt-8 flex flex-col gap-4">
        <Cartao>
          <h2 className="text-lg font-bold">Quais dados coletamos</h2>
          <ul className="mt-3 flex list-disc flex-col gap-1 pl-5 text-sm text-neutral-300">
            <li>Nome completo, nome de exibição, telefone, e-mail e data de nascimento.</li>
            <li>Sexo e peso, usados exclusivamente para definir sua categoria.</li>
            <li>Seus tempos, corridas, pontos e penalidades.</li>
          </ul>
        </Cartao>

        <Cartao>
          <h2 className="text-lg font-bold">O que aparece publicamente</h2>
          <p className="mt-3 text-sm text-neutral-300">
            No ranking público aparecem apenas: posição, número do piloto, nome de exibição,
            categoria, melhor volta e data do tempo.
          </p>
          <p className="mt-3 text-sm text-neutral-300">
            <strong>Seu peso, telefone, e-mail e data de nascimento nunca são exibidos
            publicamente.</strong>
          </p>
        </Cartao>

        <Cartao>
          <h2 className="text-lg font-bold">Como protegemos</h2>
          <ul className="mt-3 flex list-disc flex-col gap-1 pl-5 text-sm text-neutral-300">
            <li>Sua senha é guardada de forma irreversível — ninguém da equipe consegue lê-la.</li>
            <li>O acesso ao painel administrativo é restrito a usuários autorizados.</li>
            <li>Alterações feitas pela administração ficam registradas com responsável e data.</li>
          </ul>
        </Cartao>

        <Cartao>
          <h2 className="text-lg font-bold">Seus direitos</h2>
          <p className="mt-3 text-sm text-neutral-300">
            Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento
            pelos canais de contato da Na Pole Position.
          </p>
        </Cartao>
      </section>
    </main>
  );
}
