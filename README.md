# Na Pole Position Racing Club

> Seu tempo. Seu ranking. Sua próxima disputa.

Sistema oficial de ranking da **Na Pole Position Kart Indoor**. Página web
responsiva onde os pilotos se cadastram, acompanham seus tempos e consultam o
ranking — e painel interno onde a operação lança corridas, penalidades e
rankings.

## Documentação

| Documento                                                  | Conteúdo                                                 |
| ---------------------------------------------------------- | -------------------------------------------------------- |
| [docs/escopo.md](docs/escopo.md)                           | Escopo completo, convertido do documento original        |
| [docs/requisitos.md](docs/requisitos.md)                   | Checklist por prioridade (1, 2, 3)                       |
| [docs/arquitetura.md](docs/arquitetura.md)                 | Como o código está organizado e por quê                  |
| [docs/decisoes.md](docs/decisoes.md)                       | Decisões técnicas e o que faria cada uma mudar           |
| [docs/perguntas-em-aberto.md](docs/perguntas-em-aberto.md) | Ambiguidades do escopo e as respostas provisórias em uso |
| [docs/lgpd.md](docs/lgpd.md)                               | Tratamento de dados pessoais e pendências                |

## Stack

Next.js (App Router) · TypeScript · Postgres com Prisma · Tailwind CSS ·
pnpm workspaces + Turborepo · deploy na Vercel

## Estrutura

```
apps/web        aplicação Next.js (público + piloto + admin)
packages/core   regras de negócio puras e testadas
packages/db     schema Prisma, migrations e seed
packages/auth   hash de senha e tokens de sessão
docs            escopo e documentação do projeto
```

## Como rodar

Requer **Node 20+** e **pnpm 9+**.

```bash
pnpm install

cp .env.example .env        # preencha DATABASE_URL e AUTH_SECRET

pnpm db:generate            # gera o cliente Prisma
pnpm db:migrate             # cria as tabelas
SEED_ADMIN_SENHA='troque-isto' pnpm db:seed   # admin + karts

pnpm dev                    # http://localhost:3000
```

No PowerShell, a linha do seed fica:

```powershell
$env:SEED_ADMIN_SENHA = 'troque-isto'; pnpm db:seed
```

### Banco de dados

Qualquer Postgres serve. Para começar sem instalar nada, crie um banco gratuito
no [Neon](https://neon.tech) ou no [Supabase](https://supabase.com) e cole a
string de conexão no `.env`.

## Comandos

| Comando           | O que faz                                     |
| ----------------- | --------------------------------------------- |
| `pnpm dev`        | Sobe a aplicação em modo desenvolvimento      |
| `pnpm build`      | Build de produção                             |
| `pnpm test`       | Roda os testes das regras de negócio          |
| `pnpm test:watch` | Testes em modo watch                          |
| `pnpm typecheck`  | Verifica os tipos em todo o workspace         |
| `pnpm db:studio`  | Abre o Prisma Studio para inspecionar o banco |
| `pnpm db:migrate` | Cria/aplica migrations em desenvolvimento     |
| `pnpm db:seed`    | Popula admin e karts                          |

## Estado do projeto

**Funcionando:** página inicial, ranking público (geral, mensal e por
categoria), regras, cadastro de piloto, login, perfil com "minha posição",
histórico de corridas, login administrativo, dashboard, **lançamento de corrida**
e lista de lançamentos, além da gestão administrativa de pilotos (busca, perfil
interno, edição, pesagem, categoria, acesso e reset de senha).

O lançamento de corrida executa os nove efeitos da seção 12.2 do escopo em uma
transação única e gera as notificações automáticas a partir da comparação do
ranking antes/depois.

**Próximo passo:** cadastro manual de piloto e invalidação auditada de corrida.
Checklist completo em [docs/requisitos.md](docs/requisitos.md).

> **Ainda não foi executado contra um banco real.** O schema valida e o build
> compila, mas o fluxo ponta a ponta depende do primeiro `pnpm db:migrate` num
> Postgres de verdade.
