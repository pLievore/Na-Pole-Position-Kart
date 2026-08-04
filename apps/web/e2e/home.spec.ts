import { expect, test } from "@playwright/test";
import { esperarConteudoPublico } from "./apoio/acessibilidade";

test.describe("Vitrine pública", () => {
  test("tem um único título principal e prioriza o agendamento", async ({ page }) => {
    await page.goto("/");
    await esperarConteudoPublico(page);

    const tituloPrincipal = page.getByRole("heading", { level: 1 });
    await expect(tituloPrincipal).toHaveCount(1);
    await expect(tituloPrincipal).toBeVisible();

    const chamadasParaAgendar = page.getByRole("link", {
      name: "Agendar corrida",
      exact: true,
    });
    expect(await chamadasParaAgendar.count()).toBeGreaterThanOrEqual(1);
    await expect(chamadasParaAgendar.first()).toBeVisible();
    await expect(chamadasParaAgendar.first()).toHaveAttribute("href", /^\/agendar(?:[/?#]|$)/);

    await expect(page.getByRole("link", { name: /cadastrar piloto/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /cadastrar piloto/i })).toHaveCount(0);
  });

  test("permite pular a navegação e abrir o agendamento pelo teclado", async ({ page }) => {
    await page.goto("/");
    await esperarConteudoPublico(page);

    const pular = page.getByRole("link", { name: "Pular para o conteúdo", exact: true });
    await page.keyboard.press("Tab");
    await expect(pular).toBeFocused();
    await expect(pular).toBeVisible();

    const focoVisivel = await pular.evaluate((elemento) => {
      const estilo = getComputedStyle(elemento);
      const temContorno = estilo.outlineStyle !== "none" && parseFloat(estilo.outlineWidth) > 0;
      const temSombra = estilo.boxShadow !== "none";
      return temContorno || temSombra;
    });
    expect(focoVisivel, "O skip link precisa de indicador visual de foco.").toBe(true);

    await pular.press("Enter");
    await expect(page.locator("#conteudo-principal")).toBeFocused();

    const agendar = page.getByRole("link", { name: "Agendar corrida", exact: true }).first();
    await agendar.focus();
    await expect(agendar).toBeFocused();
    await agendar.press("Enter");
    await expect(page).toHaveURL(/\/agendar(?:[/?#]|$)/);
  });
});

test.describe("Vitrine em celular", () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });

  test("não causa rolagem horizontal da página", async ({ page }) => {
    await page.goto("/");
    await esperarConteudoPublico(page);

    const excessoHorizontal = await page.evaluate(() => {
      const larguraConteudo = Math.max(
        document.documentElement.scrollWidth,
        document.body.scrollWidth,
      );
      return larguraConteudo - document.documentElement.clientWidth;
    });

    expect(excessoHorizontal, "A home extrapola a viewport de 375 px.").toBeLessThanOrEqual(1);
  });

  test("fecha o menu móvel depois de escolher um destino", async ({ page }) => {
    await page.goto("/");
    const menu = page.locator("details.menu-publico");
    await menu.getByText("Abrir menu", { exact: true }).click();
    await expect(menu).toHaveAttribute("open", "");
    await menu.getByRole("link", { name: "Experiência", exact: true }).click();
    await expect(menu).not.toHaveAttribute("open", "");
  });
});

test("home mantém reflow na largura mínima de 320 px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");
  const excesso = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(excesso).toBeLessThanOrEqual(1);
});
