/**
 * Seed inicial da base.
 *
 * Cria o que a operacao precisa para o primeiro dia: o usuario administrador,
 * a frota de karts e o ajuste da sequence do numero de piloto.
 * NAO cria pilotos ficticios — a base de producao comeca vazia de pessoas.
 *
 * Uso: pnpm db:seed
 */
import { gerarHashSenha } from "@napole/auth";
import { NUMERO_PILOTO_INICIAL } from "@napole/core";
import { prisma } from "../src/index";

const EMAIL_ADMIN = process.env.SEED_ADMIN_EMAIL ?? "admin@napoleposition.com.br";
const SENHA_ADMIN = process.env.SEED_ADMIN_SENHA;
const QUANTIDADE_KARTS = Number(process.env.SEED_KARTS ?? 10);

async function main() {
  if (!SENHA_ADMIN) {
    throw new Error(
      "Defina SEED_ADMIN_SENHA no ambiente antes de rodar o seed. " +
        "Nao existe senha padrao: um admin com senha conhecida e uma porta aberta.",
    );
  }

  // O numero do piloto e publico (#231) e comeca em 100 para nao denunciar
  // quantos cadastros a pista tem. Prisma nao configura o inicio da sequence,
  // entao ajustamos aqui — so tem efeito enquanto nao houver piloto cadastrado.
  const pilotosExistentes = await prisma.piloto.count();
  if (pilotosExistentes === 0) {
    await prisma.$executeRawUnsafe(
      `ALTER SEQUENCE pilotos_numero_seq RESTART WITH ${NUMERO_PILOTO_INICIAL};`,
    );
    console.log(`Sequence do numero de piloto iniciada em ${NUMERO_PILOTO_INICIAL}.`);
  }

  const admin = await prisma.usuarioAdmin.upsert({
    where: { email: EMAIL_ADMIN },
    update: {},
    create: {
      nome: "Administrador",
      email: EMAIL_ADMIN,
      senhaHash: await gerarHashSenha(SENHA_ADMIN),
      nivel: "ADMINISTRADOR",
      status: "ATIVO",
    },
  });
  console.log(`Administrador pronto: ${admin.email}`);

  for (let numero = 1; numero <= QUANTIDADE_KARTS; numero += 1) {
    await prisma.kart.upsert({
      where: { numero },
      update: {},
      create: { numero, status: "OPERACIONAL" },
    });
  }
  console.log(`${QUANTIDADE_KARTS} karts cadastrados.`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
