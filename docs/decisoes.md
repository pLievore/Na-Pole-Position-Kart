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

**Conexões:** runtime serverless usa o Transaction pooler com um usuário
`app_runtime` restrito; Prisma CLI e migrations usam conexão direta ou Session
pooler com o proprietário `postgres`. Separar runtime de migration reduz o
impacto de uma credencial da aplicação comprometida sem quebrar futuros `ALTER`
nos objetos que pertencem ao usuário de migration.

**Mudaria se:** uma fase futura adotasse Auth, Storage, Realtime ou acesso
direto pelo cliente. Essa mudança exigiria novo desenho de autorização e RLS.

---

## 016 — Homologação Supabase em Canadá Central (2026-08-04)

**Decisão:** o projeto Supabase de homologação foi criado em Canadá Central
(`ca-central-1`). A região não será tratada como autorização automática para
produção.

**Por quê:** a região foi escolhida pelo responsável do projeto antes da carga
inicial. Como dados pessoais ficam fora do Brasil, a avaliação de transferência
internacional, os contratos aplicáveis e a informação ao titular permanecem
pendências explícitas de LGPD.

**Mudaria se:** a avaliação jurídica ou requisitos de latência determinarem
residência no Brasil. Trocar a região exige novo projeto e migração de dados.

---

## 017 — Agendamento como visitante com confirmação manual (2026-08-04)

**Decisão:** a reserva de corrida não exige conta e não recebe pagamento nesta
fase. O responsável informa nome, WhatsApp, e-mail e participantes; a
solicitação ocupa vagas e fica pendente até confirmação manual pela operação.
O cadastro completo de cada piloto acontece ou é vinculado no check-in.

**Por quê:** pedir o cadastro esportivo completo antes de a pessoa escolher um
horário cria atrito desnecessário na principal conversão do site. Ao mesmo
tempo, confirmação manual permite à pista validar a operação enquanto preços,
pagamento e políticas comerciais ainda não foram fechados.

**Mudaria se:** houver pagamento online ou confirmação operacional automática;
nesse caso a máquina de estados continua válida, mas confirmação e expiração
passam a responder a esses eventos.

---

## 018 — Horário e participantes são entidades próprias (2026-08-04)

**Decisão:** a agenda separa o horário publicado, a reserva do responsável e os
participantes. Vaga é contabilizada por participante em reservas pendentes ou
confirmadas, sob bloqueio transacional do horário. Registros são cancelados ou
fechados por status, nunca apagados.

**Por quê:** uma reserva pode levar várias pessoas e cada uma só ganha cadastro
e número de piloto no check-in. Separar os conceitos evita criar pilotos
incompletos e permite impedir overbooking mesmo com duas reservas simultâneas.

**Operação confirmada em 2026-08-04:** segunda a sábado, 18h–22h; domingo
fechado. Baterias de 15 minutos a cada 30 minutos; 10 vagas; mínimo de 2 horas
de antecedência; chegada 30 minutos antes. Tudo é editável no painel e só passa
a valer publicamente quando os horários são gerados e publicados.

A matriz anterior (quarta a sexta 18h–22h, fim de semana 14h–22h) era hipótese
de homologação e foi substituída pelo horário real de funcionamento.

---

## 019 — Matriz operacional da agenda (2026-08-04)

**Decisão:** `OPERADOR` pode consultar reservas e executar a rotina do balcão:
confirmar ou cancelar uma solicitação, registrar observações, vincular um
cadastro existente, fazer check-in, marcar ausência e concluir a bateria.
`ADMINISTRADOR` também executa essas ações e, exclusivamente, cria, edita,
publica, bloqueia, encerra ou cancela horários e altera os padrões da agenda.

**Por quê:** confirmação e check-in fazem parte da operação diária e precisam
continuar mesmo sem um administrador presente. Alterações estruturais afetam a
oferta pública e a capacidade futura, por isso ficam no nível mais restrito.
Todas as mutações continuam auditadas com o usuário que as executou.

**Cadastro no check-in:** para não deixar a sessão privada de um cliente aberta
no terminal compartilhado, cadastro novo é feito no aparelho do próprio piloto.
O operador usa a busca interna para conferir nome, número, categoria e status
antes de vincular; cadastro administrativo sem sessão só será adotado quando
existir entrega segura de convite ou definição de senha pelo próprio titular.

---

## 020 — Limite de taxa persistido em Postgres, com identificador hasheado (2026-08-04)

**Decisão:** endpoints públicos que gravam dados passam por limite de taxa em
janelas cumulativas, contado a partir de tentativas persistidas na tabela
`tentativas_limitadas`. A chave é um HMAC-SHA256 do identificador (IP ou
telefone), nunca o valor em claro.

Limites aplicados: solicitação de agendamento (por origem e por telefone),
cadastro de piloto, consulta de protocolo e login (por origem e por conta).

**Por quê:** o agendamento é o único ponto do sistema em que alguém sem conta
grava dados e **ocupa vaga real**. As defesas que já existiam — campo-isca e
reserva duplicada por telefone no mesmo horário — impedem o erro honesto, não o
script: telefones aleatórios lotariam a agenda de um fim de semana em segundos,
e a operação só descobriria quando ninguém aparecesse na pista.

**Por que em Postgres:** contador em memória não funciona em serverless — cada
instância teria o seu, e o limite viraria "N por instância". Postgres é o único
estado compartilhado que o projeto já tem, e o volume não justifica Redis.

**Por que hasheado:** IP é dado pessoal. Guardar quem acessou o site, de onde e
quando criaria uma base que a operação não precisa e que teria de constar na
política de privacidade. O HMAC conta tentativas do mesmo identificador sem
permitir descobrir qual é.

**Detalhes que importam:**

- A tentativa é gravada **antes** da contagem: sob concorrência isso conta a
  mais e bloqueia, em vez de contar a menos e deixar passar.
- Os limites do agendamento só são consumidos **depois** da validação do
  formulário — quem errou um campo e corrigiu não gasta cota.
- Falha do banco não bloqueia a operação: o limite é ignorado e o erro é
  registrado. Derrubar o agendamento inteiro por causa do controle de abuso
  seria pior do que o abuso.
- Login bem-sucedido zera a cota daquela conta.

**Ainda não coberto:** verificação real do telefone (OTP por SMS/WhatsApp)
exige provedor e tem custo por mensagem — ver
[perguntas em aberto](perguntas-em-aberto.md).

---

## 021 — Cadastro de balcão nasce sem senha e com peso aferido (2026-08-04)

**Decisão:** o painel ganha um cadastro de piloto próprio, para uso no balcão com
a pessoa presente. Ele difere do cadastro do site em três pontos:

1. **Nasce sem senha.** `Piloto.senhaHash` passa a ser opcional. O piloto recebe
   um link de primeiro acesso e escolhe a própria senha.
2. **O peso entra como aferido**, não declarado — grava `pesoConferidoKg` e
   `pesoConferidoEm` de uma vez.
3. **O e-mail é opcional.** `Piloto.email` passa a ser opcional.

**Por quê, item a item:**

*Sem senha* — o operador não pode escolher a senha de outra pessoa. Senha
provisória dita em voz alta no balcão é pior: passa pela boca de quem atende e
fica na tela de um terminal compartilhado.

*Peso aferido* — quem cadastra no balcão está na pista e sobe na balança.
Registrar como "declarado" criaria uma pendência de conferência que já foi
resolvida no ato, e o peso é o que define a categoria.

*E-mail opcional* — nem todo mundo tem em mãos, e a pessoa precisa entrar na
pista agora. Sem e-mail ela corre e aparece no ranking normalmente; só não
acessa o site, já que o login é por e-mail. A tela diz isso explicitamente para
o operador, em vez de deixar a limitação implícita.

**Aceite dos termos:** o operador confirma, com marcação obrigatória, que
apresentou regras e termos ao piloto. Fica registrado com data e versão, igual
ao cadastro do site — é o que a LGPD exige e o que sustenta a participação no
ranking (regra 8 da seção 17).

**Antes disso**, a tela de check-in orientava a equipe a entregar um celular
para a pessoa preencher o cadastro público — exatamente o atrito que a decisão
017 (reserva sem conta) queria evitar, empurrado do agendamento para o balcão.

---

## 022 — Convite de primeiro acesso vale dias; recuperação vale minutos (2026-08-04)

**Decisão:** `TokenSenha` ganha o campo `finalidade`. `PRIMEIRO_ACESSO` expira em
7 dias; `RECUPERACAO` continua em 30 minutos.

**Por quê:** quem pede recuperação está com o e-mail aberto naquele instante e
uma janela curta reduz o risco. Quem se cadastrou no balcão vai definir a senha
em casa, talvez só depois de correr — 30 minutos garantiria que o link morresse
antes de ser usado, e a equipe teria que emitir outro.

**Cuidados aplicados:** o link é exibido **uma única vez** na tela de quem
cadastrou (o banco guarda só o hash); definir a senha consome o convite,
invalida os demais convites pendentes e derruba as sessões antigas; a validade é
reconferida dentro da transação, com a linha travada, para dois envios
simultâneos não usarem o mesmo convite duas vezes.

**Pendente:** o envio automático do link depende de provedor de e-mail, que
ainda não existe (ver decisão 014). Por enquanto o operador copia o link da tela
e envia pelo WhatsApp da pista.
