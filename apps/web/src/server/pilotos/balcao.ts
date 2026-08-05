import "server-only";

import { z } from "zod";
import { expiracaoConviteSenha, gerarToken } from "@napole/auth";
import { prisma, type Prisma } from "@napole/db";
import {
  PESO_MAXIMO_KG,
  PESO_MINIMO_KG,
  REGRAS_JUNIOR,
  VERSAO_TERMOS_VIGENTES,
  calcularIdade,
  definirCategoria,
  formatarNumeroPiloto,
  sugerirNomeExibicao,
} from "@napole/core";
import { registrarAuditoria } from "@/server/auditoria/registrar";

/**
 * Cadastro de piloto feito no balcao pela equipe (secao 11 do escopo).
 *
 * Difere do cadastro do site em tres pontos, e cada um tem um motivo:
 *
 * 1. **Nasce sem senha.** O operador nunca escolhe a senha de outra pessoa. O
 *    piloto recebe um convite de primeiro acesso e define a dele depois.
 * 2. **O peso entra como aferido.** Quem cadastra no balcao esta na pista e sobe
 *    na balanca; nao faz sentido registrar como "declarado" e deixar a
 *    conferencia pendente.
 * 3. **O e-mail e opcional.** Nem todo mundo tem em maos, e a pessoa precisa
 *    entrar na pista agora. Sem e-mail ela corre e aparece no ranking; so nao
 *    consegue acessar o site ate a equipe complementar o cadastro.
 */

function normalizarTelefone(valor: string): string {
  return valor.replace(/\D/g, "");
}

const pesoSchema = z
  .string()
  .trim()
  .transform((valor) => Number(valor.replace(",", ".")))
  .pipe(
    z
      .number({ message: "Informe o peso aferido na balança" })
      .min(PESO_MINIMO_KG, `O peso precisa ser de pelo menos ${PESO_MINIMO_KG} kg`)
      .max(PESO_MAXIMO_KG, `O peso precisa ser de no maximo ${PESO_MAXIMO_KG} kg`),
  );

export const cadastroBalcaoSchema = z
  .object({
    nomeCompleto: z
      .string()
      .trim()
      .min(3, "Informe o nome completo")
      .refine((v) => v.includes(" "), "Informe nome e sobrenome"),
    nomeExibicao: z.string().trim().max(30).optional(),
    telefone: z
      .string()
      .transform(normalizarTelefone)
      .pipe(z.string().regex(/^\d{10,11}$/, "Informe DDD + numero")),
    email: z.string().trim().toLowerCase().email("E-mail invalido").optional(),
    dataNascimento: z.coerce.date({ message: "Informe a data de nascimento" }),
    sexo: z.enum(["MASCULINO", "FEMININO", "OUTRO"]),
    categoriaBase: z.enum(["MASCULINO", "FEMININO"]).optional(),
    pesoAferidoKg: pesoSchema,
    alturaMetros: z.coerce.number().min(1).max(2.5).optional(),
    responsavelNome: z.string().trim().min(3).optional(),
    responsavelTelefone: z
      .string()
      .transform(normalizarTelefone)
      .pipe(z.string().regex(/^\d{10,11}$/))
      .optional(),
    responsavelEmail: z.string().trim().toLowerCase().email().optional(),
    observacoesInternas: z.string().trim().max(500).optional(),
    /** O operador confirma que apresentou os termos a pessoa presente. */
    aceiteTermos: z.literal(true, { message: "Confirme o aceite dos termos com o piloto" }),
  })
  .refine((d) => d.sexo !== "OUTRO" || d.categoriaBase !== undefined, {
    path: ["categoriaBase"],
    message: "Escolha em qual categoria o piloto vai competir",
  })
  .refine(
    (d) =>
      calcularIdade(d.dataNascimento) >= REGRAS_JUNIOR.idadeMaximaExclusiva ||
      (d.responsavelNome !== undefined && d.responsavelTelefone !== undefined),
    {
      path: ["responsavelNome"],
      message: "Menores de 18 anos precisam do contato de um responsavel",
    },
  );

export type DadosCadastroBalcao = z.infer<typeof cadastroBalcaoSchema>;

export interface PilotoCriadoNoBalcao {
  pilotoId: string;
  numero: number;
  numeroFormatado: string;
  nomeExibicao: string;
  categoria: string;
  /**
   * Link de primeiro acesso. Aparece uma unica vez, na tela de quem cadastrou:
   * o token e guardado apenas como hash e nao pode ser exibido de novo.
   * `null` quando o cadastro nao tem e-mail — sem e-mail nao ha como entrar.
   */
  linkPrimeiroAcesso: string | null;
}

export type ResultadoCadastroBalcao =
  | { ok: true; piloto: PilotoCriadoNoBalcao }
  | { ok: false; erros: Record<string, string> };

/**
 * Cria o cadastro e, quando ha e-mail, o convite de primeiro acesso.
 * Tudo em uma transacao: um piloto sem o convite correspondente deixaria a
 * pessoa sem caminho de acesso e sem ninguem perceber.
 */
export async function cadastrarPilotoNoBalcao(
  operadorId: string,
  dados: DadosCadastroBalcao,
  urlBase: string,
): Promise<ResultadoCadastroBalcao> {
  const idade = calcularIdade(dados.dataNascimento);
  if (idade < REGRAS_JUNIOR.idadeMinima) {
    return {
      ok: false,
      erros: {
        dataNascimento: `A idade minima para correr e ${REGRAS_JUNIOR.idadeMinima} anos.`,
      },
    };
  }

  let categoria;
  try {
    categoria = definirCategoria({
      sexo: dados.sexo,
      categoriaBase: dados.categoriaBase,
      // O peso do balcao ja e o aferido; entra nos dois campos para o historico
      // nao ficar com "declarado" vazio.
      pesoDeclaradoKg: dados.pesoAferidoKg,
      pesoConferidoKg: dados.pesoAferidoKg,
      dataNascimento: dados.dataNascimento,
      alturaMetros: dados.alturaMetros,
      temContatoResponsavel: dados.responsavelTelefone !== undefined,
    });
  } catch (erro) {
    return { ok: false, erros: { pesoAferidoKg: (erro as Error).message } };
  }

  const agora = new Date();

  try {
    return await prisma.$transaction(async (tx) => {
      const piloto = await tx.piloto.create({
        data: {
          nomeCompleto: dados.nomeCompleto,
          nomeExibicao: dados.nomeExibicao || sugerirNomeExibicao(dados.nomeCompleto),
          telefone: dados.telefone,
          email: dados.email ?? null,
          senhaHash: null,
          dataNascimento: dados.dataNascimento,
          sexo: dados.sexo,
          categoriaBase: dados.categoriaBase ?? null,
          pesoDeclaradoKg: dados.pesoAferidoKg,
          pesoConferidoKg: dados.pesoAferidoKg,
          pesoConferidoEm: agora,
          alturaMetros: dados.alturaMetros ?? null,
          categoria,
          status: "ATIVO",
          responsavelNome: dados.responsavelNome ?? null,
          responsavelTelefone: dados.responsavelTelefone ?? null,
          responsavelEmail: dados.responsavelEmail ?? null,
          aceiteTermosEm: agora,
          versaoTermos: VERSAO_TERMOS_VIGENTES,
          observacoesInternas: dados.observacoesInternas ?? null,
        },
        select: { id: true, numero: true, nomeExibicao: true, categoria: true },
      });

      let linkPrimeiroAcesso: string | null = null;
      if (dados.email) {
        const { token, hash } = gerarToken();
        await tx.tokenSenha.create({
          data: {
            tokenHash: hash,
            pilotoId: piloto.id,
            finalidade: "PRIMEIRO_ACESSO",
            expiraEm: expiracaoConviteSenha(agora),
          },
        });
        linkPrimeiroAcesso = `${urlBase.replace(/\/$/, "")}/definir-senha?token=${token}`;
      }

      await registrarAuditoria(tx, {
        usuarioId: operadorId,
        entidade: "Piloto",
        entidadeId: piloto.id,
        acao: "CRIAR",
        depois: {
          origem: "BALCAO",
          numero: piloto.numero,
          nomeCompleto: dados.nomeCompleto,
          telefone: dados.telefone,
          temEmail: Boolean(dados.email),
          pesoAferidoKg: dados.pesoAferidoKg,
          categoria,
          aceiteTermosVersao: VERSAO_TERMOS_VIGENTES,
        },
      });

      return {
        ok: true as const,
        piloto: {
          pilotoId: piloto.id,
          numero: piloto.numero,
          numeroFormatado: formatarNumeroPiloto(piloto.numero),
          nomeExibicao: piloto.nomeExibicao,
          categoria: piloto.categoria,
          linkPrimeiroAcesso,
        },
      };
    });
  } catch (erro) {
    const conflito = conflitoDeCadastro(erro);
    if (conflito) return { ok: false, erros: conflito };
    throw erro;
  }
}

/** Traduz a violacao de indice unico do Postgres no campo que o operador digitou. */
function conflitoDeCadastro(erro: unknown): Record<string, string> | null {
  const conhecido = erro as Prisma.PrismaClientKnownRequestError;
  if (conhecido?.code !== "P2002") return null;

  const alvo = conhecido.meta?.target;
  const campos = Array.isArray(alvo) ? alvo.map(String) : [String(alvo ?? "")];

  if (campos.some((campo) => campo.includes("telefone"))) {
    return { telefone: "Ja existe um piloto com este telefone." };
  }
  if (campos.some((campo) => campo.includes("email"))) {
    return { email: "Ja existe um piloto com este e-mail." };
  }
  return { form: "Telefone ou e-mail ja pertence a outro cadastro." };
}
