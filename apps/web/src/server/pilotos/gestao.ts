import "server-only";

import { z } from "zod";
import { prisma, Prisma } from "@napole/db";
import {
  PESO_MAXIMO_KG,
  PESO_MINIMO_KG,
  definirCategoria,
  type Categoria,
  type StatusPiloto,
} from "@napole/core";
import { registrarAuditoria } from "@/server/auditoria/registrar";
import { travarPilotoPorId } from "@/server/pilotos/trava";

const CATEGORIAS = [
  "MASCULINO_LEVE",
  "MASCULINO_MEDIO",
  "MASCULINO_PESADO",
  "FEMININO_LEVE",
  "FEMININO_MEDIO",
  "FEMININO_PESADO",
  "JUNIOR",
] as const satisfies readonly Categoria[];

/** Aceita a formatacao digitada no balcao e persiste apenas os digitos. */
const telefoneSchema = z
  .string()
  .transform((valor) => valor.replace(/\D/g, ""))
  .pipe(z.string().regex(/^\d{10,11}$/, "Informe DDD + numero, ex.: (11) 99999-9999"));

const observacoesSchema = z
  .string()
  .trim()
  .max(5_000, "As observacoes devem ter no maximo 5000 caracteres")
  .nullable()
  .optional()
  .transform((valor) => valor || null);

export const edicaoCadastroPilotoSchema = z.object({
  nomeCompleto: z
    .string()
    .trim()
    .min(3, "Informe o nome completo")
    .refine((valor) => valor.includes(" "), "Informe nome e sobrenome"),
  nomeExibicao: z
    .string()
    .trim()
    .min(2, "Informe o nome de exibicao")
    .max(30, "O nome de exibicao deve ter no maximo 30 caracteres"),
  telefone: telefoneSchema,
  email: z.string().trim().toLowerCase().email("E-mail invalido"),
  observacoesInternas: observacoesSchema,
});

const pesoConferidoSchema = z
  .union([z.string(), z.number()])
  .transform((valor, contexto) => {
    const texto = (typeof valor === "number" ? String(valor) : valor.trim()).replace(",", ".");

    if (!/^-?\d+(?:\.\d{1,2})?$/.test(texto)) {
      contexto.addIssue({
        code: "custom",
        message:
          texto === "" ? "Informe o peso em kg" : "Use um numero com no maximo duas casas decimais",
      });
      return z.NEVER;
    }

    // O banco usa Decimal(5,2). O core precisa receber exatamente o mesmo
    // valor que sera persistido para nao divergir na fronteira de categoria.
    return Math.round(Number(texto) * 100) / 100;
  })
  .pipe(
    z
      .number({ message: "Informe o peso em kg" })
      .finite("Informe o peso em kg")
      .min(PESO_MINIMO_KG, `O peso precisa ser de pelo menos ${PESO_MINIMO_KG} kg`)
      .max(PESO_MAXIMO_KG, `O peso precisa ser de no maximo ${PESO_MAXIMO_KG} kg`),
  );

export const confirmacaoPesoPilotoSchema = z.object({
  pesoConferidoKg: pesoConferidoSchema,
});

export const alteracaoCategoriaPilotoSchema = z.object({
  categoria: z.enum(CATEGORIAS, { message: "Selecione uma categoria valida" }),
});

export type EntradaEdicaoCadastroPiloto = z.input<typeof edicaoCadastroPilotoSchema>;
export type DadosEdicaoCadastroPiloto = z.output<typeof edicaoCadastroPilotoSchema>;
export type EntradaConfirmacaoPesoPiloto = z.input<typeof confirmacaoPesoPilotoSchema>;
export type DadosConfirmacaoPesoPiloto = z.output<typeof confirmacaoPesoPilotoSchema>;
export type EntradaAlteracaoCategoriaPiloto = z.input<typeof alteracaoCategoriaPilotoSchema>;
export type DadosAlteracaoCategoriaPiloto = z.output<typeof alteracaoCategoriaPilotoSchema>;

export interface PilotoAposGestao {
  id: string;
  numero: number;
  nomeExibicao: string;
  categoria: Categoria;
  categoriaManual: boolean;
  status: StatusPiloto;
  pesoConferidoKg: number | null;
  pesoConferidoEm: Date | null;
}

export type ResultadoGestaoPiloto =
  { ok: true; piloto: PilotoAposGestao } | { ok: false; erros: Record<string, string> };

const selecaoResumo = {
  id: true,
  numero: true,
  nomeExibicao: true,
  categoria: true,
  categoriaManual: true,
  status: true,
  pesoConferidoKg: true,
  pesoConferidoEm: true,
} as const;

function paraResumo(piloto: {
  id: string;
  numero: number;
  nomeExibicao: string;
  categoria: Categoria;
  categoriaManual: boolean;
  status: StatusPiloto;
  pesoConferidoKg: { toString(): string } | null;
  pesoConferidoEm: Date | null;
}): PilotoAposGestao {
  return {
    ...piloto,
    pesoConferidoKg:
      piloto.pesoConferidoKg === null ? null : Number(piloto.pesoConferidoKg.toString()),
  };
}

function errosDaValidacao(erro: z.ZodError): Record<string, string> {
  const erros: Record<string, string> = {};
  for (const issue of erro.issues) {
    const campo = String(issue.path[0] ?? "form");
    erros[campo] ??= issue.message;
  }
  return erros;
}

function errosDeConflito(erro: unknown): Record<string, string> | null {
  if (!(erro instanceof Prisma.PrismaClientKnownRequestError) || erro.code !== "P2002") {
    return null;
  }

  const alvo = erro.meta?.target;
  const campos = Array.isArray(alvo) ? alvo.map(String) : [String(alvo ?? "")];
  const erros: Record<string, string> = {};

  if (campos.some((campo) => campo.includes("email"))) {
    erros.email = "Ja existe um cadastro com este e-mail.";
  }
  if (campos.some((campo) => campo.includes("telefone"))) {
    erros.telefone = "Ja existe um cadastro com este telefone.";
  }

  return Object.keys(erros).length > 0
    ? erros
    : { form: "E-mail ou telefone ja pertence a outro cadastro." };
}

function fotoCadastro(piloto: {
  nomeCompleto: string;
  nomeExibicao: string;
  telefone: string;
  email: string;
  observacoesInternas: string | null;
}) {
  return {
    nomeCompleto: piloto.nomeCompleto,
    nomeExibicao: piloto.nomeExibicao,
    telefone: piloto.telefone,
    email: piloto.email,
    observacoesInternas: piloto.observacoesInternas,
  };
}

function fotoPeso(piloto: {
  pesoConferidoKg: { toString(): string } | null;
  pesoConferidoEm: Date | null;
  categoria: Categoria;
  categoriaManual: boolean;
}) {
  return {
    pesoConferidoKg: piloto.pesoConferidoKg?.toString() ?? null,
    pesoConferidoEm: piloto.pesoConferidoEm?.toISOString() ?? null,
    categoria: piloto.categoria,
    categoriaManual: piloto.categoriaManual,
  };
}

/** Edita apenas os campos administrativos autorizados nesta entrega. */
export async function editarCadastroPiloto(
  pilotoId: string,
  administradorId: string,
  entrada: EntradaEdicaoCadastroPiloto,
): Promise<ResultadoGestaoPiloto> {
  const validacao = edicaoCadastroPilotoSchema.safeParse(entrada);
  if (!validacao.success) return { ok: false, erros: errosDaValidacao(validacao.error) };
  const dados = validacao.data;

  try {
    return await prisma.$transaction(async (tx): Promise<ResultadoGestaoPiloto> => {
      if (!(await travarPilotoPorId(tx, pilotoId))) {
        return { ok: false, erros: { piloto: "Piloto nao encontrado." } };
      }

      const piloto = await tx.piloto.findUnique({
        where: { id: pilotoId },
        select: {
          id: true,
          nomeCompleto: true,
          nomeExibicao: true,
          telefone: true,
          email: true,
          observacoesInternas: true,
        },
      });

      if (!piloto) return { ok: false, erros: { piloto: "Piloto nao encontrado." } };

      const [emailEmUso, telefoneEmUso] = await Promise.all([
        tx.piloto.findUnique({ where: { email: dados.email }, select: { id: true } }),
        tx.piloto.findUnique({ where: { telefone: dados.telefone }, select: { id: true } }),
      ]);

      const conflitos: Record<string, string> = {};
      if (emailEmUso && emailEmUso.id !== pilotoId) {
        conflitos.email = "Ja existe um cadastro com este e-mail.";
      }
      if (telefoneEmUso && telefoneEmUso.id !== pilotoId) {
        conflitos.telefone = "Ja existe um cadastro com este telefone.";
      }
      if (Object.keys(conflitos).length > 0) return { ok: false, erros: conflitos };

      const emailMudou = piloto.email !== dados.email;

      const atualizado = await tx.piloto.update({
        where: { id: pilotoId },
        data: dados,
        select: {
          ...selecaoResumo,
          nomeCompleto: true,
          telefone: true,
          email: true,
          observacoesInternas: true,
        },
      });

      let sessoesRevogadas = 0;
      let tokensRevogados = 0;
      if (emailMudou) {
        const sessoes = await tx.sessaoPiloto.deleteMany({ where: { pilotoId } });
        const tokens = await tx.tokenSenha.updateMany({
          where: { pilotoId, usadoEm: null },
          data: { usadoEm: new Date() },
        });
        sessoesRevogadas = sessoes.count;
        tokensRevogados = tokens.count;
      }

      await registrarAuditoria(tx, {
        usuarioId: administradorId,
        entidade: "Piloto",
        entidadeId: pilotoId,
        acao: "EDITAR",
        antes: fotoCadastro(piloto),
        depois: {
          ...fotoCadastro(atualizado),
          sessoesRevogadas,
          tokensRevogados,
        },
      });

      return { ok: true, piloto: paraResumo(atualizado) };
    });
  } catch (erro) {
    const conflitos = errosDeConflito(erro);
    if (conflitos) return { ok: false, erros: conflitos };
    throw erro;
  }
}

/** Confirma o peso aferido sem desfazer uma categoria fixada manualmente. */
export async function confirmarPesoPiloto(
  pilotoId: string,
  administradorId: string,
  entrada: EntradaConfirmacaoPesoPiloto,
): Promise<ResultadoGestaoPiloto> {
  const validacao = confirmacaoPesoPilotoSchema.safeParse(entrada);
  if (!validacao.success) return { ok: false, erros: errosDaValidacao(validacao.error) };
  const { pesoConferidoKg } = validacao.data;

  return prisma.$transaction(async (tx): Promise<ResultadoGestaoPiloto> => {
    if (!(await travarPilotoPorId(tx, pilotoId))) {
      return { ok: false, erros: { piloto: "Piloto nao encontrado." } };
    }

    const piloto = await tx.piloto.findUnique({
      where: { id: pilotoId },
      select: {
        id: true,
        sexo: true,
        categoriaBase: true,
        pesoDeclaradoKg: true,
        pesoConferidoKg: true,
        pesoConferidoEm: true,
        dataNascimento: true,
        alturaMetros: true,
        responsavelTelefone: true,
        categoria: true,
        categoriaManual: true,
      },
    });

    if (!piloto) return { ok: false, erros: { piloto: "Piloto nao encontrado." } };

    const agora = new Date();
    let categoria = piloto.categoria;

    if (!piloto.categoriaManual) {
      try {
        categoria = definirCategoria({
          sexo: piloto.sexo,
          categoriaBase: piloto.categoriaBase,
          pesoDeclaradoKg: Number(piloto.pesoDeclaradoKg.toString()),
          pesoConferidoKg,
          dataNascimento: piloto.dataNascimento,
          alturaMetros:
            piloto.alturaMetros === null ? null : Number(piloto.alturaMetros.toString()),
          temContatoResponsavel: piloto.responsavelTelefone !== null,
          referencia: agora,
        });
      } catch (erro) {
        return {
          ok: false,
          erros: {
            pesoConferidoKg:
              erro instanceof Error ? erro.message : "Nao foi possivel recalcular a categoria.",
          },
        };
      }
    }

    const atualizado = await tx.piloto.update({
      where: { id: pilotoId },
      data: { pesoConferidoKg, pesoConferidoEm: agora, categoria },
      select: selecaoResumo,
    });

    await registrarAuditoria(tx, {
      usuarioId: administradorId,
      entidade: "Piloto",
      entidadeId: pilotoId,
      acao: "CONFERIR_PESO",
      antes: fotoPeso(piloto),
      depois: fotoPeso(atualizado),
    });

    return { ok: true, piloto: paraResumo(atualizado) };
  });
}

/** Fixa a categoria atual; corridas anteriores continuam com a categoria congelada. */
export async function alterarCategoriaPiloto(
  pilotoId: string,
  administradorId: string,
  entrada: EntradaAlteracaoCategoriaPiloto,
): Promise<ResultadoGestaoPiloto> {
  const validacao = alteracaoCategoriaPilotoSchema.safeParse(entrada);
  if (!validacao.success) return { ok: false, erros: errosDaValidacao(validacao.error) };

  return prisma.$transaction(async (tx): Promise<ResultadoGestaoPiloto> => {
    if (!(await travarPilotoPorId(tx, pilotoId))) {
      return { ok: false, erros: { piloto: "Piloto nao encontrado." } };
    }

    const piloto = await tx.piloto.findUnique({
      where: { id: pilotoId },
      select: { id: true, categoria: true, categoriaManual: true },
    });

    if (!piloto) return { ok: false, erros: { piloto: "Piloto nao encontrado." } };

    const atualizado = await tx.piloto.update({
      where: { id: pilotoId },
      data: { categoria: validacao.data.categoria, categoriaManual: true },
      select: selecaoResumo,
    });

    await registrarAuditoria(tx, {
      usuarioId: administradorId,
      entidade: "Piloto",
      entidadeId: pilotoId,
      acao: "ALTERAR_CATEGORIA",
      antes: { categoria: piloto.categoria, categoriaManual: piloto.categoriaManual },
      depois: {
        categoria: atualizado.categoria,
        categoriaManual: atualizado.categoriaManual,
      },
    });

    return { ok: true, piloto: paraResumo(atualizado) };
  });
}

async function alterarStatusPiloto(
  pilotoId: string,
  administradorId: string,
  esperado: StatusPiloto,
  novoStatus: StatusPiloto,
  acao: "BLOQUEAR" | "DESBLOQUEAR",
): Promise<ResultadoGestaoPiloto> {
  return prisma.$transaction(async (tx): Promise<ResultadoGestaoPiloto> => {
    if (!(await travarPilotoPorId(tx, pilotoId))) {
      return { ok: false, erros: { piloto: "Piloto nao encontrado." } };
    }

    const piloto = await tx.piloto.findUnique({
      where: { id: pilotoId },
      select: { id: true, status: true },
    });

    if (!piloto) return { ok: false, erros: { piloto: "Piloto nao encontrado." } };
    if (piloto.status !== esperado) {
      const mensagem =
        piloto.status === "INATIVO"
          ? "Cadastro inativo nao pode mudar por esta operacao."
          : novoStatus === "BLOQUEADO"
            ? "O piloto ja esta bloqueado."
            : "O piloto ja esta ativo.";
      return { ok: false, erros: { status: mensagem } };
    }

    // O status no filtro impede que duas alteracoes concorrentes atravessem a
    // mesma transicao a partir de fotografias diferentes.
    const alteracao = await tx.piloto.updateMany({
      where: { id: pilotoId, status: esperado },
      data: { status: novoStatus },
    });
    if (alteracao.count !== 1) {
      return {
        ok: false,
        erros: {
          status: "O status mudou durante a operacao. Atualize a pagina e tente novamente.",
        },
      };
    }

    let sessoesRevogadas = 0;
    let tokensRevogados = 0;
    if (novoStatus === "BLOQUEADO") {
      const sessoes = await tx.sessaoPiloto.deleteMany({ where: { pilotoId } });
      const tokens = await tx.tokenSenha.updateMany({
        where: { pilotoId, usadoEm: null },
        data: { usadoEm: new Date() },
      });
      sessoesRevogadas = sessoes.count;
      tokensRevogados = tokens.count;
    }

    const atualizado = await tx.piloto.findUniqueOrThrow({
      where: { id: pilotoId },
      select: selecaoResumo,
    });

    await registrarAuditoria(tx, {
      usuarioId: administradorId,
      entidade: "Piloto",
      entidadeId: pilotoId,
      acao,
      antes: { status: piloto.status },
      depois: {
        status: atualizado.status,
        ...(novoStatus === "BLOQUEADO" ? { sessoesRevogadas, tokensRevogados } : {}),
      },
    });

    return { ok: true, piloto: paraResumo(atualizado) };
  });
}

export async function bloquearPiloto(
  pilotoId: string,
  administradorId: string,
): Promise<ResultadoGestaoPiloto> {
  return alterarStatusPiloto(pilotoId, administradorId, "ATIVO", "BLOQUEADO", "BLOQUEAR");
}

export async function desbloquearPiloto(
  pilotoId: string,
  administradorId: string,
): Promise<ResultadoGestaoPiloto> {
  return alterarStatusPiloto(pilotoId, administradorId, "BLOQUEADO", "ATIVO", "DESBLOQUEAR");
}

/** Marca cadastro incorreto como inativo; nenhum dado historico e apagado. */
export async function inativarPiloto(
  pilotoId: string,
  administradorId: string,
): Promise<ResultadoGestaoPiloto> {
  return prisma.$transaction(async (tx): Promise<ResultadoGestaoPiloto> => {
    if (!(await travarPilotoPorId(tx, pilotoId))) {
      return { ok: false, erros: { piloto: "Piloto nao encontrado." } };
    }

    const piloto = await tx.piloto.findUnique({
      where: { id: pilotoId },
      select: { id: true, status: true },
    });

    if (!piloto) return { ok: false, erros: { piloto: "Piloto nao encontrado." } };
    if (piloto.status === "INATIVO") {
      return { ok: false, erros: { status: "O cadastro ja esta inativo." } };
    }

    const alteracao = await tx.piloto.updateMany({
      where: { id: pilotoId, status: piloto.status },
      data: { status: "INATIVO" },
    });
    if (alteracao.count !== 1) {
      return {
        ok: false,
        erros: {
          status: "O status mudou durante a operacao. Atualize a pagina e tente novamente.",
        },
      };
    }

    const sessoes = await tx.sessaoPiloto.deleteMany({ where: { pilotoId } });
    const tokens = await tx.tokenSenha.updateMany({
      where: { pilotoId, usadoEm: null },
      data: { usadoEm: new Date() },
    });

    const atualizado = await tx.piloto.findUniqueOrThrow({
      where: { id: pilotoId },
      select: selecaoResumo,
    });

    await registrarAuditoria(tx, {
      usuarioId: administradorId,
      entidade: "Piloto",
      entidadeId: pilotoId,
      acao: "INATIVAR",
      antes: { status: piloto.status },
      depois: {
        status: atualizado.status,
        sessoesRevogadas: sessoes.count,
        tokensRevogados: tokens.count,
      },
    });

    return { ok: true, piloto: paraResumo(atualizado) };
  });
}
