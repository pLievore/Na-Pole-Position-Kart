# Supabase

O Supabase fornece apenas o Postgres gerenciado deste projeto. A aplicação não
usa Supabase Auth, Data API, Storage, Realtime nem `supabase-js`; portanto não
precisa de publishable key, secret key, `anon` ou `service_role`.

## Preparar o projeto

1. Em **Settings > API Keys**, exclua qualquer secret key que tenha sido
   exposta. Nenhuma substituta precisa ser criada para esta aplicação.
2. No painel de integrações da Data API, desligue **Enable Data API**.
3. No SQL Editor, crie um usuário exclusivo para o Prisma. Troque o placeholder
   por uma senha forte, guardada somente no gerenciador de senhas e no `.env`:

```sql
create user "prisma" with password 'TROQUE_POR_UMA_SENHA_FORTE' bypassrls createdb;

grant "prisma" to "postgres";
grant usage, create on schema public to prisma;
grant all on all tables in schema public to prisma;
grant all on all routines in schema public to prisma;
grant all on all sequences in schema public to prisma;

alter default privileges for role postgres in schema public grant all on tables to prisma;
alter default privileges for role postgres in schema public grant all on routines to prisma;
alter default privileges for role postgres in schema public grant all on sequences to prisma;
```

O `createdb` permite ao `prisma migrate dev` criar o banco temporário usado para
detectar divergências de schema. O `bypassrls` é intencional porque as
autorizações desta aplicação acontecem no servidor e a Data API permanece
desligada.

## Conexões

Copie as strings pelo botão **Connect** do projeto:

- `DATABASE_URL`: Transaction pooler/Supavisor, porta `6543`, para o runtime
  serverless da Vercel;
- `DIRECT_URL`: conexão direta, porta `5432`, para o Prisma CLI e migrations;
- se a máquina que executa migrations não alcançar IPv6, use o Session pooler,
  porta `5432`, como `DIRECT_URL`.

Substitua o usuário `postgres` por `prisma` nas strings e use a senha criada
acima. Senhas com caracteres reservados precisam estar codificadas para URL.
Copie `.env.example` para `.env` e nunca envie as URLs por chat ou Git.

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

## Vercel

O runtime recebe `DATABASE_URL`, `DATABASE_POOL_MAX`, `AUTH_SECRET`,
`NEXT_PUBLIC_SITE_URL` e `NEXT_PUBLIC_WHATSAPP`. `DIRECT_URL` deve ficar apenas
no ambiente confiável que executa migrations. Nenhuma API key do Supabase deve
ser cadastrada no projeto Vercel enquanto esses produtos não forem adotados.

Preview/homologação não deve compartilhar o banco de produção. A escolha do
Supabase também não encerra as pendências jurídicas e operacionais registradas
em [lgpd.md](lgpd.md).
