import "server-only";

import { z } from "zod";
import { gerarHashSenha, validarForcaSenha } from "@napole/auth";
import { prisma } from "@napole/db";
import {
  PESO_MAXIMO_KG,
  PESO_MINIMO_KG,
  REGRAS_JUNIOR,
  calcularIdade,
  definirCategoria,
  sugerirNomeExibicao,
} from "@napole/core";

/** Versao do texto de termos aceito. Subir quando o texto mudar. */
export const VERSAO_TERMOS = "2026-08-04";

/** Aceita "(11) 99999-9999", "11999999999" etc. e devolve so os digitos. */
function normalizarTelefone(valor: string): string {
  return valor.replace(/\D/g, "");
}

/** Aceita "82", "82,5" e "82.5". */
const pesoSchema = z
  .string()
  .trim()
  .transform((valor) => Number(valor.replace(",", ".")))
  .pipe(
    z
      .number({ message: "Informe o peso em kg" })
      .min(PESO_MINIMO_KG, `O peso precisa ser de pelo menos ${PESO_MINIMO_KG} kg`)
      .max(PESO_MAXIMO_KG, `O peso precisa ser de no maximo ${PESO_MAXIMO_KG} kg`),
  );

export const cadastroSchema = z
  .object({
    nomeCompleto: z
      .string()
      .trim()
      .min(3, "Informe seu nome completo")
      .refine((v) => v.includes(" "), "Informe nome e sobrenome"),
    nomeExibicao: z.string().trim().min(2, "Informe como quer aparecer no ranking").max(30),
    telefone: z
      .string()
      .transform(normalizarTelefone)
      .pipe(z.string().regex(/^\d{10,11}$/, "Informe DDD + numero, ex.: (11) 99999-9999")),
    email: z.string().trim().toLowerCase().email("E-mail invalido"),
    senha: z.string().superRefine((senha, ctx) => {
      const resultado = validarForcaSenha(senha);
      if (!resultado.valida) {
        ctx.addIssue({ code: "custom", message: resultado.motivo ?? "Senha invalida" });
      }
    }),
    dataNascimento: z.coerce.date({ message: "Informe sua data de nascimento" }),
    sexo: z.enum(["MASCULINO", "FEMININO", "OUTRO"]),
    categoriaBase: z.enum(["MASCULINO", "FEMININO"]).optional(),
    pesoDeclaradoKg: pesoSchema,
    alturaMetros: z.coerce.number().min(1).max(2.5).optional(),
    responsavelNome: z.string().trim().min(3).optional(),
    responsavelEmail: z.string().trim().toLowerCase().email().optional(),
    responsavelTelefone: z
      .string()
      .transform(normalizarTelefone)
      .pipe(z.string().regex(/^\d{10,11}$/))
      .optional(),
    aceiteTermos: z.literal(true, { message: "E preciso aceitar os termos para participar" }),
  })
  // Sexo "outro" nao tem faixa de peso propria no escopo: o piloto escolhe.
  .refine((dados) => dados.sexo !== "OUTRO" || dados.categoriaBase !== undefined, {
    path: ["categoriaBase"],
    message: "Escolha em qual categoria voce quer competir",
  })
  // Menor de idade so corre com contato do responsavel (secao 2.3).
  .refine(
    (dados) =>
      calcularIdade(dados.dataNascimento) >= REGRAS_JUNIOR.idadeMaximaExclusiva ||
      (dados.responsavelNome !== undefined && dados.responsavelTelefone !== undefined),
    {
      path: ["responsavelNome"],
      message: "Menores de 18 anos precisam do contato de um responsavel",
    },
  );

export type DadosCadastro = z.infer<typeof cadastroSchema>;

export type ResultadoCadastro =
  | { ok: true; numero: number; pilotoId: string }
  | { ok: false; erros: Record<string, string> };

/**
 * Cria o cadastro do piloto.
 *
 * O numero do piloto vem da sequence do banco (secao 2.2) — nao e calculado
 * aqui. Gerar "ultimo + 1" na aplicacao daria numero repetido se dois cadastros
 * acontecessem ao mesmo tempo.
 */
export async function cadastrarPiloto(dados: DadosCadastro): Promise<ResultadoCadastro> {
  const idade = calcularIdade(dados.dataNascimento);

  if (idade < REGRAS_JUNIOR.idadeMinima) {
    return {
      ok: false,
      erros: {
        dataNascimento: `A idade minima para correr na Na Pole Position e ${REGRAS_JUNIOR.idadeMinima} anos.`,
      },
    };
  }

  let categoria;
  try {
    categoria = definirCategoria({
      sexo: dados.sexo,
      categoriaBase: dados.categoriaBase,
      pesoDeclaradoKg: dados.pesoDeclaradoKg,
      dataNascimento: dados.dataNascimento,
      alturaMetros: dados.alturaMetros,
      temContatoResponsavel: dados.responsavelTelefone !== undefined,
    });
  } catch (erro) {
    return { ok: false, erros: { pesoDeclaradoKg: (erro as Error).message } };
  }

  const [emailEmUso, telefoneEmUso] = await Promise.all([
    prisma.piloto.findUnique({ where: { email: dados.email }, select: { id: true } }),
    prisma.piloto.findUnique({ where: { telefone: dados.telefone }, select: { id: true } }),
  ]);

  const erros: Record<string, string> = {};
  if (emailEmUso) erros.email = "Ja existe um cadastro com este e-mail.";
  if (telefoneEmUso) erros.telefone = "Ja existe um cadastro com este telefone.";
  if (Object.keys(erros).length > 0) return { ok: false, erros };

  const piloto = await prisma.piloto.create({
    data: {
      nomeCompleto: dados.nomeCompleto,
      nomeExibicao: dados.nomeExibicao || sugerirNomeExibicao(dados.nomeCompleto),
      telefone: dados.telefone,
      email: dados.email,
      senhaHash: await gerarHashSenha(dados.senha),
      dataNascimento: dados.dataNascimento,
      sexo: dados.sexo,
      categoriaBase: dados.categoriaBase ?? null,
      pesoDeclaradoKg: dados.pesoDeclaradoKg,
      alturaMetros: dados.alturaMetros ?? null,
      categoria,
      status: "ATIVO",
      responsavelNome: dados.responsavelNome ?? null,
      responsavelEmail: dados.responsavelEmail ?? null,
      responsavelTelefone: dados.responsavelTelefone ?? null,
      aceiteTermosEm: new Date(),
      versaoTermos: VERSAO_TERMOS,
    },
    select: { id: true, numero: true },
  });

  return { ok: true, pilotoId: piloto.id, numero: piloto.numero };
}
