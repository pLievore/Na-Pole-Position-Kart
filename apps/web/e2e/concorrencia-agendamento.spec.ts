import { expect, test, type Page } from "@playwright/test";

function dataIsoEm(dias: number): string {
  const data = new Date();
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

async function entrarComoAdministrador(page: Page) {
  const senha = process.env.SEED_ADMIN_SENHA;
  test.skip(!senha, "SEED_ADMIN_SENHA é necessária para o teste de concorrência.");
  await page.goto("/admin/entrar");
  await page
    .getByLabel("E-mail", { exact: true })
    .fill(process.env.SEED_ADMIN_EMAIL ?? "admin@napoleposition.com.br");
  await page.getByLabel("Senha", { exact: true }).fill(senha!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/^https?:\/\/[^/]+\/admin\/?$/, { timeout: 60_000 });
}

async function prepararSolicitacao(page: Page, data: string, identificador: string) {
  const respostaAgenda = page.waitForResponse(
    (resposta) => resposta.request().method() === "POST" && resposta.url().includes("/agendar"),
    { timeout: 60_000 },
  );
  await page.goto(`/agendar?data=${data}`);
  await respostaAgenda;

  const radio = page.getByRole("group", { name: "Horários disponíveis" }).getByRole("radio").first();
  await expect(radio).toBeEnabled();
  const id = await radio.getAttribute("id");
  await page.locator(`label[for="${id}"]`).click();

  const sufixo = Date.now().toString().slice(-8);
  await page.getByLabel("Nome do responsável", { exact: true }).fill(`Concorrência ${identificador}`);
  await page
    .getByLabel("WhatsApp", { exact: true })
    .fill(`${identificador === "A" ? "118" : "117"}${sufixo}`);
  await page
    .getByLabel("E-mail", { exact: true })
    .fill(`concorrencia-${identificador}-${sufixo}@example.invalid`);
  await page.getByLabel("Nome do participante 1", { exact: true }).fill(`Piloto ${identificador}`);
  await page.locator('label[for="menorDeIdade-nao"]').click();
  await page.getByRole("checkbox", { name: /termos/i }).check();
}

async function cancelarHorarioSintetico(admin: Page, data: string, motivo: string) {
  await admin.goto(`/admin/agendamentos?data=${data}`);
  const gerenciar = admin.getByRole("link", { name: "Gerenciar horário", exact: true }).first();
  if ((await gerenciar.count()) === 0) return;
  await gerenciar.click();
  await expect(admin).toHaveURL(/\/admin\/agendamentos\/horarios\/[^/?#]+$/, {
    timeout: 30_000,
  });
  await admin.getByText("Cancelar horário", { exact: true }).click();
  await admin.getByLabel("Motivo", { exact: true }).fill(motivo);
  await admin
    .getByRole("button", { name: "Cancelar horário e reservas ativas", exact: true })
    .click();
  await expect(admin.getByRole("status").filter({ hasText: /foram cancelados/i })).toBeVisible({
    timeout: 30_000,
  });
}

test("duas solicitações simultâneas não ultrapassam a última vaga", async ({ browser }) => {
  test.setTimeout(180_000);
  test.skip(
    process.env.E2E_CONCORRENCIA_MUTAVEL !== "1",
    "Habilite somente no banco de homologação; o teste cria e cancela um horário sintético.",
  );

  const instante = Date.now();
  const data = dataIsoEm(50 + (instante % 20));
  const minuto = String(instante % 40).padStart(2, "0");
  const inicio = `${data}T11:${minuto}`;
  const fimData = new Date(`${data}T14:${minuto}:00.000Z`);
  fimData.setUTCMinutes(fimData.getUTCMinutes() + 15);
  const fim = `${data}T${String(fimData.getUTCHours() - 3).padStart(2, "0")}:${String(fimData.getUTCMinutes()).padStart(2, "0")}`;

  const contextoAdmin = await browser.newContext();
  const admin = await contextoAdmin.newPage();
  await entrarComoAdministrador(admin);
  if (process.env.E2E_LIMPAR_HORARIO_DATA) {
    await cancelarHorarioSintetico(
      admin,
      process.env.E2E_LIMPAR_HORARIO_DATA,
      "Limpeza de horário sintético de uma execução interrompida",
    );
  }
  await admin.goto("/admin/agendamentos/horarios/novo");
  await admin.getByLabel("Início", { exact: true }).fill(inicio);
  await admin.getByLabel("Fim", { exact: true }).fill(fim);
  await admin.getByLabel("Capacidade de pilotos", { exact: true }).fill("1");
  await admin
    .getByLabel("Observações internas", { exact: true })
    .fill(`E2E concorrência ${instante}`);
  await admin.getByRole("checkbox", { name: /publicar e aceitar reservas/i }).check();
  await admin.getByRole("button", { name: "Criar horário", exact: true }).click();
  await expect(admin.getByText("Horário criado com sucesso.", { exact: true })).toBeVisible({
    timeout: 30_000,
  });

  const contextoA = await browser.newContext();
  const contextoB = await browser.newContext();
  const paginaA = await contextoA.newPage();
  const paginaB = await contextoB.newPage();
  try {
    await Promise.all([
      prepararSolicitacao(paginaA, data, "A"),
      prepararSolicitacao(paginaB, data, "B"),
    ]);
    await Promise.all([
      paginaA.getByRole("button", { name: "Solicitar agendamento", exact: true }).click(),
      paginaB.getByRole("button", { name: "Solicitar agendamento", exact: true }).click(),
    ]);
    await Promise.all([
      expect(
        paginaA.locator('[role="status"], [role="alert"]').filter({
          hasText: /solicitação recebida|não está mais disponível/i,
        }),
      ).toBeVisible({ timeout: 60_000 }),
      expect(
        paginaB.locator('[role="status"], [role="alert"]').filter({
          hasText: /solicitação recebida|não está mais disponível/i,
        }),
      ).toBeVisible({ timeout: 60_000 }),
    ]);

    const sucessos =
      (await paginaA.getByText("Solicitação recebida.", { exact: true }).count()) +
      (await paginaB.getByText("Solicitação recebida.", { exact: true }).count());
    const recusas =
      (await paginaA.getByText(/não está mais disponível/i).count()) +
      (await paginaB.getByText(/não está mais disponível/i).count());
    expect(sucessos).toBe(1);
    expect(recusas).toBe(1);

    await admin.goto(`/admin/agendamentos?data=${data}`);
    await expect(admin.getByText("1 de 1 vagas ocupadas", { exact: true })).toBeVisible({
      timeout: 30_000,
    });
  } finally {
    await cancelarHorarioSintetico(admin, data, "Encerramento do teste de concorrência");
    await Promise.all([contextoA.close(), contextoB.close(), contextoAdmin.close()]);
  }
});
