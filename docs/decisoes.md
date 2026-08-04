# Decisões de arquitetura

Registro do que foi decidido, **por quê**, e o que faria a decisão mudar.
Ordem cronológica. Data no formato AAAA-MM-DD.

---

## 001 — Monorepo enxuto em vez de projeto único (2026-08-04)

**Decisão:** repositório único com `apps/web` + `packages/core`, `packages/db` e
`packages/auth`, gerenciado por pnpm workspaces e Turborepo.

**Por quê:** o sistema é uma aplicação web só, com três áreas que compartilham o
mesmo banco e as mesmas regras — isso descarta separar front e back em repos
diferentes, que dobraria deploy, autenticação e manutenção de contrato de API
sem ganho nenhum para um time pequeno.

Ao mesmo tempo, o escopo tira o app nativo da Fase 1 mas não do futuro (seção
21: "podem ficar para uma fase futura"). Isolar as regras em `packages/core`
custa quase nada agora e evita reescrever ranking, pontuação e categoria quando
o app aparecer.

**Mudaria se:** o app nativo for definitivamente descartado *e* o overhead do
workspace incomodar — aí `packages/core` vira uma pasta dentro de `apps/web`.

---

## 002 — Next.js full-stack, um deploy só (2026-08-04)

**Decisão:** Next.js (App Router) com Server Components e Server Actions.
TypeScript em todo o repositório.

**Por quê:** a página pública precisa de SEO e carregamento rápido no celular
(Server Components entregam HTML pronto); a área logada e o painel precisam de
lógica de servidor. Um framework cobre os três casos com um deploy, um sistema
de tipos e um modelo de autenticação. Vira PWA depois sem trocar de stack —
relevante porque a seção 8 cogita push notification.

---

## 003 — Postgres gerenciado com Prisma (2026-08-04)

**Decisão:** Postgres (Neon ou Supabase) acessado via Prisma.

**Por quê:** os dados são inerentemente relacionais (piloto → corridas →
penalidades) e o ranking depende de ordenação e agregação confiáveis. Postgres
gerenciado tira backup e disponibilidade da mesa. Prisma dá schema versionado,
migrations e tipos gerados a partir do próprio banco.

---

## 004 — Tempo de volta é inteiro em milissegundos (2026-08-04)

**Decisão:** todo tempo é `Int` em milissegundos, nunca `Float` ou `Decimal`.
Conversão só na borda: `parseTempo` na entrada, `formatarTempo` na exibição.

**Por quê:** comparar tempos é *a* operação do sistema. Ponto flutuante
introduz erro de arredondamento, e aqui um milésimo decide posição no ranking.
Inteiro compara e ordena exato.

---

## 005 — Faixas de peso contínuas (2026-08-04)

**Decisão:** o limite superior de cada faixa é inclusivo e a próxima começa
imediatamente acima. Masculino: `≤66`, `≤85`, resto.

**Por quê:** o escopo escreve "até 66 kg" e "67 a 85 kg", o que deixa 66,5 kg
sem categoria nenhuma. Balança de pista mede com casa decimal, então o buraco
apareceria em produção.

---

## 006 — Nada é apagado de verdade (2026-08-04)

**Decisão:** cadastro com erro vira `status = INATIVO`; tempo lançado errado
vira `valida = false`. Exclusão física só por pedido do titular (LGPD).

**Por quê:** a seção 11 permite "excluir cadastro com erro" e a seção 17 permite
"remover tempos lançados incorretamente" — mas apagar linha referenciada por
corridas e penalidades quebra o histórico e o ranking passado. Invalidar
resolve a necessidade real da operação sem destruir dado.

---

## 007 — Trilha de auditoria desde o início (2026-08-04)

**Decisão:** tabela `RegistroAuditoria` gravada em toda alteração
administrativa de piloto, corrida ou penalidade.

**Por quê:** o escopo dá à administração o poder de corrigir peso, categoria e
tempo, e de aplicar penalidades que descontam pontos. Onde há ranking, há
disputa; quando um piloto reclamar de uma alteração, a operação precisa
conseguir mostrar quem mudou o quê e quando. Colocar depois exigiria
reprocessar histórico que não foi guardado.

---

## 008 — Campos derivados em cache no piloto (2026-08-04)

**Decisão:** `melhorVoltaMs`, `pontosTotal`, `totalCorridas` e `ultimaCorridaEm`
são colunas em `Piloto`, recalculadas na mesma transação do lançamento de
corrida. A fonte da verdade continua sendo a tabela `Corrida`.

**Por quê:** ranking público e perfil são as telas mais acessadas; varrer o
histórico a cada leitura não escala. O risco do cache é divergir — por isso o
recálculo é transacional e deve existir um comando de reconciliação antes de
qualquer fechamento de ranking mensal.

---

## 009 — Login por e-mail e senha (2026-08-04)

**Decisão:** autenticação por e-mail + senha, com sessão em cookie `httpOnly` e
token guardado no banco apenas como hash. Senha com scrypt.

**Por quê:** é o que o escopo especifica (seção 2.1: e-mail = login). OTP por
WhatsApp reduziria atrito no celular, mas tem custo por mensagem e depende de
provedor — fica como possível troca futura, isolada em `packages/auth`.

---

## 010 — Categoria Junior vale de 14 a 17 anos, sem subdivisão (2026-08-04)

**Decisão:** piloto com menos de 18 anos corre no Junior — categoria única, sem
divisão por sexo nem por peso. A partir de 18 passa a competir pela faixa de peso.

**Por quê:** o escopo define o piso (14 anos, 1,60 m, responsável) mas não o
teto; 18 é a maioridade. Categoria única porque, com o volume de uma pista só,
Junior masculino e feminino separados renderiam dois rankings quase vazios.

**Confirmado com a operação em 2026-08-04.**

---

## 011 — Ranking geral tem janela de 12 meses (2026-08-04)

**Decisão:** o ranking geral considera apenas tempos dos últimos 12 meses. O
tempo antigo continua no histórico e no perfil do piloto.

**Por quê:** ranking vitalício congela o Top 10 com pilotos que pararam de
correr, e quem está ativo nunca alcança. Isso mata exatamente o gancho que a
seção 5.1 quer criar ("Próximo alvo: 6º lugar / Diferença: 0.221s") — não
adianta perseguir alguém que nunca mais vai à pista.

**Mudaria se:** a pista quiser um quadro de "recorde histórico" — aí ele entra
como tela à parte, sem alterar o ranking principal.

---

## 012 — Participação pontua uma vez por dia (2026-08-04)

**Decisão:** cada bateria vira um lançamento próprio, mas os +10 de participação
são pagos apenas na primeira bateria do dia. Os bônus (melhorou o tempo, entrou
no Top 10, melhor tempo do dia) valem em qualquer bateria.

**Por quê:** o escopo diz que pontos medem "participação" e "frequência". Pagar
+10 por bateria transformaria o ranking de pontos em medida de quanto o piloto
gastou naquele dia — quem compra quatro baterias levaria 40 pontos de uma vez.
Uma vez por dia mede quantos dias a pessoa voltou, que é a intenção.

---

## 013 — Peso e categoria só mudam pelo painel (2026-08-04)

**Decisão:** o piloto informa o peso no cadastro e não pode editá-lo depois. Só
a administração altera peso e categoria, com registro de auditoria.

**Por quê:** um piloto perto do limite de faixa (66 kg, 85 kg) teria incentivo
direto para ajustar o peso e cair numa categoria com concorrência mais fraca. O
escopo já prevê que a pista confira o peso na balança — a autoridade é dela.

---

## 014 — Notificações por painel e e-mail na Fase 1 (2026-08-04)

**Decisão:** toda notificação aparece no painel do piloto; as relevantes também
saem por e-mail. WhatsApp fica para uma fase seguinte.

**Por quê:** o painel não tem custo nem dependência externa, e o e-mail alcança
quem não abre o site — que é justamente o piloto que a seção 8.1 quer trazer de
volta. WhatsApp teria o melhor alcance, mas exige conta business aprovada,
templates homologados e custo por mensagem.

**Como está modelado:** a notificação é persistida uma vez; `emailEnviadoEm` e
`emailErro` rastreiam a entrega. Acrescentar um canal depois é acrescentar
entrega, não refazer a lógica de geração.

---

## 015 — Supabase fornece somente o Postgres (2026-08-04)

**Decisão:** usar Supabase como Postgres gerenciado, acessado exclusivamente
pelo Prisma no servidor. A Data API fica desligada e a autenticação continua no
`packages/auth`; não entram `supabase-js`, Supabase Auth nem API keys.

**Por quê:** o sistema já tem autorização, sessão e regras transacionais no
servidor. Expor as tabelas pela API automática criaria uma segunda superfície de
acesso para dados pessoais sem oferecer benefício ao escopo atual.

**Conexões:** runtime serverless usa o Transaction pooler; Prisma CLI e
migrations usam conexão direta ou Session pooler. Um usuário `prisma` exclusivo
separa e torna observável o acesso da aplicação.

**Mudaria se:** uma fase futura adotasse Auth, Storage, Realtime ou acesso
direto pelo cliente. Essa mudança exigiria novo desenho de autorização e RLS.
