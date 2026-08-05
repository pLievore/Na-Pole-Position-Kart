-- CreateEnum
CREATE TYPE "FinalidadeTokenSenha" AS ENUM ('PRIMEIRO_ACESSO', 'RECUPERACAO');

-- AlterTable
ALTER TABLE "pilotos" ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "senhaHash" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tokens_senha" ADD COLUMN     "finalidade" "FinalidadeTokenSenha" NOT NULL DEFAULT 'RECUPERACAO';
