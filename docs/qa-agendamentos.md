# QA da vitrine e dos agendamentos

Esta suíte é um contrato executável para a refatoração da vitrine e o fluxo de
agendamento. Enquanto a entrega estiver em desenvolvimento, falhas nesses testes
representam critérios ainda não atendidos.

## Preparação

Os navegadores não são baixados pelo `pnpm install`. Antes da primeira execução,
instale apenas o Chromium usado pela suíte:

```bash
pnpm --filter @napole/web exec playwright install chromium
```

Por padrão, o Playwright inicia `pnpm dev` em `http://localhost:3000` e reutiliza
um servidor local já ativo fora do CI.

```bash
pnpm --filter @napole/web test:e2e
pnpm --filter @napole/web test:a11y
pnpm --filter @napole/web test:e2e:ui
pnpm --filter @napole/web test:e2e:report
```

Variáveis aceitas pela configuração:

| Variável                        | Uso                                             |
| ------------------------------- | ----------------------------------------------- |
| `PLAYWRIGHT_BASE_URL`           | URL acessada pelos testes                       |
| `PLAYWRIGHT_WEB_SERVER_COMMAND` | Comando que inicia o servidor                   |
| `PLAYWRIGHT_WEB_SERVER_URL`     | URL aguardada pelo `webServer`                  |
| `PLAYWRIGHT_SKIP_WEB_SERVER=1`  | Usa uma aplicação já iniciada ou remota         |
| `E2E_AGENDAMENTO_MUTAVEL=1`     | Autoriza criar solicitação em banco descartável |

Não configure `E2E_AGENDAMENTO_MUTAVEL` contra homologação ou produção. O teste
gera uma solicitação sintética e exige ao menos um horário publicado; sem a
variável ele é ignorado com justificativa explícita.

## Contratos de interface

- A home tem um único `h1`, ao menos um link **Agendar corrida** e nenhum link
  ou botão **Cadastrar piloto**.
- O primeiro `Tab` alcança **Pular para o conteúdo**; ao ativá-lo, o foco vai
  para `#conteudo-principal`.
- A home não excede uma viewport de 375 px.
- `/agendar` expõe um grupo **Horários disponíveis**. Ele contém opções de
  seleção única (`radio`) ou o texto **Nenhum horário disponível**.
- O formulário usa os nomes acessíveis **Nome do responsável**, **WhatsApp**,
  **E-mail**, **Quantidade de participantes**, **Nome do participante N** e um
  aceite cujo nome contém **termos**.
- O envio final se chama **Solicitar agendamento**. A resposta aceita informa
  solicitação recebida, pendente ou aguardando confirmação; nunca afirma que a
  reserva já foi confirmada.
- Acesso anônimo a `/admin` termina em `/admin/entrar`.
- Home, agendamento, ranking, regras, login, termos e login administrativo não
  têm violações axe de impacto `critical` ou `serious` nas regras WCAG A/AA.

## Reprodução de falhas

O relatório HTML e os artefatos de falha ficam sob
`apps/web/node_modules/.cache/playwright-report` e
`apps/web/node_modules/.cache/playwright/test-results`. Em retry de CI a suíte
guarda trace; screenshot e vídeo são mantidos somente quando há falha.

Para reproduzir um arquivo específico:

```bash
pnpm --filter @napole/web exec playwright test e2e/home.spec.ts
pnpm --filter @napole/web exec playwright test e2e/agendar.spec.ts --grep "estado vazio"
```

Os testes de validação que exigem horários publicados se autoignoram quando a
agenda está vazia. Isso diferencia ausência legítima de seed de uma regressão da
interface.

## Execução de homologação — 04/08/2026

A suíte padrão foi executada contra o build de produção local conectado ao
Supabase: **23 cenários, 19 aprovados e 4 ignorados pelas travas de mutação**.
Passaram os contratos da home, seleção responsiva dos vídeos, autoplay com
pôster de fallback, movimento reduzido, navegação por teclado, menu móvel,
reflow em 320 px, formulário de agendamento, proteção do painel e axe nas sete
páginas auditadas.

Os cenários mutáveis também foram executados isoladamente no banco de
homologação: solicitação pública pendente, geração/publicação da grade,
atualização dos padrões, confirmação administrativa e disputa simultânea da
última vaga. Na disputa, uma solicitação foi aceita e a outra recusada, sem
ultrapassar a capacidade; o horário sintético foi cancelado por status ao fim.
