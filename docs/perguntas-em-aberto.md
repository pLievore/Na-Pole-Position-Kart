# Perguntas em aberto

Ambiguidades encontradas ao converter o escopo em modelo de dados e regras.

As **decisões confirmadas** com a operação em 2026-08-04 estão na primeira
seção. O que ainda depende de definição está na segunda.

---

# ✅ Confirmado em 2026-08-04

## 1. Ranking geral considera os últimos 12 meses

Não é vitalício. Sem janela, o Top 10 congela com pilotos que não correm há anos
e quem está ativo nunca alcança — o oposto do que a seção 5.1 quer provocar.

O tempo antigo continua no histórico e no perfil do piloto; ele só deixa de
disputar o ranking. Implementado em `periodoRankingGeral()`.

## 2. Junior vai de 14 a 17 anos, em categoria única

Sem divisão por sexo nem por peso. Ao completar 18 o piloto passa para a faixa
de peso. Um único ranking Junior. Implementado em `REGRAS_JUNIOR`.

## 3. Cadastro pelo site entra ativo na hora

Sem fila de aprovação. A validação real acontece naturalmente: o piloto só
aparece no ranking depois que a operação lançar a primeira corrida dele.

## 4. Um lançamento por bateria, mas participação pontua uma vez por dia

Cada bateria vira um lançamento com sua melhor volta, e "corridas registradas"
no perfil conta baterias. Mas os **+10 de participação valem uma vez por dia** —
senão quem compra quatro baterias leva 40 pontos de uma vez, e o ranking de
pontos passa a medir quanto a pessoa gastou em vez de com que frequência ela
volta. Os bônus (melhorou o tempo, Top 10, melhor tempo do dia) continuam
valendo em qualquer bateria. Implementado em `ContextoPontuacao.primeiraCorridaDoDia`.

## 5. Pontos acumulam para sempre

Saldo único, sem reset mensal. Penalidades descontam do mesmo saldo.

## 6. Só a administração altera peso e categoria

O piloto informa o peso no cadastro e nunca mais o edita. Evita que alguém perto
do limite de faixa ajuste o peso para cair numa categoria mais fácil. Toda
alteração grava `RegistroAuditoria`.

## 7. No empate, quem marcou o tempo primeiro fica na frente

Prática padrão no automobilismo. **Precisa aparecer na página de regras**
(seção 17), porque é o tipo de detalhe que gera discussão na pista.

## 8. Notificações chegam por painel e por e-mail

O painel é sempre; o e-mail vale para os avisos que justificam interromper a
pessoa. Exige provedor de envio (Resend ou SendGrid — plano gratuito atende o
volume inicial). WhatsApp fica para depois.

---

# ⏳ Ainda em aberto

## 9. Piloto com sexo "outro" corre em qual faixa de peso?

O cadastro aceita "outro" (seção 2.1), mas só existem faixas masculinas e
femininas (seção 2.3).

**Provisório:** o cadastro pede que o piloto escolha a faixa em que quer
competir, e a administração pode ajustar.

## 10. Alterar a categoria de um piloto mexe no histórico?

**Provisório:** não. Cada corrida guarda a categoria vigente naquele dia
(`categoriaNaCorrida`), então resultados antigos continuam valendo na categoria
em que foram feitos. Só o ranking futuro muda.

## 11. O bônus de "entrou no Top 10" repete?

**Provisório:** o piloto ganha +10 toda vez que **entra** no Top 10 da categoria
vindo de fora dele. Sai e volta, ganha de novo.

## 12. Número do piloto começa em quanto?

O exemplo do escopo usa `#231`.

**Provisório:** a sequência começa em **100**, para o número não denunciar
quantos cadastros a pista tem. Números não são reaproveitados.

## 13. Idade mínima para se cadastrar sozinho

**Provisório:** menores de 18 precisam de contato do responsável no cadastro;
abaixo de 14 o cadastro é recusado (limite operacional da seção 2.3).
**Confirmar** o texto do consentimento — a LGPD trata dado de criança e
adolescente com exigência específica. Ver [lgpd.md](lgpd.md).

## 14. Retenção de dados e exclusão de conta

O escopo cita aceite LGPD, mas não define prazo de guarda nem canal de
solicitação de exclusão.

**Provisório:** nada implementado além do registro de aceite. **Precisa de
definição antes de ir ao ar** — ver [lgpd.md](lgpd.md).

## 15. Ranking por kart

Aparece na seção 15 como "se possível" e na Prioridade 3. O modelo já guarda o
kart de cada corrida, então o dado existe.

**Provisório:** dado coletado, tela não construída.

## 16. Verificação real do telefone no agendamento

O limite de taxa por telefone (3 solicitações por dia) impede o abuso em volume,
mas não impede alguém de informar um número que não é seu — e a confirmação da
reserva é feita justamente por WhatsApp.

**Provisório:** sem verificação. O telefone é aceito como informado e a operação
confirma manualmente, o que na prática já filtra número errado.

**Para resolver de verdade** seria preciso um código por SMS ou WhatsApp, o que
exige provedor e tem custo por mensagem. Vale decidir junto com o canal de
notificação por e-mail, que também depende de provedor
(ver [decisão 014](decisoes.md)).
