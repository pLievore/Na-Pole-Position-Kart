"use server";

import { revalidatePath } from "next/cache";
import { exigirAdministrador } from "@/server/auth/guardas";
import {
  alteracaoCategoriaPilotoSchema,
  alterarCategoriaPiloto,
  bloquearPiloto,
  confirmarPesoPiloto,
  desbloquearPiloto,
  editarCadastroPiloto,
  inativarPiloto,
  type ResultadoGestaoPiloto,
} from "@/server/pilotos/gestao";
import { buscarPorNumero } from "@/server/pilotos/busca";
import { resetarSenhaPiloto, resetSenhaSchema } from "@/server/pilotos/senha";

export interface EstadoOperacaoPiloto {
  erros?: Record<string, string>;
  sucesso?: string;
}

function texto(dados: FormData, campo: string): string {
  const valor = dados.get(campo);
  return typeof valor === "string" ? valor : "";
}

async function pilotoDosDados(dados: FormData) {
  const parametroNumero = texto(dados, "numero").trim();
  if (!/^\d{1,10}$/.test(parametroNumero)) return null;

  const numero = Number(parametroNumero);
  if (!Number.isSafeInteger(numero) || numero <= 0 || numero > 2_147_483_647) return null;
  return buscarPorNumero(numero);
}

function errosZod(issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>) {
  const erros: Record<string, string> = {};
  for (const issue of issues) {
    const campo = String(issue.path[0] ?? "form");
    erros[campo] ??= issue.message;
  }
  return erros;
}

function revalidarPiloto(numero: number) {
  revalidatePath("/admin");
  revalidatePath("/admin/pilotos");
  revalidatePath(`/admin/pilotos/${numero}`);
  revalidatePath(`/admin/pilotos/${numero}/editar`);
  revalidatePath("/ranking");
  revalidatePath("/perfil");
}

function estadoDaGestao(resultado: ResultadoGestaoPiloto, mensagem: string): EstadoOperacaoPiloto {
  if (!resultado.ok) return { erros: resultado.erros };
  revalidarPiloto(resultado.piloto.numero);
  return { sucesso: mensagem };
}

export async function editarCadastroPilotoAction(
  _estado: EstadoOperacaoPiloto,
  dados: FormData,
): Promise<EstadoOperacaoPiloto> {
  const administrador = await exigirAdministrador();
  const piloto = await pilotoDosDados(dados);
  if (!piloto) return { erros: { form: "Piloto nao encontrado." } };

  const resultado = await editarCadastroPiloto(piloto.id, administrador.id, {
    nomeCompleto: texto(dados, "nomeCompleto"),
    nomeExibicao: texto(dados, "nomeExibicao"),
    telefone: texto(dados, "telefone"),
    email: texto(dados, "email"),
    observacoesInternas: texto(dados, "observacoesInternas"),
  });

  return estadoDaGestao(resultado, "Cadastro atualizado.");
}

export async function confirmarPesoPilotoAction(
  _estado: EstadoOperacaoPiloto,
  dados: FormData,
): Promise<EstadoOperacaoPiloto> {
  const administrador = await exigirAdministrador();
  const piloto = await pilotoDosDados(dados);
  if (!piloto) return { erros: { form: "Piloto nao encontrado." } };

  const resultado = await confirmarPesoPiloto(piloto.id, administrador.id, {
    pesoConferidoKg: texto(dados, "pesoConferidoKg"),
  });

  return estadoDaGestao(resultado, "Peso aferido registrado.");
}

export async function alterarCategoriaPilotoAction(
  _estado: EstadoOperacaoPiloto,
  dados: FormData,
): Promise<EstadoOperacaoPiloto> {
  const administrador = await exigirAdministrador();
  const piloto = await pilotoDosDados(dados);
  if (!piloto) return { erros: { form: "Piloto nao encontrado." } };

  const validacao = alteracaoCategoriaPilotoSchema.safeParse({
    categoria: texto(dados, "categoria"),
  });
  if (!validacao.success) return { erros: errosZod(validacao.error.issues) };

  const resultado = await alterarCategoriaPiloto(piloto.id, administrador.id, validacao.data);

  return estadoDaGestao(resultado, "Categoria manual definida.");
}

export async function alterarStatusPilotoAction(
  _estado: EstadoOperacaoPiloto,
  dados: FormData,
): Promise<EstadoOperacaoPiloto> {
  const administrador = await exigirAdministrador();
  const piloto = await pilotoDosDados(dados);
  if (!piloto) return { erros: { form: "Piloto nao encontrado." } };

  const destino = texto(dados, "destino");
  const resultado =
    destino === "BLOQUEADO"
      ? await bloquearPiloto(piloto.id, administrador.id)
      : destino === "ATIVO"
        ? await desbloquearPiloto(piloto.id, administrador.id)
        : null;

  if (!resultado) return { erros: { status: "Alteracao de status invalida." } };

  return estadoDaGestao(
    resultado,
    destino === "BLOQUEADO" ? "Piloto bloqueado e sessoes encerradas." : "Piloto desbloqueado.",
  );
}

export async function resetarSenhaPilotoAction(
  _estado: EstadoOperacaoPiloto,
  dados: FormData,
): Promise<EstadoOperacaoPiloto> {
  const administrador = await exigirAdministrador();
  const piloto = await pilotoDosDados(dados);
  if (!piloto) return { erros: { form: "Piloto nao encontrado." } };

  const validacao = resetSenhaSchema.safeParse({
    novaSenha: texto(dados, "novaSenha"),
    confirmacaoSenha: texto(dados, "confirmacaoSenha"),
  });
  if (!validacao.success) return { erros: errosZod(validacao.error.issues) };

  const resultado = await resetarSenhaPiloto(piloto.id, validacao.data, administrador.id);
  if (!resultado.ok) return { erros: { form: resultado.erro } };

  revalidarPiloto(piloto.numero);
  return { sucesso: "Senha redefinida e acessos anteriores encerrados." };
}

export async function inativarPilotoAction(
  _estado: EstadoOperacaoPiloto,
  dados: FormData,
): Promise<EstadoOperacaoPiloto> {
  const administrador = await exigirAdministrador();
  if (texto(dados, "confirmarInativacao") !== "on") {
    return { erros: { confirmarInativacao: "Confirme que o cadastro foi criado com erro." } };
  }

  const piloto = await pilotoDosDados(dados);
  if (!piloto) return { erros: { form: "Piloto nao encontrado." } };

  const resultado = await inativarPiloto(piloto.id, administrador.id);
  return estadoDaGestao(resultado, "Cadastro marcado como inativo. Nenhum historico foi apagado.");
}
