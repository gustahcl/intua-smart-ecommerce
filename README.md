# INTUA | Pague Menos

Assistente de compras conversacional integrada à loja: o cliente explica o que precisa, a INTUA busca no catálogo, explica, compara, monta kits dentro do orçamento e mexe no carrinho, enquanto a vitrine ao lado se adapta.

MVP do hackathon. Foco em **Dermocosméticos** e **Suplementos**.

## Rodar

Requer Node 20 ou superior.

```bash
npm install
cp .env.example .env.local   # depois preencha ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

| Situação | O que acontece |
|---|---|
| Com `ANTHROPIC_API_KEY` | O chat usa o Claude com ferramentas (tool use). Selo **IA ativa** no chat. |
| Sem chave, ou se a API falhar | Cai no **modo demonstração**: roteiro de regras, **não é IA**. Selo **Modo demo** no chat, para ninguém confundir na apresentação. |

Modelo padrão: `claude-haiku-5-5` (rápido e barato). Troque em `ANTHROPIC_MODEL` por `claude-sonnet-5-5` se quiser mais qualidade.

## Roteiro de demonstração (3 fluxos ensaiados)

Os chips da tela inicial já levam a esses fluxos. Frases que funcionam nos dois modos:

1. **Whey com orçamento:** "Quero um whey protein" → "Ganhar massa até R$ 120" → **Por que a INTUA recomendou?** (abre os dados do catálogo) → "Comparar opções" → "Adicionar o 1º ao carrinho".
2. **Protetor para pele oleosa:** "Protetor solar para pele oleosa" → "Ver opções mais baratas" → trocar um item pelo chat.
3. **Kit dentro do orçamento:** "Kit skin care pele oleosa até R$ 180" → "Adicionar tudo ao carrinho" → mostrar a barra de frete grátis no carrinho.

Bônus de segurança: "estou grávida, posso tomar ômega 3?" → a INTUA não recomenda e encaminha ao farmacêutico.

## Como funciona

```
Cliente ── chat ──▶ /api/chat ──▶ Claude (tool use) ──▶ ferramentas ──▶ catálogo
   ▲                                                         │
   └──── vitrine, comparador, carrinho, avisos ◀── UiState ──┘
```

- A IA **só escolhe IDs e escreve o motivo**. Preço, ativos, FPS, proteína por porção e custo por dose vêm sempre do catálogo (`src/lib/catalog.ts`). IDs inventados são descartados no servidor.
- Ferramentas (`src/lib/tools.ts`): `buscar_produtos`, `recomendar_produtos` (devolve o total real e se cabe no orçamento), `comparar_produtos`, `atualizar_carrinho`, `encaminhar_farmaceutico`. Todas validadas com Zod.
- O carrinho é do cliente; o servidor recebe só `productId` e `quantity`, e recalcula tudo.
- **Explicabilidade:** o motivo de cada recomendação aparece no card e no modal "Por que a INTUA recomendou?", ao lado dos dados reais do catálogo.

### Contrato de `POST /api/chat`

Superset do contrato original do projeto:

```json
{
  "mode": "ai",
  "message": "Separei 3 opções de proteína até R$ 120,00...",
  "recommendedProductIds": [13, 15, 16],
  "reasons": { "13": "24 g de proteína por porção; menor custo por g de proteína." },
  "compareProductIds": [],
  "cartActions": [{ "type": "set", "productId": 13, "quantity": 1 }],
  "suggestedActions": ["Comparar opções", "Ver opções mais baratas"],
  "pharmacistHandoff": null
}
```

### Estrutura

```
src/app/page.tsx            estado da tela (chat, vitrine, carrinho)
src/app/api/chat/route.ts   validação, rate limit, loop de tool use
src/lib/catalog.ts          catálogo, busca e métricas de custo-benefício
src/lib/tools.ts            ferramentas da IA e montagem da resposta
src/lib/system-prompt.ts    persona e regras de segurança em saúde
src/lib/demo.ts             modo demonstração (regras, sem IA)
src/components/             Header, Chat, Showcase, ProductCard, CartBar, CompareTable, ExplainModal
src/data/products.json      22 produtos mock
```

## Segurança

| Item | Status no MVP |
|---|---|
| Chave da API só no servidor | Implementado |
| Validação de entrada (Zod), limites de tamanho e caracteres de controle | Implementado |
| Rate limit por IP (15 req/min, em memória) | Implementado |
| IDs e preços validados contra o catálogo | Implementado |
| Mensagens renderizadas como texto (sem `dangerouslySetInnerHTML`) | Implementado |
| Headers HTTP (X-Frame-Options, nosniff, HSTS, CSP em produção) | Implementado |
| System prompt estrito + recusa de desvio de assunto | Implementado |
| Guardrails de saúde (sem diagnóstico, sem dose, encaminha ao farmacêutico) | Implementado |
| Logs sem dados do cliente | Implementado |
| Rate limit distribuído (Upstash/Redis) | Roadmap |
| Autenticação, RBAC e MFA (Auth.js) | Roadmap (não há login no MVP) |
| Banco com Prisma/PostgreSQL e transações | Roadmap (o catálogo é um JSON) |
| Auditoria e adequação à LGPD | Roadmap |

## Limitações conhecidas

- **Catálogo fictício.** Marcas, preços e composições são inventados para a demonstração. Em produção, o catálogo e o carrinho viram um adaptador para a API real da Pague Menos.
- As imagens dos produtos são ilustrações geradas por código (ícone e cor), não fotos.
- O checkout não existe: o botão "Finalizar compra" apenas informa que está fora do escopo.
- A regra de frete grátis (a partir de R$ 150) foi copiada do site, sem as condições reais.
- A resposta do chat não usa streaming; há um indicador de progresso enquanto carrega.
- O caminho com IA foi testado com um servidor simulado da API (loop de ferramentas, IDs inválidos, carrinho, farmacêutico), mas **não com a API real**: rode os fluxos acima com sua chave antes da apresentação.
