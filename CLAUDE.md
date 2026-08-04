# Na Pole Position Racing Club — guia do repositório

Sistema de ranking de kart indoor. Monorepo pnpm + Turborepo.
Comece por [docs/escopo.md](docs/escopo.md) e [docs/arquitetura.md](docs/arquitetura.md).

O escopo é o documento original do cliente. **Ele manda.** Quando o código
divergir do escopo, o código está errado — a não ser que a divergência esteja
registrada em [docs/decisoes.md](docs/decisoes.md) ou
[docs/perguntas-em-aberto.md](docs/perguntas-em-aberto.md).

## Onde cada coisa mora

- `packages/core` — regras de negócio **puras**. Sem banco, sem framework, sem
  `node:` nada. Toda regra nova entra aqui com teste.
- `packages/db` — Prisma. Schema, migrations, seed, cliente.
- `packages/auth` — senha e token. Server-side.
- `apps/web/src/server` — orquestra core + banco. Único lugar que importa `@napole/db`.
- `apps/web/src/app` e `components` — só exibem.

## Regras que não se negociam

1. **Tempo de volta é `Int` em milissegundos.** Nunca float. Converta só na
   borda com `parseTempo` / `formatarTempo`.
2. **Dado pessoal não vai para a web pública.** Peso, telefone, e-mail e data de
   nascimento nunca aparecem em tela pública (escopo 1.4 e 2.4). Ao montar lista
   pública, use `paraRankingPublico()` — não monte o objeto na mão.
3. **Lançamento de corrida é uma transação só.** São nove efeitos (escopo 12.2);
   gravar metade corrompe o ranking.
4. **Nada é apagado.** Cadastro errado vira `INATIVO`, tempo errado vira
   `valida = false`.
5. **Alteração administrativa grava `RegistroAuditoria`.**
6. **Componente de UI não importa `@napole/db`.**

## Convenções de código

- Português nos nomes de domínio (`piloto`, `corrida`, `melhorVoltaMs`,
  `calcularRanking`). Termos técnicos consagrados ficam em inglês (`hash`,
  `token`, `layout`).
- Sem acento em identificador de código; acentuação normal em texto de UI e docs.
- Server Components por padrão. `"use client"` só onde há estado ou evento —
  o site é usado no celular, na rede da pista.
- Comentário explica **por quê**, não o quê.

## Antes de dar por pronto

```bash
pnpm typecheck && pnpm test
```

Mudou regra de negócio? Atualize o teste correspondente em `packages/core`.
Mudou o schema? Gere migration (`pnpm db:migrate`), não edite tabela na mão.
Fechou um item do escopo? Marque em [docs/requisitos.md](docs/requisitos.md).
