# Área administrativa

Exige sessão de usuário administrativo. Dois níveis (seção 9.1):

- **ADMINISTRADOR** — acesso total, incluindo configurações e usuários.
- **OPERADOR** — lança corridas, consulta pilotos e lança penalidades.

Toda ação que altera dado de piloto, corrida ou penalidade deve gravar em
`RegistroAuditoria`. O escopo autoriza corrigir peso, categoria e tempo
(seção 17), então precisa ficar registrado quem mudou o quê.

Telas previstas (seção 19 do escopo):

| Rota | Tela | Seção |
| --- | --- | --- |
| `/admin/entrar` | Login administrativo | 9 |
| `/admin` | Dashboard | 10 |
| `/admin/pilotos` | Lista, busca e cadastro manual | 11 |
| `/admin/pilotos/[numero]` | Perfil administrativo e edição | 11.1 |
| `/admin/corridas/nova` | Lançamento de corrida | 12 |
| `/admin/corridas` | Lista de corridas | 12 |
| `/admin/penalidades` | Lançamento e lista | 13 |
| `/admin/karts` | Gestão de karts | 14 |
| `/admin/rankings` | Rankings e exportação | 15, 15.1 |
| `/admin/avisos` | Gestão de notificações | 16 |
| `/admin/configuracoes` | Categorias, pontuação e penalidades | 19 |
| `/admin/usuarios` | Usuários administrativos | 19 |
