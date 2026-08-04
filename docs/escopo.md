# Escopo da Página Web — Na Pole Position Racing Club

> Conversão fiel do documento `Brainstorming App Kart.docx` para markdown, para
> que o escopo fique versionado junto com o código. O `.docx` continua sendo o
> original; alterações de escopo devem ser refletidas aqui.

## Objetivo

Página web responsiva, acessível pelo celular, para que os pilotos da Na Pole
Position Kart Indoor possam se cadastrar, acompanhar seus tempos, consultar
ranking, histórico de corridas, pontos e penalidades.

A equipe administrativa terá um painel interno para cadastrar pilotos, lançar
resultados, corrigir dados, controlar rankings, lançar penalidades e acompanhar
o desempenho geral da operação.

**Nesta fase o projeto é web, sem aplicativo Android/iOS.**

---

## 1. Página pública

### 1.1 Tela inicial

Nome: **Na Pole Position Racing Club**
Chamada: *Seu tempo. Seu ranking. Sua próxima disputa.*

A página explica que o Racing Club é o sistema oficial de ranking da Na Pole
Position Kart Indoor.

### 1.2 Botões principais

- Cadastrar piloto
- Entrar na minha conta
- Ver ranking
- Chamar no WhatsApp
- Ver regras do ranking

### 1.3 Ranking público

Top 10 geral; Top 10 de cada categoria (masculino leve/médio/pesado, feminino
leve/médio/pesado); ranking mensal; ranking geral/histórico.

### 1.4 Informações visíveis no ranking público

| Informação | Exibir? |
| --- | --- |
| Posição | Sim |
| Número do piloto | Sim |
| Nome abreviado | Sim |
| Categoria | Sim |
| Melhor volta | Sim |
| Data do tempo | Sim |
| Peso exato | **Não** |
| Telefone | **Não** |
| E-mail | **Não** |
| Data de nascimento | **Não** |

Exemplo:

| Posição | Nº Piloto | Nome | Categoria | Melhor volta |
| --- | --- | --- | --- | --- |
| 1º | #231 | Patrick W. | Masculino Médio | 32.487s |
| 2º | #145 | Rafael S. | Masculino Médio | 32.901s |

---

## 2. Área do cliente / piloto

### 2.1 Cadastro

| Campo | Obrigatório | Observação |
| --- | --- | --- |
| Nome completo | Sim | Uso administrativo |
| Nome de exibição | Sim | Primeiro nome + inicial do sobrenome |
| Telefone/WhatsApp | Sim | Contato e recuperação |
| E-mail | Sim | Login |
| Senha | Sim | Acesso |
| Data de nascimento | Sim | Controle de idade |
| Sexo/categoria-base | Sim | Masculino, feminino ou outro |
| Peso declarado | Sim | Usado para categoria |
| Aceite dos termos | Sim | LGPD e regras do ranking |

### 2.2 Número automático do piloto

Gerado após o cadastro (ex.: `Piloto #231`). Usado para buscar o piloto no
painel, lançar corrida, lançar penalidade, consultar histórico e identificar no
ranking. **Não editável pelo cliente.**

### 2.3 Categoria automática por peso

**Masculinas**

| Categoria | Peso |
| --- | --- |
| Masculino Leve | até 66 kg |
| Masculino Médio | 67 kg a 85 kg |
| Masculino Pesado | 86 kg ou mais |

**Femininas** (sugestão inicial, ajustável conforme a distribuição real)

| Categoria | Peso |
| --- | --- |
| Feminino Leve | até 60 kg |
| Feminino Médio | 61 kg a 75 kg |
| Feminino Pesado | 76 kg ou mais |

**Junior** — critério operacional: idade mínima 14 anos; altura mínima 1,60 m;
cadastro com e-mail/contato do responsável.

### 2.4 Peso do piloto

O peso **não** aparece publicamente. O piloto informa no cadastro; a
administração pode confirmar na balança e editar no painel. O cliente visualiza
apenas a categoria (`Categoria: Masculino Médio`, e não `Peso: 82 kg`).

---

## 3. Perfil do piloto

Número do piloto; nome abreviado; categoria; melhor volta pessoal; posição no
ranking geral; posição no ranking da categoria; quantidade de corridas; última
corrida; pontos atuais; penalidades registradas; evolução de tempo.

---

## 4. Histórico de corridas

| Campo | Exibir? |
| --- | --- |
| Data da corrida | Sim |
| Melhor volta da bateria | Sim |
| Kart utilizado | Sim |
| Posição após a corrida | Sim |
| Pontos somados | Sim |
| Penalidades aplicadas | Sim |
| Observação administrativa | Opcional |

---

## 5. Ranking na área do cliente

Ranking geral, mensal e por categoria; Top 10 geral e da própria categoria;
posição atual; diferença para o piloto da frente.

### 5.1 Minha posição

```
Sua melhor volta: 33.284s
Sua posição: 7º lugar
Próximo alvo: 6º lugar
Diferença: 0.221s
```

Item importante para estimular o retorno do piloto.

---

## 6. Pontos do piloto

Na Fase 1 os pontos são **esportivos**, não carteira de crédito nem benefício
financeiro. Servem para medir participação, premiar frequência, registrar
disciplina, descontar penalidades e preparar base para campeonatos futuros.

| Evento | Pontos |
| --- | --- |
| Participou de uma corrida válida | +10 |
| Melhorou o próprio tempo | +5 |
| Entrou no Top 10 da categoria | +10 |
| Fez melhor tempo do dia na categoria | +15 |
| Advertência | -1 |
| Punição | -3 |
| Punição grave | -5 |

**O ranking principal continua sendo por melhor volta, não por pontos.**

---

## 7. Penalidades

### 7.1 Motivos

Batida em outro piloto; ultrapassagem forçada; não respeitar bandeiras; travar a
pista propositalmente; não deixar piloto mais rápido ultrapassar; direção
perigosa; reincidência de conduta inadequada.

### 7.2 Tipos

| Penalidade | Desconto |
| --- | --- |
| Advertência | -1 ponto |
| Punição | -3 pontos |
| Punição grave | -5 pontos |
| Desclassificação da bateria | Manual, conforme decisão administrativa |

---

## 8. Notificações e avisos

Forma técnica a confirmar: painel do cliente; e-mail; WhatsApp manual; WhatsApp
integrado no futuro; push se virar PWA.

### 8.1 Notificações desejadas

Piloto superado no ranking; entrou no Top 10; saiu do Top 10; melhorou o próprio
tempo; alguém empatou seu tempo; 20 dias sem correr; aviso de manutenção; aviso
de fechamento; mensagem promocional.

### 8.2 Exemplos de mensagens

- **Tempo superado:** *Alerta de ultrapassagem! Seu tempo foi batido na categoria Masculino Médio. Vai deixar assim?*
- **Entrou no Top 10:** *Você entrou no Top 10 da Na Pole Position. Agora o alvo é você.*
- **Saiu do Top 10:** *Você saiu do Top 10. A pista está chamando para a revanche.*
- **20 dias sem correr:** *Seu kart está sentindo sua falta. Volte para tentar melhorar sua volta.*

---

## 9. Área administrativa

### 9.1 Níveis de acesso

| Nível | Permissão |
| --- | --- |
| Administrador | Acesso total |
| Operador | Lança corridas, consulta pilotos e lança penalidades |

---

## 10. Dashboard administrativo

Total de pilotos cadastrados; pilotos ativos; corridas lançadas no mês; novos
cadastros; Top 10 geral; categorias mais movimentadas; penalidades recentes;
últimos tempos lançados; karts mais usados.

---

## 11. Gestão de pilotos no ADM

Buscar por número, nome, telefone ou e-mail; cadastrar manualmente; editar
cadastro; editar peso declarado; confirmar peso aferido; alterar categoria;
bloquear usuário; excluir cadastro com erro; resetar senha; visualizar
histórico, pontos, penalidades e posição no ranking.

### 11.1 Dados visíveis no ADM

Número; nome completo; nome de exibição; telefone; e-mail; data de nascimento;
sexo/categoria-base; peso declarado; peso conferido; categoria final; status;
data de cadastro; histórico de corridas; penalidades; pontos; observações
internas.

---

## 12. Lançamento de corrida no ADM

### 12.1 Campos

| Campo | Obrigatório |
| --- | --- |
| Número do piloto | Sim |
| Data da corrida | Sim |
| Melhor volta | Sim |
| Kart utilizado | Sim |
| Penalidade | Sim, mesmo que seja "sem penalidade" |
| Categoria | Automática |
| Operador responsável | Automático pelo login |
| Observação | Opcional |

### 12.2 Após salvar a corrida

O sistema deve automaticamente: registrar no histórico; comparar com a melhor
volta anterior; atualizar melhor volta pessoal; atualizar ranking geral, mensal
e por categoria; somar pontos; descontar penalidades; verificar se alguém foi
superado; gerar aviso/notificação.

---

## 13. Gestão de penalidades no ADM

### 13.1 Campos

| Campo | Obrigatório |
| --- | --- |
| Piloto | Sim |
| Corrida vinculada | Sim |
| Tipo da penalidade | Sim |
| Pontos descontados | Automático |
| Motivo | Sim |
| Observação | Opcional |
| Operador responsável | Automático |

---

## 14. Gestão de karts no ADM

**Dados:** número do kart; modelo/chassi; motor; status; observações.

**Status:** operacional; manutenção; parado; reserva; desativado.

Ajuda a identificar se algum kart está constantemente fazendo tempos melhores ou
piores.

---

## 15. Gestão de rankings no ADM

Ranking geral, mensal, por categoria, por sexo, por kart (se possível), de
pontos; pilotos com mais corridas; pilotos com mais penalidades.

### 15.1 Exportação

PDF; imagem para Instagram/Stories; imagem quadrada para feed; CSV/Excel se
possível. **Prioridade da Fase 1:** PDF, imagem simples, CSV/Excel opcional.

---

## 16. Gestão de notificações no ADM

Visualizar notificações automáticas; enviar aviso manual para um piloto, para
todos, por categoria, para o Top 20 ou para inativos; mensagens de manutenção,
fechamento e promocionais.

---

## 17. Regras comerciais do ranking

Página de regras visível ao cliente:

1. Só entram no ranking tempos registrados oficialmente pela Na Pole Position.
2. O tempo válido será sempre a melhor volta individual registrada.
3. O peso informado define a categoria do piloto.
4. A administração pode solicitar pesagem para confirmação da categoria.
5. O peso exato não será exibido publicamente.
6. A administração pode corrigir peso, categoria ou tempo em caso de erro.
7. O piloto aparecerá no ranking com número de piloto e nome abreviado.
8. A participação no ranking depende do aceite dos termos.
9. A Na Pole Position pode remover tempos lançados incorretamente.
10. A Na Pole Position pode alterar regras de ranking mediante comunicação.
11. Penalidades podem descontar pontos do piloto.
12. Condutas perigosas podem resultar em bloqueio no ranking ou suspensão.

---

## 18. Telas necessárias — Cliente

**Pública:** página inicial; ranking público; regras do ranking; agendamento de
corridas sem conta; confirmação da solicitação; cadastro; login. O cadastro de
piloto continua disponível para o check-in, mas deixa de ser uma chamada
principal da vitrine pública.

**Logada:** meu perfil; minha melhor volta; meu histórico de corridas; meus
pontos; minhas penalidades; ranking geral; ranking por categoria;
notificações/avisos; editar dados básicos; termos e privacidade.

---

## 19. Telas necessárias — Administrador

Login administrativo; dashboard; lista de pilotos; perfil administrativo do
piloto; cadastro manual; edição de piloto; lançamento de corrida; lista de
corridas; lançamento de penalidade; lista de penalidades; gestão de karts;
ranking geral; ranking mensal; ranking por categoria; ranking de pontos; gestão
de notificações; exportação de ranking; configurações de categorias, pontuação e
penalidades; usuários administrativos; agenda de corridas; criação e edição de
horários; confirmação, cancelamento, check-in e registro de não comparecimento.

---

## 20. Banco de dados necessário

**Pilotos:** ID interno; número automático; nome completo; nome de exibição;
telefone; e-mail; senha; data de nascimento; sexo/categoria-base; peso
declarado; peso conferido; categoria final; data de cadastro; status; aceite dos
termos; observações internas.

**Corridas:** ID; número do piloto; ID do piloto; data; melhor volta; kart;
categoria no momento da corrida; pontos somados; penalidades aplicadas; operador
responsável; observações.

**Penalidades:** ID; ID do piloto; ID da corrida; tipo; motivo; pontos
descontados; operador responsável; data; observações.

**Karts:** ID; número; modelo/chassi; motor; status; observações.

**Rankings:** categoria; período; posição; piloto; número do piloto; melhor
volta; data do tempo; kart utilizado.

**Notificações:** ID; destinatário; tipo; mensagem; data de envio; status de
leitura; origem (automática ou manual).

**Usuários administrativos:** ID; nome; e-mail; senha; nível de acesso; status.

**Horários de agendamento:** ID; início e fim; capacidade; status; publicação;
cancelamento; observações internas; responsáveis pela criação e atualização.

**Agendamentos:** ID; protocolo público; horário; nome, telefone e e-mail do
responsável; origem; status; quantidade de participantes; indicação de menor de
idade; aceite dos termos; observações; datas de confirmação, cancelamento,
check-in e não comparecimento.

**Participantes do agendamento:** ID; agendamento; nome; piloto vinculado após o
check-in; status operacional. O cadastro completo do piloto é feito ou vinculado
no balcão antes da corrida.

**Eventos do agendamento:** transições de status, ator e data, mantidos como
histórico operacional e complementados por `RegistroAuditoria` nas ações do ADM.

---

## 21. Itens que NÃO entram nesta fase

Aplicativo Android/iOS; pagamento online; integração
automática com cronometragem; compra de pacotes; carteira de pontos comercial;
cashback; programa de fidelidade avançado; loja de peças; chat interno;
telemetria; integração automática com Instagram; cupons avançados; campeonato
completo.

### 21.1 Expansão aprovada — agendamento sem pagamento

O agendamento de corridas passa a integrar esta fase por solicitação do cliente
em 2026-08-04. A reserva é feita sem conta e sem pagamento online. A pessoa
responsável informa seus dados de contato, a quantidade e os nomes dos
participantes; cada participante é cadastrado ou vinculado a um piloto no
check-in.

Os horários e vagas são publicados pelo painel. A solicitação ocupa vagas e
fica pendente até confirmação manual da operação. O painel permite criar,
editar, publicar, fechar e cancelar horários, além de confirmar/cancelar
reservas, registrar check-in, conclusão e não comparecimento. Nada é apagado.

Como padrão inicial editável, a operação parte de quarta a sexta das 18h às
22h e sábado e domingo das 14h às 22h, com baterias de 15 minutos, saídas a cada
30 minutos, capacidade de 10 pilotos, antecedência mínima de 2 horas e chegada
30 minutos antes. Esses valores são hipóteses operacionais para homologação,
não horários comerciais definitivos.

O pagamento, a escolha de kart, a compra de pacotes e a integração automática
com cronometragem continuam fora desta fase.

---

## 22. Prioridade de desenvolvimento

**Prioridade 1 — Essencial:** página pública; cadastro de piloto; login; número
automático; categoria automática por peso; painel administrativo; lançamento
manual de corrida; ranking geral; ranking por categoria; perfil do piloto;
histórico de corridas.

**Prioridade 2 — Importante:** pontos do piloto; penalidades; ranking mensal;
exportação de ranking; avisos/notificações internas; gestão de karts.

**Prioridade 3 — Complementar:** aviso por inatividade de 20 dias; imagem
automática para Instagram; ranking por kart; relatórios avançados; notificações
mais sofisticadas.
