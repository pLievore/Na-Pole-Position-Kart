-- CreateTable
CREATE TABLE "tentativas_limitadas" (
    "id" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tentativas_limitadas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tentativas_limitadas_acao_chave_criadoEm_idx" ON "tentativas_limitadas"("acao", "chave", "criadoEm");

-- CreateIndex
CREATE INDEX "tentativas_limitadas_criadoEm_idx" ON "tentativas_limitadas"("criadoEm");
