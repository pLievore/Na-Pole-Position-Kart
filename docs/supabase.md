# Supabase

O Supabase fornece apenas o Postgres gerenciado deste projeto. A aplicação não
usa Supabase Auth, Data API, Storage, Realtime nem `supabase-js`; portanto não
precisa de publishable key, secret key, `anon` ou `service_role`.

O projeto de homologação atual está em Canadá Central (`ca-central-1`). Essa
escolha não libera produção: a transferência internacional permanece pendente
de avaliação em [lgpd.md](lgpd.md).

## Preparar o projeto

1. Em **Settings > API Keys**, exclua qualquer secret key que tenha sido
   exposta. Nenhuma substituta precisa ser criada para esta aplicação.
2. No painel de integrações da Data API, desligue **Enable Data API**.
3. Em **Database > Settings**, habilite a exigência de SSL.
4. Antes de produção, crie no SQL Editor um usuário exclusivo e restrito para
   o runtime. Troque o placeholder por uma senha forte diferente da senha do
   usuário `postgres`, guardada somente no gerenciador de senhas e no `.env`:

```sql
create user app_runtime
  with password 'TROQUE_POR_UMA_SENHA_FORTE'
  nosuperuser nocreatedb nocreaterole noinherit nobypassrls;

grant connect on database postgres to app_runtime;
grant usage on schema public to app_runtime;
grant select, insert, update on all tables in schema public to app_runtime;
revoke all on table public._prisma_migrations from app_runtime;
grant delete on table public.sessoes_piloto, public.sessoes_admin to app_runtime;
grant usage, select on all sequences in schema public to app_runtime;

alter default privileges for role postgres in schema public
  grant select, insert, update on tables to app_runtime;
alter default privileges for role postgres in schema public
  grant usage, select on sequences to app_runtime;
```

O runtime não recebe `CREATEDB`, `BYPASSRLS`, criação de schema nem `DELETE` nas
tabelas de negócio. A exceção de `DELETE` fica limitada às duas tabelas de
sessão, pois logout, bloqueio e troca de e-mail revogam sessões fisicamente.
Se uma migration futura criar outra tabela que precise de `DELETE`, conceda o
privilégio nela explicitamente.

Migrations continuam usando o usuário proprietário `postgres` em `DIRECT_URL`.
Objetos já criados pertencem a ele; conceder privilégios a outro usuário não
transfere ownership e não autoriza esse usuário a executar futuros `ALTER`.

## Conexões

Copie as strings pelo botão **Connect** do projeto:

- `DATABASE_URL`: usuário `app_runtime` no Transaction pooler/Supavisor, porta
  `6543`, para o runtime serverless da Vercel;
- `DIRECT_URL`: usuário proprietário `postgres` em conexão direta, porta
  `5432`, somente para o Prisma CLI e migrations;
- se a máquina que executa migrations não alcançar IPv6, use o Session pooler,
  porta `5432`, como `DIRECT_URL`.

No pooler, o usuário do runtime tem o formato `app_runtime.PROJECT_REF`. Senhas
com caracteres reservados precisam estar codificadas para URL. Copie
`.env.example` para `.env` e nunca envie as URLs por chat ou Git. O projeto de
homologação foi inicializado com `postgres`; trocar `DATABASE_URL` pelo usuário
restrito acima é obrigatório antes de produção.

O runtime valida a cadeia e o hostname TLS com a CA pública oficial do Supabase,
fixada em `packages/db/src/supabase-ca.ts`. A CA atual expira em 26/04/2031 e
deve ser revisada antes dessa data. O painel do Supabase continua sendo a fonte
da versão vigente do certificado.

O Prisma CLI aplica `sslmode=verify-full` e a mesma CA, versionada também em
`packages/db/prisma/supabase-root-2021-ca.crt`, à `DIRECT_URL`. Assim runtime e
migrations recusam certificado ou hostname inválido mesmo que a URL local traga
parâmetros SSL mais fracos.

## Migrations

Em desenvolvimento, para criar uma migration:

```bash
pnpm db:migrate -- --name nome_da_migration
pnpm db:generate
```

Em produção ou CI, aplique somente migrations já versionadas:

```bash
pnpm db:deploy
```

`prisma db push` não faz parte do fluxo de produção.

## Verificação de homologação

Em 04/08/2026, a migration inicial e o seed foram executados no projeto de
Canadá Central. Um smoke test pelos serviços reais cadastrou um piloto, lançou
duas corridas no mesmo dia e confirmou melhor volta, categoria, ranking, pontos
(`40 + 20`), notificações e auditoria. O piloto sintético foi marcado `INATIVO`;
as duas corridas permanecem no histórico porque o sistema não apaga dados.

## Vercel

O runtime recebe `DATABASE_URL`, `DATABASE_POOL_MAX`, `AUTH_SECRET`,
`NEXT_PUBLIC_SITE_URL` e `NEXT_PUBLIC_WHATSAPP`. `DIRECT_URL` deve ficar apenas
no ambiente confiável que executa migrations. Nenhuma API key do Supabase deve
ser cadastrada no projeto Vercel enquanto esses produtos não forem adotados.

Preview/homologação não deve compartilhar o banco de produção. A escolha do
Supabase também não encerra as pendências jurídicas e operacionais registradas
em [lgpd.md](lgpd.md).
