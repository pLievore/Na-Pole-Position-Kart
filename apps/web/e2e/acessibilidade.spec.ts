import { test } from "@playwright/test";
import {
  esperarConteudoPrincipal,
  esperarConteudoPublico,
  verificarAcessibilidadeCritica,
} from "./apoio/acessibilidade";

const paginasPublicas = [
  { nome: "home", caminho: "/" },
  { nome: "agendamento", caminho: "/agendar" },
  { nome: "ranking", caminho: "/ranking" },
  { nome: "regras", caminho: "/regras" },
  { nome: "login", caminho: "/entrar" },
  { nome: "termos", caminho: "/termos" },
] as const;

for (const pagina of paginasPublicas) {
  test(`${pagina.nome} não tem violações axe críticas ou sérias`, async ({ page }) => {
    await page.goto(pagina.caminho);
    await esperarConteudoPublico(page);
    await verificarAcessibilidadeCritica(page);
  });
}

test("login administrativo não tem violações axe críticas ou sérias", async ({ page }) => {
  await page.goto("/admin/entrar");
  await esperarConteudoPrincipal(page);
  await verificarAcessibilidadeCritica(page);
});
