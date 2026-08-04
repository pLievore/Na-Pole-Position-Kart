import { expect, test } from "@playwright/test";

function dataIsoEm(dias: number): string {
  const data = new Date();
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

async function entrarComoAdministrador(page: import("@playwright/test").Page) {
  const senha = process.env.SEED_ADMIN_SENHA;
  test.skip(!senha, "SEED_ADMIN_SENHA é necessária para o cenário administrativo mutável.");

  await page.goto("/admin/entrar");
  await page
    .getByLabel("E-mail", { exact: true })
    .fill(process.env.SEED_ADMIN_EMAIL ?? "admin@napoleposition.com.br");
  await page.getByLabel("Senha", { exact: true }).fill(senha!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/^https?:\/\/[^/]+\/admin\/?$/, { timeout: 60_000 });
}

test("administrador publica a grade padrão sem expor credenciais", async ({ page }) => {
  test.setTimeout(120_000);
  test.skip(
    process.env.E2E_ADMIN_MUTAVEL !== "1",
    "Habilite E2E_ADMIN_MUTAVEL=1 somente no banco de homologação.",
  );

  await entrarComoAdministrador(page);
  const cookies = await page.context().cookies();
  expect(cookies.some((cookie) => cookie.name === "napole_admin")).toBe(true);

  await page.goto("/admin/agendamentos/horarios/novo");
  await page.getByLabel("Primeiro dia", { exact: true }).fill(dataIsoEm(1));
  await page.getByLabel("Último dia", { exact: true }).fill(dataIsoEm(21));
  await page.getByRole("checkbox", { name: /publicar imediatamente/i }).check();
  await page.getByRole("button", { name: "Gerar grade padrão", exact: true }).click();

  await expect(page.getByText(/horário\(s\) criado\(s\)|já existia\(m\)/i)).toBeVisible();

  await page.goto("/admin/agendamentos/configuracao");
  await expect(page.getByRole("heading", { level: 1, name: "Padrões da agenda" })).toBeVisible();
  await expect(page.getByLabel("Duração da bateria (min)")).toHaveValue("15");
  await page.getByRole("button", { name: "Salvar padrões da agenda", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Padrões da agenda atualizados" })).toBeVisible({
    timeout: 30_000,
  });
});

test("administrador confirma uma solicitação pública sintética", async ({ page }) => {
  test.setTimeout(120_000);
  test.skip(
    process.env.E2E_ADMIN_MUTAVEL !== "1",
    "Habilite E2E_ADMIN_MUTAVEL=1 somente no banco de homologação.",
  );
  await entrarComoAdministrador(page);

  await page.goto(`/admin/agendamentos?data=${dataIsoEm(1)}&filtro=pendentes`);
  const reserva = page.getByRole("link").filter({ hasText: "QA Agendamento" }).first();
  test.skip((await reserva.count()) === 0, "Crie antes a solicitação sintética do teste público.");
  await reserva.click();
  await expect(page).toHaveURL(/\/admin\/agendamentos\/[^/?#]+$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1, name: "QA Agendamento" })).toBeVisible({
    timeout: 30_000,
  });
  await page.getByRole("button", { name: "Confirmar reserva", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Reserva confirmada" })).toBeVisible({
    timeout: 30_000,
  });
});
