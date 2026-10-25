# Pitch da INTUA

Roteiro para a apresentação, números com fonte, perguntas difíceis da banca e checklist de ensaio.

## A tese em uma frase

O cliente da farmácia sabe o que precisa, mas não sabe o nome do que precisa. A INTUA transforma a necessidade em carrinho, dentro da loja da Pague Menos e, no próximo passo, dentro do ChatGPT e do Gemini.

## Roteiro (5 minutos)

| Tempo | O que falar | O que mostrar |
|---|---|---|
| 0:00 a 0:40 | **Problema.** Em dermocosméticos e suplementos o cliente trava na escolha: não domina ativos, FPS, proteína por porção. E cada vez mais gente começa a compra fora do site, perguntando para uma IA. | Slide com os números de uso de IA (abaixo). |
| 0:40 a 1:00 | **Não é mais um chatbot.** A INTUA não fica num canto da tela: ela reorganiza a loja. | A barra "Busca inteligente INTUA" no topo da vitrine. |
| 1:00 a 3:00 | **Demo.** Três pedidos reais, sem nome técnico. | Fluxos 1, 2 e 3 do roteiro de demonstração. |
| 3:00 a 3:40 | **Confiança.** A IA só escolhe; preço e fórmula vêm do catálogo. Saúde vai para o farmacêutico. | "Por que a INTUA recomendou?" e o fluxo da gestante. |
| 3:40 a 4:20 | **Fora do site.** O mesmo catálogo vira um feed para agentes externos. | Abrir `/api/feed` no navegador. |
| 4:20 a 5:00 | **Negócio e próximos passos.** Onde isso mexe no resultado e o que falta para produção. | Slide de métricas e roadmap. |

## Roteiro de demonstração

Antes de subir no palco, rode `npm run smoke -- --url=<endereço da demo> --expect-ai`.

1. **Barra de intenção:** digitar "Protetor solar para pele oleosa até R$ 80". O chat abre ao lado e a vitrine se reorganiza com "Escolhas da INTUA para ...".
2. **Explicabilidade:** clicar em "Por que a INTUA recomendou?" num card. Mostrar que FPS, ativos e custo por 10 g vêm do catálogo.
3. **Kit no orçamento:** "Kit skin care pele oleosa até R$ 180" → "Adicionar tudo ao carrinho" → abrir a cesta e mostrar a barra de frete grátis e o checkout com PIX (simulado).
4. **Foto da embalagem** (só com a chave do Gemini): "acabou o meu, quero esse" com a foto de um frasco. Ensaiar com o mesmo frasco que será usado ao vivo.
5. **Segurança:** "Estou grávida, posso tomar ômega 3?" → a INTUA não recomenda e oferece o farmacêutico.

## Números para os slides

Use exatamente como está, com a fonte no rodapé do slide. Confira os da Pague Menos no release oficial do 4T25 antes de apresentar.

| Número | Fonte |
|---|---|
| 40% dos consumidores brasileiros já usam IA generativa (ChatGPT, Gemini) para buscar informações de produtos que querem comprar | Talk, "Inteligência Artificial na Vida Real 2025", via [Gironews](https://gironews.com/negocios/40-dos-consumidores-brasileiros-ja-utilizam-ia-para-buscar-informacoes-sobre-produtos/) |
| 52% dos brasileiros usaram ChatGPT ou outro assistente de IA para ajudar nas compras nos últimos 12 meses | Adyen, Relatório do Varejo 2025, via [InfoMoney](https://www.infomoney.com.br/consumo/mais-metade-consumidores-usa-ia-compras/) |
| Nos EUA, visitas vindas de IA ao varejo cresceram 693% no fim de ano de 2025 e converteram 31% mais que outras origens | [Adobe](https://business.adobe.com/blog/ai-driven-traffic-surges-across-industries) (dado dos EUA, não do Brasil) |
| 70,22% é a taxa média documentada de abandono de carrinho | [Baymard Institute](https://baymard.com/lists/cart-abandonment-rate) |
| Pague Menos: canais digitais com R$ 3,1 bilhões em 2025 (+55% no ano) e 21% da receita no 4T25; 1.689 lojas | [Gironews](https://gironews.com/farma-cosmeticos/venda-do-canais-digitais-da-pague-menos-registra-alta-de-568-na-comparacao-anual/) e [Nosso Meio](https://nossomeio.com.br/pague-menos-fecha-2025-com-lucro-recorde-e-avanco-de-198-no-4o-trimestre/) |

**Como usar:** o digital já é 1 em cada 5 reais da Pague Menos e cresce rápido. Um ganho pequeno de conversão ou de ticket nesse canal vale muito. Não prometa um percentual de ganho da INTUA: diga o que vocês mediriam num piloto.

### O que medir num piloto (métricas que a banca vai querer ouvir)

- **Conversão** de sessões que usam a INTUA contra as que não usam (teste A/B).
- **Ticket médio:** o kit dentro do orçamento leva mais de um item ao carrinho.
- **Abandono por indecisão:** sessões que viram categoria e saíram sem adicionar nada.
- **Custo por conversa** contra a margem do pedido.
- **Encaminhamentos ao farmacêutico:** quantos casos de saúde a INTUA desviou com segurança.

## Perguntas difíceis da banca (e respostas honestas)

**"Isso não é só um chatbot?"**
Não. A conversa é a entrada; a saída é a loja reorganizada, a explicação no card, o comparador, o kit dentro do orçamento e o carrinho preenchido. E o cliente pode nem abrir o chat: a barra de intenção fica na vitrine.

**"E se a IA inventar um produto ou um preço?"**
Ela não consegue. A IA só devolve IDs e o motivo; preço, ativos e totais são calculados no servidor a partir do catálogo, e IDs que não existem são descartados.

**"Vocês leem receita médica?"**
Não, de propósito. Receita é com o farmacêutico. Se o cliente manda a foto de uma receita, a INTUA reconhece e encaminha. A foto serve para embalagem de produto.

**"Quanto custa rodar isso?"**
Hoje roda em planos gratuitos (Groq e Gemini). Em produção, o custo por conversa precisa ser comparado com a margem do pedido; é uma das métricas do piloto.

**"O que é de verdade e o que é simulado?"**
De verdade: o motor de recomendação com ferramentas, as regras de segurança, o cálculo de preços e custo-benefício, a leitura de foto e o feed. Simulado: o catálogo (marcas fictícias), o checkout e o PIX, e o botão do farmacêutico.

**"E o ChatGPT e o Gemini?"**
O endpoint `/api/feed` mostra o caminho: o mesmo catálogo e as mesmas regras viram dados para agentes externos. Os protocolos de comércio da OpenAI e do Google ainda estão em expansão e a disponibilidade no Brasil não está confirmada; não afirmem que a Pague Menos já vende dentro do ChatGPT.

**"LGPD?"**
O MVP não tem login, não guarda conversas nem fotos e os logs não registram o conteúdo do cliente. Em produção: consentimento, retenção mínima e dados de saúde tratados como sensíveis.

## Checklist de ensaio

- [ ] Chave do Gemini (e do Groq, se usarem) configurada no ambiente da demo, não só no PC de alguém.
- [ ] `npm run smoke -- --url=<endereço da demo> --expect-ai` passando, sem nenhuma resposta em "modo demo".
- [ ] Foto de embalagem testada ao vivo com o mesmo frasco da apresentação.
- [ ] **Vídeo de backup** gravado com os 5 passos do roteiro, para o caso de a internet ou a cota da IA falharem.
- [ ] Limite da rota: 15 mensagens por minuto por IP. Não ensaiem em rajada logo antes de entrar.
- [ ] **Cota gratuita das IAs.** Cada mensagem do chat usa de 1 a 4 chamadas ao modelo. O `gemini-3.5-flash` gratuito só permite 20 chamadas por dia, por isso o padrão é o `gemini-3.5-flash-lite`, que tem cota própria. O Groq gratuito limita 8 mil tokens por minuto. No dia da apresentação, não gastem a cota ensaiando de manhã; se possível, ativem o faturamento no Google AI Studio (o nível pago tem limites muito maiores). Para ensaiar sem estourar o limite: `npm run smoke -- --expect-ai --delay=15`.
- [ ] Navegador em tela cheia, zoom em 100%, carrinho vazio, aba recém-aberta.
- [ ] Quem fala e quem clica definidos; cada um sabe a resposta das perguntas difíceis acima.
