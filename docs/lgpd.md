# LGPD e dados pessoais

O sistema guarda nome completo, telefone, e-mail, data de nascimento, sexo e
**peso** de pessoas físicas. Peso é dado sensível na prática social — o próprio
escopo determina que nunca seja exibido publicamente (seções 1.4 e 2.4).

Este documento é um guia técnico, não um parecer jurídico. Os itens marcados
como **pendente** precisam de definição da Na Pole Position antes do sistema ir
ao ar.

---

## O que o sistema já garante

**Peso nunca vaza para o público.** A conversão para a web pública passa por
`paraRankingPublico()` (`packages/core/src/piloto.ts`), cujo tipo de retorno
não tem campo de peso, telefone, e-mail nem data de nascimento. Vazar um desses
no ranking público vira erro de compilação, não descuido de template.

**Senha nunca é guardada em texto.** scrypt com salt por senha
(`packages/auth/src/senha.ts`).

**Token de sessão nunca é guardado em texto.** O banco guarda só o SHA-256; se a
base vazar, os tokens armazenados não abrem conta nenhuma.

**Aceite registrado com data e versão.** `Piloto.aceiteTermosEm` e
`Piloto.versaoTermos` — sem isso não há como provar a que texto a pessoa
consentiu.

**Alterações administrativas ficam registradas.** `RegistroAuditoria`.

---

## Regras para quem for implementar

1. **Componente de UI não importa `@napole/db`.** Tudo passa por `src/server`,
   que decide o que sai de cada consulta.
2. **Ao montar qualquer lista pública, use `paraRankingPublico()`.** Não monte o
   objeto na mão.
3. **Não registre dado pessoal em log.** Nem telefone, nem e-mail, nem peso —
   log vai para serviço de terceiro e fica retido.
4. **Observações internas são internas.** `Piloto.observacoesInternas` nunca
   aparece para o piloto. Vale lembrar que o titular tem direito de acesso aos
   próprios dados: escreva ali só o que a operação sustentaria mostrar.

---

## Pendente de definição

- [ ] **Controlador dos dados** — razão social e CNPJ que assinam os termos.
- [ ] **Encarregado (DPO)** — nome e canal de contato, exigidos pela lei.
- [ ] **Prazo de retenção** — por quanto tempo ficam os dados de um piloto que
      nunca mais voltou.
- [ ] **Canal de exclusão** — como o titular pede exclusão e o que acontece com
      o histórico de corridas. *Sugestão:* anonimizar o cadastro (apagar nome,
      telefone, e-mail, data de nascimento e peso; manter número e tempos), o
      que atende o titular sem destruir o ranking histórico.
- [ ] **Consentimento de menores** — a LGPD trata dado de criança e adolescente
      com exigência específica. O escopo já pede contato do responsável para o
      Junior; falta definir o texto do consentimento.
- [ ] **Texto dos termos e da política de privacidade**, com finalidade,
      compartilhamento e direitos do titular.
- [ ] **Uso de imagem** — se o ranking exportado para Instagram (seção 15.1)
      levar nome de piloto, o consentimento precisa cobrir isso.
