-- As tabelas da aplicacao nao fazem parte da Data API. Revogar os defaults
-- antes de cria-las evita exposicao acidental mesmo se a API for reativada.
ALTER DEFAULT PRIVILEGES IN SCHEMA "public" REVOKE ALL PRIVILEGES ON TABLES FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA "public" REVOKE ALL PRIVILEGES ON SEQUENCES FROM anon, authenticated, service_role;

-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('MASCULINO', 'FEMININO', 'OUTRO');

-- CreateEnum
CREATE TYPE "CategoriaBase" AS ENUM ('MASCULINO', 'FEMININO');

-- CreateEnum
CREATE TYPE "Categoria" AS ENUM ('MASCULINO_LEVE', 'MASCULINO_MEDIO', 'MASCULINO_PESADO', 'FEMININO_LEVE', 'FEMININO_MEDIO', 'FEMININO_PESADO', 'JUNIOR');

-- CreateEnum
CREATE TYPE "StatusPiloto" AS ENUM ('ATIVO', 'BLOQUEADO', 'INATIVO');

-- CreateEnum
CREATE TYPE "StatusKart" AS ENUM ('OPERACIONAL', 'MANUTENCAO', 'PARADO', 'RESERVA', 'DESATIVADO');

-- CreateEnum
CREATE TYPE "TipoPenalidade" AS ENUM ('ADVERTENCIA', 'PUNICAO', 'PUNICAO_GRAVE', 'DESCLASSIFICACAO');

-- CreateEnum
CREATE TYPE "MotivoPenalidade" AS ENUM ('BATIDA', 'ULTRAPASSAGEM_FORCADA', 'DESRESPEITO_BANDEIRAS', 'BLOQUEIO_PISTA', 'NAO_CEDER_PASSAGEM', 'DIRECAO_PERIGOSA', 'REINCIDENCIA', 'OUTRO');

-- CreateEnum
CREATE TYPE "NivelAcesso" AS ENUM ('ADMINISTRADOR', 'OPERADOR');

-- CreateEnum
CREATE TYPE "StatusUsuario" AS ENUM ('ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "TipoNotificacao" AS ENUM ('TEMPO_SUPERADO', 'ENTROU_TOP10', 'SAIU_TOP10', 'MELHOROU_TEMPO', 'TEMPO_EMPATADO', 'INATIVIDADE', 'MANUTENCAO', 'FECHAMENTO', 'PROMOCIONAL', 'AVISO_GERAL');

-- CreateEnum
CREATE TYPE "OrigemNotificacao" AS ENUM ('AUTOMATICA', 'MANUAL');

-- CreateTable
CREATE TABLE "pilotos" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "nomeCompleto" TEXT NOT NULL,
    "nomeExibicao" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "dataNascimento" DATE NOT NULL,
    "sexo" "Sexo" NOT NULL,
    "categoriaBase" "CategoriaBase",
    "pesoDeclaradoKg" DECIMAL(5,2) NOT NULL,
    "pesoConferidoKg" DECIMAL(5,2),
    "pesoConferidoEm" TIMESTAMP(3),
    "alturaMetros" DECIMAL(3,2),
    "categoria" "Categoria" NOT NULL,
    "categoriaManual" BOOLEAN NOT NULL DEFAULT false,
    "status" "StatusPiloto" NOT NULL DEFAULT 'ATIVO',
    "responsavelNome" TEXT,
    "responsavelEmail" TEXT,
    "responsavelTelefone" TEXT,
    "aceiteTermosEm" TIMESTAMP(3) NOT NULL,
    "versaoTermos" TEXT NOT NULL,
    "observacoesInternas" TEXT,
    "melhorVoltaMs" INTEGER,
    "melhorVoltaEm" TIMESTAMP(3),
    "pontosTotal" INTEGER NOT NULL DEFAULT 0,
    "totalCorridas" INTEGER NOT NULL DEFAULT 0,
    "ultimaCorridaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pilotos_pkey" PRIMARY KEY ("id")
);

-- A numeracao visivel ao cliente comeca em 100 por decisao de produto.
ALTER SEQUENCE "public"."pilotos_numero_seq" RESTART WITH 100;

-- CreateTable
CREATE TABLE "corridas" (
    "id" TEXT NOT NULL,
    "pilotoId" TEXT NOT NULL,
    "numeroPiloto" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "melhorVoltaMs" INTEGER NOT NULL,
    "kartId" TEXT,
    "categoriaNaCorrida" "Categoria" NOT NULL,
    "valida" BOOLEAN NOT NULL DEFAULT true,
    "pontosGanhos" INTEGER NOT NULL DEFAULT 0,
    "pontosDescontados" INTEGER NOT NULL DEFAULT 0,
    "pontosTotal" INTEGER NOT NULL DEFAULT 0,
    "operadorId" TEXT NOT NULL,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "corridas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penalidades" (
    "id" TEXT NOT NULL,
    "pilotoId" TEXT NOT NULL,
    "corridaId" TEXT NOT NULL,
    "tipo" "TipoPenalidade" NOT NULL,
    "motivo" "MotivoPenalidade" NOT NULL,
    "motivoDetalhe" TEXT,
    "pontosDescontados" INTEGER NOT NULL,
    "observacao" TEXT,
    "operadorId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "penalidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "karts" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "modeloChassi" TEXT,
    "motor" TEXT,
    "status" "StatusKart" NOT NULL DEFAULT 'OPERACIONAL',
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "karts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios_admin" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "nivel" "NivelAcesso" NOT NULL DEFAULT 'OPERADOR',
    "status" "StatusUsuario" NOT NULL DEFAULT 'ATIVO',
    "ultimoLoginEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessoes_piloto" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "pilotoId" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ip" TEXT,

    CONSTRAINT "sessoes_piloto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessoes_admin" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ip" TEXT,

    CONSTRAINT "sessoes_admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens_senha" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "pilotoId" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_senha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "pilotoId" TEXT,
    "tipo" "TipoNotificacao" NOT NULL,
    "origem" "OrigemNotificacao" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "contexto" JSONB,
    "enviadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lidaEm" TIMESTAMP(3),
    "emailEnviadoEm" TIMESTAMP(3),
    "emailErro" TEXT,
    "criadoPorId" TEXT,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes" (
    "chave" TEXT NOT NULL,
    "valor" JSONB NOT NULL,
    "descricao" TEXT,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracoes_pkey" PRIMARY KEY ("chave")
);

-- CreateTable
CREATE TABLE "registros_auditoria" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "antes" JSONB,
    "depois" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_snapshots" (
    "id" TEXT NOT NULL,
    "categoria" "Categoria",
    "periodoInicio" TIMESTAMP(3) NOT NULL,
    "periodoFim" TIMESTAMP(3) NOT NULL,
    "linhas" JSONB NOT NULL,
    "geradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranking_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pilotos_numero_key" ON "pilotos"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "pilotos_telefone_key" ON "pilotos"("telefone");

-- CreateIndex
CREATE UNIQUE INDEX "pilotos_email_key" ON "pilotos"("email");

-- CreateIndex
CREATE INDEX "pilotos_categoria_melhorVoltaMs_idx" ON "pilotos"("categoria", "melhorVoltaMs");

-- CreateIndex
CREATE INDEX "pilotos_status_idx" ON "pilotos"("status");

-- CreateIndex
CREATE INDEX "pilotos_ultimaCorridaEm_idx" ON "pilotos"("ultimaCorridaEm");

-- CreateIndex
CREATE INDEX "corridas_pilotoId_data_idx" ON "corridas"("pilotoId", "data");

-- CreateIndex
CREATE INDEX "corridas_categoriaNaCorrida_melhorVoltaMs_idx" ON "corridas"("categoriaNaCorrida", "melhorVoltaMs");

-- CreateIndex
CREATE INDEX "corridas_data_idx" ON "corridas"("data");

-- CreateIndex
CREATE INDEX "penalidades_pilotoId_data_idx" ON "penalidades"("pilotoId", "data");

-- CreateIndex
CREATE INDEX "penalidades_corridaId_idx" ON "penalidades"("corridaId");

-- CreateIndex
CREATE UNIQUE INDEX "karts_numero_key" ON "karts"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_admin_email_key" ON "usuarios_admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessoes_piloto_tokenHash_key" ON "sessoes_piloto"("tokenHash");

-- CreateIndex
CREATE INDEX "sessoes_piloto_pilotoId_idx" ON "sessoes_piloto"("pilotoId");

-- CreateIndex
CREATE UNIQUE INDEX "sessoes_admin_tokenHash_key" ON "sessoes_admin"("tokenHash");

-- CreateIndex
CREATE INDEX "sessoes_admin_usuarioId_idx" ON "sessoes_admin"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_senha_tokenHash_key" ON "tokens_senha"("tokenHash");

-- CreateIndex
CREATE INDEX "tokens_senha_pilotoId_idx" ON "tokens_senha"("pilotoId");

-- CreateIndex
CREATE INDEX "notificacoes_pilotoId_lidaEm_idx" ON "notificacoes"("pilotoId", "lidaEm");

-- CreateIndex
CREATE INDEX "notificacoes_enviadaEm_idx" ON "notificacoes"("enviadaEm");

-- CreateIndex
CREATE INDEX "registros_auditoria_entidade_entidadeId_idx" ON "registros_auditoria"("entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "registros_auditoria_criadoEm_idx" ON "registros_auditoria"("criadoEm");

-- CreateIndex
CREATE INDEX "ranking_snapshots_categoria_periodoInicio_idx" ON "ranking_snapshots"("categoria", "periodoInicio");

-- AddForeignKey
ALTER TABLE "corridas" ADD CONSTRAINT "corridas_pilotoId_fkey" FOREIGN KEY ("pilotoId") REFERENCES "pilotos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corridas" ADD CONSTRAINT "corridas_kartId_fkey" FOREIGN KEY ("kartId") REFERENCES "karts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corridas" ADD CONSTRAINT "corridas_operadorId_fkey" FOREIGN KEY ("operadorId") REFERENCES "usuarios_admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penalidades" ADD CONSTRAINT "penalidades_pilotoId_fkey" FOREIGN KEY ("pilotoId") REFERENCES "pilotos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penalidades" ADD CONSTRAINT "penalidades_corridaId_fkey" FOREIGN KEY ("corridaId") REFERENCES "corridas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penalidades" ADD CONSTRAINT "penalidades_operadorId_fkey" FOREIGN KEY ("operadorId") REFERENCES "usuarios_admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessoes_piloto" ADD CONSTRAINT "sessoes_piloto_pilotoId_fkey" FOREIGN KEY ("pilotoId") REFERENCES "pilotos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessoes_admin" ADD CONSTRAINT "sessoes_admin_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios_admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens_senha" ADD CONSTRAINT "tokens_senha_pilotoId_fkey" FOREIGN KEY ("pilotoId") REFERENCES "pilotos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_pilotoId_fkey" FOREIGN KEY ("pilotoId") REFERENCES "pilotos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "usuarios_admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_auditoria" ADD CONSTRAINT "registros_auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios_admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Defesa em profundidade para projetos Supabase existentes, cujos defaults
-- podem ter concedido acesso as roles usadas pela Data API.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA "public" FROM anon, authenticated, service_role;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA "public" FROM anon, authenticated, service_role;
