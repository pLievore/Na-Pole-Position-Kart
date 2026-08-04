"use server";

import { z } from "zod";
import {
  dataHoraOperacionalISO,
  parseDataCivil,
  parseDataHoraOperacional,
} from "@napole/core";
import {
  listarHorariosPublicos,
  solicitarAgendamentoPublico,
} from "@/server/agendamentos";
import type {
  EstadoSolicitacaoAgendamento,
  ResultadoConsultaHorarios,
} from "./contrato";

const schemaData = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const schemaSolicitacao = z.object({
  data: schemaData,
  horarioId: z.string().min(1, "Escolha um horário."),
  nomeResponsavel: z.string().trim().min(3, "Informe o nome do responsável."),
  whatsapp: z
    .string()
    .transform((valor) => valor.replace(/\D/g, ""))
    .pipe(z.string().min(10, "Informe um WhatsApp com DDD.").max(15, "WhatsApp inválido.")),
  email: z.string().trim().email("Informe um e-mail válido."),
  quantidade: z.coerce.number().int().min(1).max(10),
  menorDeIdade: z.enum(["SIM", "NAO"], {
    required_error: "Informe se há participante menor de idade.",
  }),
  observacoes: z.string().trim().max(500, "Use no máximo 500 caracteres.").optional(),
  aceiteTermos: z.literal("SIM", {
    errorMap: () => ({ message: "Aceite os termos para enviar a solicitação." }),
  }),
});

export async function consultarHorariosAction(data: string): Promise<ResultadoConsultaHorarios> {
  if (!schemaData.safeParse(data).success) {
    return { ok: false, horarios: [], mensagem: "Escolha uma data válida." };
  }
  try {
    const dataCivil = parseDataCivil(data);
    const dataSeguinte = new Date(dataCivil.getTime() + 86_400_000).toISOString().slice(0, 10);
    const resultado = await listarHorariosPublicos({
      de: parseDataHoraOperacional(`${data}T00:00`),
      ate: parseDataHoraOperacional(`${dataSeguinte}T00:00`),
    });
    if (!resultado.ok) {
      return {
        ok: false,
        horarios: [],
        mensagem: "Não foi possível consultar a agenda agora. Tente novamente.",
      };
    }

    return {
      ok: true,
      horarios: resultado.valor.map((horario) => ({
        id: horario.id,
        inicioEm: dataHoraOperacionalISO(horario.inicioEm),
        fimEm: dataHoraOperacionalISO(horario.fimEm),
        vagasDisponiveis: horario.vagasDisponiveis,
        capacidade: horario.capacidade,
        status:
          horario.vagasDisponiveis === 0
            ? "LOTADO"
            : horario.vagasDisponiveis <= Math.max(2, Math.ceil(horario.capacidade * 0.3))
              ? "ULTIMAS_VAGAS"
              : "DISPONIVEL",
      })),
    };
  } catch {
    return {
      ok: false,
      horarios: [],
      mensagem: "Não foi possível consultar a agenda agora. Tente novamente.",
    };
  }
}

export async function solicitarAgendamentoAction(
  _estadoAnterior: EstadoSolicitacaoAgendamento,
  formulario: FormData,
): Promise<EstadoSolicitacaoAgendamento> {
  // Campo-isca: robôs que preenchem tudo recebem resposta neutra sem gravar PII.
  if (texto(formulario, "website")) {
    return {
      status: "sucesso",
      mensagem: "A solicitação está pendente e será revisada pela equipe.",
    };
  }

  const quantidadeInformada = Number(texto(formulario, "quantidade"));
  const quantidade =
    Number.isInteger(quantidadeInformada) && quantidadeInformada >= 1 && quantidadeInformada <= 10
      ? quantidadeInformada
      : 0;

  const resultado = schemaSolicitacao.safeParse({
    data: texto(formulario, "data"),
    horarioId: texto(formulario, "horarioId"),
    nomeResponsavel: texto(formulario, "nomeResponsavel"),
    whatsapp: texto(formulario, "whatsapp"),
    email: texto(formulario, "email"),
    quantidade: texto(formulario, "quantidade"),
    menorDeIdade: texto(formulario, "menorDeIdade") || undefined,
    observacoes: texto(formulario, "observacoes") || undefined,
    aceiteTermos: texto(formulario, "aceiteTermos") || undefined,
  });

  const erros: Record<string, string> = {};

  if (!resultado.success) {
    const errosCampos = resultado.error.flatten().fieldErrors;
    for (const [campo, mensagens] of Object.entries(errosCampos)) {
      if (mensagens?.[0]) erros[campo] = mensagens[0];
    }
  }

  for (let indice = 0; indice < quantidade; indice += 1) {
    const nome = texto(formulario, "participanteNome_" + indice).trim();
    if (nome.length < 2) {
      erros["participanteNome_" + indice] = "Informe o nome do participante.";
    }
  }

  if (Object.keys(erros).length > 0 || !resultado.success) {
    return {
      status: "erro",
      mensagem: "Revise os campos indicados.",
      erros,
    };
  }

  const participantes = Array.from({ length: resultado.data.quantidade }, (_, indice) => ({
    nomeCompleto: texto(formulario, `participanteNome_${indice}`),
  }));
  const criacao = await solicitarAgendamentoPublico({
    horarioId: resultado.data.horarioId,
    responsavelNome: resultado.data.nomeResponsavel,
    responsavelTelefone: resultado.data.whatsapp,
    responsavelEmail: resultado.data.email,
    participantes,
    temParticipanteMenor: resultado.data.menorDeIdade === "SIM",
    observacoesCliente: resultado.data.observacoes,
    aceiteTermos: true,
  });

  if (!criacao.ok) {
    const mensagem = mensagemPublicaErro(criacao.erro.codigo, criacao.erro.mensagem);
    const campo = criacao.erro.codigo === "AGENDAMENTO_DUPLICADO"
      ? undefined
      : mapearCampoErro(criacao.erro.campo);
    return {
      status: "erro",
      mensagem,
      ...(campo ? { erros: { [campo]: mensagem } } : {}),
    };
  }

  return {
    status: "sucesso",
    protocolo: criacao.valor.codigoPublico,
    mensagem:
      "A solicitação está pendente e ocupa as vagas até a equipe confirmar. Guarde o protocolo.",
  };
}

function mensagemPublicaErro(codigo: string, mensagemOriginal: string): string {
  if (
    [
      "AGENDAMENTO_DUPLICADO",
      "ANTECEDENCIA_INSUFICIENTE",
      "CAPACIDADE_ESGOTADA",
      "HORARIO_INDISPONIVEL",
      "HORARIO_NAO_ENCONTRADO",
    ].includes(codigo)
  ) {
    return "Este horário não está mais disponível para a solicitação. Atualize a agenda e escolha outra opção.";
  }
  if (
    [
      "EMAIL_INVALIDO",
      "NOME_INVALIDO",
      "OBSERVACOES_INVALIDAS",
      "PARTICIPANTES_INVALIDOS",
      "TELEFONE_INVALIDO",
      "TERMOS_NAO_ACEITOS",
    ].includes(codigo)
  ) {
    return mensagemOriginal;
  }
  return "Não foi possível enviar a solicitação agora. Tente novamente em instantes.";
}

function texto(formulario: FormData, campo: string): string {
  const valor = formulario.get(campo);
  return typeof valor === "string" ? valor : "";
}

function mapearCampoErro(campo?: string): string | undefined {
  if (!campo) return undefined;
  if (campo === "responsavelNome") return "nomeResponsavel";
  if (campo === "responsavelTelefone") return "whatsapp";
  if (campo === "responsavelEmail") return "email";
  if (campo === "observacoesCliente") return "observacoes";
  const participante = /^participantes\.(\d+)\.nomeCompleto$/.exec(campo);
  if (participante) return `participanteNome_${participante[1]}`;
  return campo;
}
