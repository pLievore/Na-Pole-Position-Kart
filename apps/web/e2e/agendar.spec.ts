import { expect, test, type Locator, type Page } from "@playwright/test";
import { esperarConteudoPublico } from "./apoio/acessibilidade";

async function abrirAgenda(page: Page): Promise<{
  grupo: Locator;
  horarios: Locator;
  vazio: Locator;
}> {
  const data = process.env.E2E_DATA_AGENDAMENTO ?? dataIsoEm(1);
  const respostaAgenda = page.waitForResponse(
    (resposta) => resposta.request().method() === "POST" && resposta.url().includes("/agendar"),
    { timeout: 60_000 },
  );
  await page.goto(`/agendar?data=${data}`);
  await esperarConteudoPublico(page);

  const grupo = page.getByRole("group", { name: "Horários disponíveis", exact: true });
  await expect(grupo).toBeVisible();
  await respostaAgenda;
  await expect(grupo.getByText(/consultando horários/i)).toHaveCount(0, { timeout: 30_000 });

  return {
    grupo,
    horarios: grupo.getByRole("radio"),
    vazio: grupo.getByText(/nenhum horário disponível/i),
  };
}

function dataIsoEm(dias: number): string {
  const data = new Date();
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

async function selecionarPrimeiroHorario(page: Page): Promise<boolean> {
  const { horarios, vazio } = await abrirAgenda(page);
  const totalHorarios = await horarios.count();

  if (totalHorarios === 0) {
    await expect(vazio).toBeVisible();
    return false;
  }

  await expect(vazio).toHaveCount(0);
  await expect(horarios.first()).toBeEnabled();
  const id = await horarios.first().getAttribute("id");
  await page.locator(`label[for="${id}"]`).click();
  await expect(horarios.first()).toBeChecked();
  return true;
}

test.describe("Agendamento público", () => {
  test.describe.configure({ timeout: 90_000 });
  test("oferece horários selecionáveis ou um estado vazio honesto", async ({ page }) => {
    const { horarios, vazio } = await abrirAgenda(page);
    const totalHorarios = await horarios.count();

    if (totalHorarios === 0) {
      await expect(vazio).toBeVisible();
      await expect(vazio).toContainText(/nenhum horário disponível/i);
      return;
    }

    await expect(vazio).toHaveCount(0);
    await expect(horarios.first()).toBeVisible();
    await expect(horarios.first()).toBeEnabled();
  });

  test("exige contato, participantes e aceite dos termos", async ({ page }) => {
    const temHorario = await selecionarPrimeiroHorario(page);
    test.skip(!temHorario, "Este cenário exige ao menos um horário publicado no banco de teste.");

    const nome = page.getByLabel("Nome do responsável", { exact: true });
    const whatsapp = page.getByLabel("WhatsApp", { exact: true });
    const email = page.getByLabel("E-mail", { exact: true });
    const quantidade = page.getByLabel("Quantidade de participantes", { exact: true });
    const aceite = page.getByRole("checkbox", { name: /termos/i });

    await expect(nome).toHaveAttribute("required", "");
    await expect(whatsapp).toHaveAttribute("required", "");
    await expect(email).toHaveAttribute("required", "");
    await expect(email).toHaveAttribute("type", "email");
    await expect(quantidade).toHaveAttribute("required", "");
    await expect(aceite).toHaveAttribute("required", "");

    await quantidade.fill("2");
    await quantidade.blur();

    const participante1 = page.getByLabel("Nome do participante 1", { exact: true });
    const participante2 = page.getByLabel("Nome do participante 2", { exact: true });
    await expect(participante1).toHaveAttribute("required", "");
    await expect(participante2).toHaveAttribute("required", "");

    await email.fill("email-inválido");
    const emailInvalido = await email.evaluate(
      (elemento) => !(elemento as HTMLInputElement).validity.valid,
    );
    expect(emailInvalido, "O campo de e-mail deve rejeitar formato inválido.").toBe(true);

    await page.getByRole("button", { name: "Solicitar agendamento", exact: true }).click();
    await expect(participante1).toBeFocused();
    await expect(page.getByText(/agendamento confirmado|reserva confirmada/i)).toHaveCount(0);
  });

  test("uma solicitação aceita continua pendente até confirmação manual", async ({ page }) => {
    test.skip(
      process.env.E2E_AGENDAMENTO_MUTAVEL !== "1",
      "Habilite E2E_AGENDAMENTO_MUTAVEL=1 apenas em banco descartável com horários publicados.",
    );

    const temHorario = await selecionarPrimeiroHorario(page);
    test.skip(!temHorario, "Este cenário exige ao menos um horário publicado no banco de teste.");

    const sufixo = Date.now();
    const telefone = `119${String(sufixo % 100_000_000).padStart(8, "0")}`;
    await page.getByLabel("Nome do responsável", { exact: true }).fill("QA Agendamento");
    await page.getByLabel("WhatsApp", { exact: true }).fill(telefone);
    await page
      .getByLabel("E-mail", { exact: true })
      .fill(`qa-agendamento-${sufixo}@example.invalid`);
    await page.getByLabel("Quantidade de participantes", { exact: true }).fill("1");
    await page.getByLabel("Nome do participante 1", { exact: true }).fill("Participante QA");
    await page.locator('label[for="menorDeIdade-nao"]').click();
    await expect(page.getByRole("radio", { name: "Não", exact: true })).toBeChecked();
    await page.getByRole("checkbox", { name: /termos/i }).check();
    await page.getByRole("button", { name: "Solicitar agendamento", exact: true }).click();

    await expect(
      page.getByRole("status").filter({
        hasText: /solicitação recebida|aguardando confirmação|pendente/i,
      }),
    ).toBeVisible();
    await expect(page.getByText(/agendamento confirmado|reserva confirmada/i)).toHaveCount(0);

    await page.getByRole("link", { name: "Acompanhar solicitação", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1, name: /consulte o protocolo/i })).toBeVisible();
    await expect(page.getByText("QA Agendamento", { exact: true })).toHaveCount(0);
    await expect(page.getByText(`qa-agendamento-${sufixo}@example.invalid`, { exact: true })).toHaveCount(0);
    await expect(page.getByText(telefone, { exact: true })).toHaveCount(0);
  });
});

test("formulário de agendamento cabe em 320 px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/agendar");
  await expect(page.getByRole("button", { name: "Solicitar agendamento", exact: true })).toBeVisible();
  const excesso = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(excesso).toBeLessThanOrEqual(1);
});
