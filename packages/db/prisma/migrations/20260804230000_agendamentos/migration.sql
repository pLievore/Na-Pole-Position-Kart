-- Esta migration e estritamente aditiva. Cancelamentos preservam as linhas e
-- a trilha de eventos; nenhuma tabela ou coluna existente e reescrita.

-- CreateEnum
CREATE TYPE "StatusHorarioAgendamento" AS ENUM ('RASCUNHO', 'ABERTO', 'BLOQUEADO', 'CANCELADO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "StatusAgendamento" AS ENUM ('PENDENTE', 'CONFIRMADO', 'CHECK_IN', 'EXPIRADO', 'CANCELADO', 'CONCLUIDO', 'NAO_COMPARECEU');

-- CreateEnum
CREATE TYPE "StatusParticipanteAgendamento" AS ENUM ('AGENDADO', 'PRESENTE', 'AUSENTE', 'CANCELADO');

-- CreateEnum
CREATE TYPE "OrigemAgendamento" AS ENUM ('SITE', 'BALCAO', 'ADMINISTRACAO');

-- CreateEnum
CREATE TYPE "TipoEventoAgendamento" AS ENUM ('HORARIO_CRIADO', 'HORARIO_ALTERADO', 'HORARIO_CANCELADO', 'AGENDAMENTO_CRIADO', 'AGENDAMENTO_EDITADO', 'AGENDAMENTO_CONFIRMADO', 'AGENDAMENTO_CHECK_IN', 'AGENDAMENTO_EXPIRADO', 'AGENDAMENTO_CANCELADO', 'AGENDAMENTO_CONCLUIDO', 'CHECK_IN_REALIZADO', 'PILOTO_VINCULADO', 'NAO_COMPARECEU_REGISTRADO');

-- CreateEnum
CREATE TYPE "OrigemEventoAgendamento" AS ENUM ('PUBLICO', 'OPERADOR', 'ADMINISTRADOR', 'SISTEMA');

-- CreateTable
CREATE TABLE "horarios_agendamento" (
    "id" TEXT NOT NULL,
    "inicioEm" TIMESTAMP(3) NOT NULL,
    "fimEm" TIMESTAMP(3) NOT NULL,
    "capacidade" INTEGER NOT NULL,
    "status" "StatusHorarioAgendamento" NOT NULL DEFAULT 'RASCUNHO',
    "observacoesInternas" TEXT,
    "criadoPorId" TEXT NOT NULL,
    "canceladoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "horarios_agendamento_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "horarios_agendamento_capacidade_check" CHECK ("capacidade" > 0),
    CONSTRAINT "horarios_agendamento_intervalo_check" CHECK (
      "fimEm" > "inicioEm" AND "fimEm" <= "inicioEm" + INTERVAL '24 hours'
    )
);

-- CreateTable
CREATE TABLE "agendamentos" (
    "id" TEXT NOT NULL,
    "codigoPublico" TEXT NOT NULL,
    "horarioId" TEXT NOT NULL,
    "status" "StatusAgendamento" NOT NULL DEFAULT 'PENDENTE',
    "origem" "OrigemAgendamento" NOT NULL DEFAULT 'SITE',
    "quantidadeParticipantes" INTEGER NOT NULL,
    "responsavelNome" TEXT NOT NULL,
    "responsavelTelefone" TEXT NOT NULL,
    "responsavelEmail" TEXT NOT NULL,
    "temParticipanteMenor" BOOLEAN NOT NULL DEFAULT false,
    "observacoesCliente" TEXT,
    "aceiteTermosEm" TIMESTAMP(3) NOT NULL,
    "versaoTermos" TEXT NOT NULL,
    "observacoesInternas" TEXT,
    "confirmadoEm" TIMESTAMP(3),
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "expiradoEm" TIMESTAMP(3),
    "canceladoEm" TIMESTAMP(3),
    "motivoCancelamento" TEXT,
    "concluidoEm" TIMESTAMP(3),
    "naoCompareceuEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agendamentos_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "agendamentos_quantidade_participantes_check" CHECK ("quantidadeParticipantes" BETWEEN 1 AND 10)
);

-- CreateTable
CREATE TABLE "participantes_agendamento" (
    "id" TEXT NOT NULL,
    "agendamentoId" TEXT NOT NULL,
    "nomeCompleto" TEXT NOT NULL,
    "status" "StatusParticipanteAgendamento" NOT NULL DEFAULT 'AGENDADO',
    "pilotoId" TEXT,
    "checkInEm" TIMESTAMP(3),
    "ausenciaRegistradaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participantes_agendamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos_agendamento" (
    "id" TEXT NOT NULL,
    "horarioId" TEXT NOT NULL,
    "agendamentoId" TEXT,
    "participanteId" TEXT,
    "tipo" "TipoEventoAgendamento" NOT NULL,
    "origem" "OrigemEventoAgendamento" NOT NULL,
    "usuarioAdminId" TEXT,
    "antes" JSONB,
    "depois" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_agendamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "horarios_agendamento_inicioEm_status_idx" ON "horarios_agendamento"("inicioEm", "status");

-- CreateIndex
CREATE INDEX "horarios_agendamento_status_fimEm_idx" ON "horarios_agendamento"("status", "fimEm");

-- CreateIndex
CREATE UNIQUE INDEX "agendamentos_codigoPublico_key" ON "agendamentos"("codigoPublico");

-- CreateIndex
CREATE INDEX "agendamentos_horarioId_status_idx" ON "agendamentos"("horarioId", "status");

-- CreateIndex
CREATE INDEX "agendamentos_status_expiraEm_idx" ON "agendamentos"("status", "expiraEm");

-- CreateIndex
CREATE INDEX "agendamentos_responsavelTelefone_idx" ON "agendamentos"("responsavelTelefone");

-- CreateIndex
CREATE INDEX "agendamentos_responsavelEmail_idx" ON "agendamentos"("responsavelEmail");

-- CreateIndex
CREATE INDEX "agendamentos_criadoEm_idx" ON "agendamentos"("criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "participantes_agendamento_agendamentoId_pilotoId_key" ON "participantes_agendamento"("agendamentoId", "pilotoId");

-- CreateIndex
CREATE INDEX "participantes_agendamento_pilotoId_idx" ON "participantes_agendamento"("pilotoId");

-- CreateIndex
CREATE INDEX "participantes_agendamento_agendamentoId_status_idx" ON "participantes_agendamento"("agendamentoId", "status");

-- CreateIndex
CREATE INDEX "eventos_agendamento_horarioId_criadoEm_idx" ON "eventos_agendamento"("horarioId", "criadoEm");

-- CreateIndex
CREATE INDEX "eventos_agendamento_agendamentoId_criadoEm_idx" ON "eventos_agendamento"("agendamentoId", "criadoEm");

-- CreateIndex
CREATE INDEX "eventos_agendamento_participanteId_criadoEm_idx" ON "eventos_agendamento"("participanteId", "criadoEm");

-- AddForeignKey
ALTER TABLE "horarios_agendamento" ADD CONSTRAINT "horarios_agendamento_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "usuarios_admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_horarioId_fkey" FOREIGN KEY ("horarioId") REFERENCES "horarios_agendamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participantes_agendamento" ADD CONSTRAINT "participantes_agendamento_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "agendamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participantes_agendamento" ADD CONSTRAINT "participantes_agendamento_pilotoId_fkey" FOREIGN KEY ("pilotoId") REFERENCES "pilotos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_agendamento" ADD CONSTRAINT "eventos_agendamento_horarioId_fkey" FOREIGN KEY ("horarioId") REFERENCES "horarios_agendamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_agendamento" ADD CONSTRAINT "eventos_agendamento_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "agendamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_agendamento" ADD CONSTRAINT "eventos_agendamento_participanteId_fkey" FOREIGN KEY ("participanteId") REFERENCES "participantes_agendamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_agendamento" ADD CONSTRAINT "eventos_agendamento_usuarioAdminId_fkey" FOREIGN KEY ("usuarioAdminId") REFERENCES "usuarios_admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Mantem as novas tabelas fora da Data API em projetos Supabase existentes.
REVOKE ALL PRIVILEGES ON TABLE "horarios_agendamento", "agendamentos", "participantes_agendamento", "eventos_agendamento" FROM anon, authenticated, service_role;
