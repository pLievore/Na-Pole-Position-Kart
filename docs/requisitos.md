# Requisitos por prioridade

Checklist de execução derivado da seção 22 do [escopo](escopo.md). Marque
conforme for entregando — este arquivo é o mapa de progresso do projeto.

Legenda: `[ ]` a fazer · `[~]` em andamento · `[x]` pronto

---

## Fundação (já entregue)

- [x] Estrutura do repositório (monorepo pnpm + Turborepo)
- [x] Modelagem do banco (`packages/db/prisma/schema.prisma`)
- [x] Regras de negócio puras e testadas (`packages/core`)
- [x] Hash de senha e tokens de sessão (`packages/auth`)
- [x] Documentação do escopo e das decisões
- [x] Camada de sessão com guardas de rota (piloto e admin)
- [x] Consultas de ranking a partir do banco
- [x] Componentes de UI base (botão, campo, seleção, aviso, tabela de ranking)

---

## Prioridade 1 — Essencial

### Cadastro e acesso

- [x] Formulário de cadastro do piloto (seção 2.1), responsivo
- [x] Sugestão automática do nome de exibição
- [x] Geração do número automático do piloto (seção 2.2)
- [x] Cálculo da categoria por peso no momento do cadastro (seção 2.3)
- [x] Aceite de termos com registro de data e versão
- [x] Login do piloto (e-mail + senha) e sessão em cookie
- [ ] Recuperação de senha _(modelo `TokenSenha` pronto; falta a tela e o envio)_

### Página pública e agendamento

- [x] Vitrine pública responsiva com hero, proposta de valor, experiência,
      funcionamento, ranking, informações operacionais e FAQ
- [x] CTA principal de agendamento; cadastro de piloto removido da navegação pública
- [x] Ranking público geral, mensal e por categoria (seção 1.3)
- [x] Página de regras do ranking, gerada a partir das constantes do core (seção 17)
- [~] Termos e privacidade — página existe, **texto jurídico pendente** (ver [lgpd.md](lgpd.md))
- [x] Agendamento como visitante, sem conta e sem pagamento (seção 21.1)
- [x] Seleção de horário com vagas disponíveis e proteção contra excesso de lotação
- [x] Coleta do responsável e dos participantes com aceite registrado
- [x] Protocolo de solicitação e comunicação de confirmação manual

### Área do piloto

- [x] Perfil com melhor volta, categoria, posição, pontos e nº de corridas (seção 3)
- [x] Bloco "minha posição" com próximo alvo e diferença (seção 5.1)
- [x] Histórico de corridas (seção 4)
- [ ] Página de ranking dentro da área logada com destaque do próprio piloto

### Administrativo

- [x] Login administrativo e controle de nível (seção 9.1)
- [x] Dashboard com os indicadores principais (seção 10 — parcial)
- [x] **Lançamento de corrida com os 9 efeitos da seção 12.2, em transação única**
- [x] Lista de corridas
- [x] Registro de auditoria no lançamento de corrida
- [x] Lista e busca de pilotos por número, nome, telefone e e-mail (seção 11)
- [x] Perfil administrativo do piloto e edição (seção 11.1)
- [ ] Cadastro manual de piloto
- [x] Confirmação de peso aferido na balança
- [ ] Invalidar corrida lançada errada (`valida = false`) com auditoria
- [x] Agenda administrativa por dia e status
- [x] Criar, editar, publicar, fechar e cancelar horários com auditoria
- [x] Confirmar/cancelar agendamento e registrar check-in, conclusão ou falta
- [x] Vincular cadastro existente ou orientar cadastro no próprio aparelho durante o check-in
- [x] Indicadores de ocupação e vagas restantes
- [x] Configuração editável dos padrões da agenda, restrita a `ADMINISTRADOR`

> **Próximo passo:** concluir as pendências essenciais do painel: cadastro manual
> de piloto e invalidação auditada de corrida lançada errada.

---

## Prioridade 2 — Importante

- [ ] Extrato de pontos do piloto (seção 6)
- [x] Penalidade lançada junto com a corrida (seção 13) — obrigatória, mesmo que "sem penalidade"
- [x] Notificações automáticas geradas no lançamento (seção 8.1) — tempo superado,
      entrou/saiu do Top 10, recorde pessoal, tempo empatado
- [ ] Tela do piloto para ler as notificações geradas
- [ ] Entrega das notificações por e-mail
- [ ] Lançamento de penalidade avulsa e listagem (seção 13)
- [ ] Tela de penalidades na área do piloto
- [ ] Ranking mensal (seções 5 e 15)
- [ ] Dashboard administrativo (seção 10)
- [ ] Gestão de karts (seção 14)
- [ ] Exportação de ranking em PDF (seção 15.1)
- [ ] Exportação de imagem simples para redes
- [ ] Notificações no painel do piloto (seção 8)
- [ ] Envio de avisos manuais pelo ADM (seção 16)
- [ ] Configurações de categorias, pontuação e penalidades (seção 19)
- [ ] Gestão de usuários administrativos

---

## Prioridade 3 — Complementar

- [ ] Aviso automático por inatividade de 20 dias (seção 8.1)
- [ ] Imagem automática para Instagram/Stories
- [ ] Ranking por kart (seção 15)
- [ ] Ranking por sexo e ranking de pontos
- [ ] Relatórios avançados
- [ ] Exportação CSV/Excel
- [ ] Notificações por e-mail
- [ ] PWA com push notification

---

## Fora do escopo desta fase

Ver seção 21 do escopo. Se algum desses itens for pedido, é mudança de escopo,
não ajuste: app nativo, pagamento online, integração com
cronometragem, carteira de pontos comercial, cashback, loja, chat, telemetria,
integração com Instagram, cupons, campeonato completo.

O agendamento sem pagamento deixou esta lista em 2026-08-04 e está documentado
como expansão aprovada na seção 21.1 do escopo.
