# Arquitetura

## Mapa do repositório

```
Na Pole Position Kart/
├─ apps/
│  └─ web/                  Next.js — público, área do piloto e painel admin
│     └─ src/
│        ├─ app/            rotas (grupos: (publico), (piloto), (admin))
│        ├─ components/     UI
│        ├─ server/         acesso a banco, sessão, orquestração
│        └─ env.ts          validação das variáveis de ambiente
├─ packages/
│  ├─ core/                 regras de negócio puras + testes
│  ├─ db/                   schema Prisma, migrations, seed, cliente
│  └─ auth/                 hash de senha e tokens (server-side)
└─ docs/                    escopo, requisitos, decisões, LGPD
```

## A linha que divide as camadas

**`packages/core` decide o que é verdade.** Categoria de um peso, pontos de uma
corrida, posição no ranking, quem foi ultrapassado. Funções puras: mesma
entrada, mesma saída, sem banco e sem framework. É o que está coberto por
testes.

**`apps/web/src/server` decide o que acontece.** Lê o banco, chama o core,
grava o resultado, dispara notificação, verifica permissão.

**`apps/web/src/app` e `components` só exibem.** Não calculam regra nem montam
query.

Essa separação é o que permite testar ranking e pontuação sem subir banco — e o
que deixa `packages/core` reaproveitável se um app nativo aparecer na Fase 2.

## Fluxo crítico: lançamento de corrida

A seção 12.2 do escopo lista nove coisas que devem acontecer ao salvar uma
corrida. Se metade gravar e metade falhar, o ranking passa a mentir. Portanto:
**uma transação só**.

```
1. Validar entrada          parseTempo(), piloto existe e está ativo, kart existe
2. Fotografar o "antes"     calcularRanking() da categoria, antes de gravar
3. Gravar a corrida         Corrida + Penalidade[] na mesma transação
4. Calcular pontos          calcularPontosCorrida() com o contexto da corrida
5. Atualizar o piloto       melhorVoltaMs, pontosTotal, totalCorridas, ultimaCorridaEm
6. Fotografar o "depois"    calcularRanking() novamente
7. Diferença                compararRankings() e pilotosSuperadosPor()
8. Gerar notificações       a partir do passo 7
9. Registrar auditoria      quem lançou, o quê
```

Os passos 2, 6 e 7 são o que responde "verificar se alguém foi superado" sem
precisar de nenhuma lógica nova: o core já compara dois rankings e diz o que
mudou.

## Onde ficam as regras que a operação pode mudar

Valores que o escopo já avisa que podem mudar (faixas de peso femininas, tabela
de pontos, descontos de penalidade) estão em constantes exportadas no core:
`FAIXAS_PESO`, `TABELA_PONTOS`, `TABELA_PENALIDADES`, `REGRAS_JUNIOR`.

A tabela `Configuracao` existe para a operação sobrescrever esses valores pelo
painel sem precisar de deploy (telas de "Configurações" da seção 19). Enquanto
essas telas não existem, os defaults do core valem.

## Convenções de dados

| Dado | Como é guardado | Por quê |
| --- | --- | --- |
| Tempo de volta | `Int` em milissegundos | comparação exata; float arredonda |
| Peso, altura | `Decimal` | mesma razão |
| Pontos | `Int`, pode ser negativo | penalidade pode deixar saldo negativo |
| Categoria da corrida | congelada na corrida | resultado antigo não muda de lugar |
| Exclusão | status `INATIVO` / `valida = false` | preserva histórico e ranking |

## Custo mensal estimado

Vercel e Supabase cobrem a aplicação e o Postgres gerenciado. Planos, limites,
região, backup e retenção devem ser revistos antes da produção; domínio e
eventuais serviços de e-mail ficam à parte.
