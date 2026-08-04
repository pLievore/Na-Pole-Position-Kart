# Componentes de UI

- `ui/` — peças genéricas (botão, campo, tabela, badge, card).
- `ranking/` — tabela de ranking, linha de pódio, bloco "minha posição".
- `piloto/` — cartão de perfil, extrato de pontos, histórico.

Componentes são Server Components por padrão. Só marque `"use client"` no
componente que realmente precisa de estado ou evento — o site é consumido no
celular, muitas vezes em rede da pista, e cada KB de JS pesa.
