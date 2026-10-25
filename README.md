# INTUA | Pague Menos

Assistente de compras com IA para o e-commerce da Pague Menos. O cliente diz o que precisa, sem nomes técnicos, e a loja se reorganiza com as opções certas para o caso e o orçamento dele: explicadas, comparadas e prontas para ir ao carrinho.

**Hacka Business · REC'N'PLAY 2026** · desafio Pague Menos e Avanade: transformar conversas e intenções em jornadas de descoberta, recomendação e compra, sem ser "mais um chatbot".

**Demo:** https://intua-smart-ecommerce.vercel.app

**Time 10:** Caio Lucas Laurindo da Silva, Davi Pereira do Nascimento, Gustavo Henrique Custódio de Lima, Igor Daniel da Silva e Matheus Chaves Leôncio de Lira.

## O problema

Em dermocosméticos e suplementos, o cliente sabe a necessidade ("algo para manchas de acne", "whey para ganhar massa sem gastar muito"), mas não domina ativos, FPS ou proteína por porção. Ele trava na escolha ou sai para perguntar a uma IA fora do site. A INTUA traz essa conversa para dentro da loja e a transforma em carrinho.

## O que a INTUA faz

- **Busca por intenção na própria vitrine.** A barra "Busca inteligente INTUA" aceita o pedido em linguagem natural. Não é preciso abrir um chat antes.
- **A loja muda com a conversa.** No desktop, o chat fica ao lado da vitrine. A cada pedido, a seção "Escolhas da INTUA" mostra os produtos selecionados e o pedido que os gerou.
- **Explica cada escolha.** O card mostra o motivo, e o botão "Por que a INTUA recomendou?" abre os dados reais do catálogo (ativos, FPS, proteína, custo por dose).
- **Compara e calcula custo-benefício.** R$ por dose, por grama de proteína ou por 10 g/ml, calculados no código.
- **Monta kits dentro do orçamento.** Um item por função (limpeza, protetor, hidratante, tratamento), com o total calculado no servidor.
- **Opera o carrinho.** "Adicionar o primeiro", "tirar o protetor", "mudar para 2 unidades".
- **Lê a foto da embalagem.** O cliente fotografa um frasco ("acabou o meu, quero esse") e a INTUA encontra o produto ou similares no catálogo.
- **Encaminha saúde para o farmacêutico.** Gestação, amamentação, bebês, uso de medicamentos, sintomas e receitas médicas não recebem recomendação: a INTUA explica e oferece o atendimento com um farmacêutico. Ela não lê receitas.
- **Feed para agentes externos.** `GET /api/feed` expõe o catálogo em formato estruturado para assistentes como ChatGPT e Gemini.

## Como funciona

```
Cliente (texto ou foto da embalagem)
   │
   ▼
Next.js: vitrine + chat + carrinho
   │  POST /api/chat
   ▼
Rota da API: validação (Zod), limite de requisições, leitura da foto
   │
   ▼
Modelo de IA com ferramentas (Gemini, com Groq como reserva)
   ├── buscar_produtos           busca e filtra o catálogo
   ├── recomendar_produtos       escolhe IDs e escreve o motivo; devolve o total real
   ├── comparar_produtos         monta o comparativo
   ├── atualizar_carrinho        adiciona, remove, troca quantidade
   └── encaminhar_farmaceutico   casos de saúde
   │
   ▼
Resposta: mensagem + produtos + motivos + ações no carrinho + sugestões
```

**A IA escolhe, o código calcula.** O modelo só devolve IDs de produto e o motivo. Preço, ativos, FPS, proteína por porção, custo-benefício e totais vêm sempre do catálogo, e IDs que não existem são descartados no servidor.

**Foto da embalagem.** O navegador reduz a imagem (até 1024 px) antes de enviar. O Gemini classifica a foto em embalagem, receita ou outro. Embalagem vira uma busca no catálogo; receita é encaminhada ao farmacêutico. A foto não é guardada nem registrada em log.

**Ordem dos provedores.** Gemini (`gemini-3.5-flash-lite`), depois Groq (`openai/gpt-oss-120b`). Se os dois falharem, ou se não houver chave, o app usa o **modo demonstração**: um roteiro de regras que cobre os fluxos principais. Ele não é IA, e o chat mostra o selo "Modo demo" para deixar isso claro.

## O que é real e o que é simulado

| Real | Simulado |
|---|---|
| Recomendação com IA e ferramentas | Catálogo: 22 produtos com marcas e imagens fictícias |
| Regras de segurança em saúde | Checkout, entrega e pagamento por PIX |
| Cálculo de preços, totais e custo-benefício | Botão "Falar com farmacêutico" |
| Leitura da foto da embalagem | Cabeçalho e menu de categorias (inspirados no site) |
| Feed para agentes (`/api/feed`) | Regra de frete grátis |

## Rodar localmente

Requer Node 20 ou superior.

```bash
npm install
cp .env.example .env.local   # preencha as chaves
npm run dev                  # http://localhost:3000
```

| Variável | Para que serve |
|---|---|
| `GEMINI_API_KEY` | Provedor principal e único que lê fotos. Chave grátis em https://aistudio.google.com/apikey |
| `GEMINI_MODEL` | Padrão `gemini-3.5-flash-lite` |
| `GROQ_API_KEY` | Provedor reserva. Chave grátis em https://console.groq.com/keys |
| `GROQ_MODEL` | Padrão `openai/gpt-oss-120b` |

Sem nenhuma chave, o app roda em modo demonstração.

**Cotas gratuitas.** Cada mensagem do chat usa de 1 a 4 chamadas ao modelo. O plano gratuito do Gemini tem limite diário por modelo, e o do Groq limita tokens por minuto. Para uma apresentação, considere ativar o faturamento no Google AI Studio.

## Ensaio antes da apresentação

```bash
npm run smoke                                                                   # local, aceita modo demo
npm run smoke -- --url=https://intua-smart-ecommerce.vercel.app --expect-ai --delay=15
```

O script roda os fluxos da demo (whey, protetor, kit, gestante, receita, tentativa de desvio) e, com `--expect-ai`, falha se alguma resposta cair no modo demonstração. `--delay` espaça as chamadas para não esbarrar nas cotas.

Roteiro do pitch, números com fonte e respostas para a banca: [`docs/PITCH.md`](docs/PITCH.md).

## Estrutura

```
src/app/page.tsx              estado da tela: vitrine, chat e carrinho
src/app/api/chat/route.ts     validação, limite de requisições, foto e loop de ferramentas
src/app/api/feed/route.ts     feed do catálogo para agentes externos
src/lib/llm.ts                cliente dos provedores (formato OpenAI) e leitura de foto
src/lib/tools.ts              ferramentas da IA, validadas com Zod
src/lib/system-prompt.ts      persona, regras de saúde e proteção contra manipulação
src/lib/catalog.ts            catálogo, busca e métricas de custo-benefício
src/lib/demo.ts               modo demonstração (regras, sem IA)
src/components/               Header, Showcase, ProductCard, Chat, CartBar, CompareTable, ExplainModal
src/data/products.json        catálogo fictício
scripts/smoke.mjs             ensaio automático dos fluxos
docs/PITCH.md                 roteiro e material da apresentação
```

## Segurança

| Item | Situação no MVP |
|---|---|
| Chaves de API só no servidor | Implementado |
| Validação de entrada com Zod (tamanho, formato, caracteres de controle, imagem) | Implementado |
| Limite de 15 requisições por minuto por IP (em memória) | Implementado |
| IDs, preços e totais validados contra o catálogo | Implementado |
| Mensagens renderizadas como texto, sem HTML | Implementado |
| Headers HTTP: CSP em produção, HSTS, X-Frame-Options, nosniff | Implementado |
| Mitigação de prompt injection (regras no prompt, recusa de desvio, foto tratada como dado) | Implementado, sem garantia absoluta |
| Logs sem conteúdo do cliente | Implementado |
| Limite de requisições distribuído (Redis) | Próximo passo |
| Login, perfis de acesso e MFA | Próximo passo |
| Banco de dados e integração com o catálogo real (VTEX/ERP) | Próximo passo |
| Adequação à LGPD para dados de saúde | Próximo passo |

## Limitações conhecidas

- O catálogo é um JSON fictício. Integrar com o catálogo e o estoque reais da Pague Menos exige um adaptador novo.
- Não há página por produto. O link do feed aponta para a loja.
- A resposta do chat não usa streaming.
- No plano gratuito, o volume de conversas por dia é limitado pelas cotas dos provedores.
