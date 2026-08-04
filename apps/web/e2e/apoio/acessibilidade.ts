import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export async function esperarConteudoPublico(page: Page): Promise<void> {
  await expect(page.locator("#conteudo-principal")).toBeVisible();
}

export async function esperarConteudoPrincipal(page: Page): Promise<void> {
  await expect(page.getByRole("main")).toBeVisible();
}

export async function verificarAcessibilidadeCritica(page: Page): Promise<void> {
  const resultado = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  const violacoes = resultado.violations
    .filter((violacao) => violacao.impact === "critical" || violacao.impact === "serious")
    .map((violacao) => ({
      id: violacao.id,
      impacto: violacao.impact,
      ajuda: violacao.help,
      alvos: violacao.nodes.flatMap((no) => no.target),
    }));

  expect(violacoes, "A página possui violações axe críticas ou sérias.").toEqual([]);
}
