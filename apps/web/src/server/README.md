# Camada de servidor

Onde vive tudo que toca banco, sessão ou envio de mensagem. Nenhum componente
de UI deve importar `@napole/db` diretamente — passa por aqui.

A regra de divisão é simples:

- **`@napole/core`** decide *o que é verdade* (categoria, pontos, ranking).
  Funções puras, sem banco.
- **`src/server`** decide *o que acontece* (ler, gravar, notificar, autorizar).
  Orquestra o core com o Prisma.

Pastas previstas:

| Pasta | Responsabilidade |
| --- | --- |
| `auth/` | Sessão do piloto e do admin, guardas de rota, recuperação de senha |
| `pilotos/` | Cadastro, edição, número automático, recálculo de categoria |
| `corridas/` | Lançamento de corrida e os 9 efeitos da seção 12.2 |
| `ranking/` | Consultas de ranking (geral, mensal, por categoria) e exportação |
| `notificacoes/` | Geração automática (seção 8.1) e envios manuais (seção 16) |
| `auditoria/` | Gravação de `RegistroAuditoria` |

## O lançamento de corrida é a operação crítica

A seção 12.2 lista nove efeitos que precisam acontecer juntos. Se metade
gravar e metade falhar, o ranking fica mentindo. Então: **uma transação só**,
e as notificações são geradas a partir da comparação de ranking antes/depois
(`compararRankings` e `pilotosSuperadosPor` do core).
