# Área do piloto

Exige sessão de piloto. O `layout.tsx` deste grupo é o ponto único de
verificação — nenhuma página filha deve checar login por conta própria.

O piloto vê apenas a **categoria**, nunca o peso (seção 2.4).

Telas previstas (seção 18 do escopo):

| Rota | Tela | Seção |
| --- | --- | --- |
| `/perfil` | Meu perfil e melhor volta | 3 |
| `/corridas` | Histórico de corridas | 4 |
| `/pontos` | Extrato de pontos | 6 |
| `/penalidades` | Minhas penalidades | 7 |
| `/ranking` | Ranking geral, por categoria e "minha posição" | 5, 5.1 |
| `/avisos` | Notificações | 8 |
| `/conta` | Editar dados básicos | — |
