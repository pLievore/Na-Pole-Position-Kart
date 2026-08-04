import { expect, test } from "@playwright/test";

test("painel administrativo redireciona visitante para o login", async ({ page }) => {
  await page.goto("/admin");

  await expect(page).toHaveURL(/\/admin\/entrar(?:[/?#]|$)/);
  await expect(
    page.getByRole("heading", { level: 1, name: /painel administrativo/i }),
  ).toBeVisible();
});
