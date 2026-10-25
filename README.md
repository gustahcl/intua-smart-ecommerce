# INTUA | Pague Menos — IA Commerce
> **Hacka Business · REC'N'PLAY 2026** | Desafio Pague Menos & Avanade  
> *Do prompt à compra: o comércio conversacional que vai além do chatbot.*

---

## 🎯 Visão Geral da Solução

A **INTUA** é uma assistente de compras inteligente com **capacidade multimodal (visão computacional)** e **orquestração de interface via Tool Calling**: o consumidor conversa por texto ou envia a foto de uma receita médica/embalagem antiga, e a INTUA descobre a necessidade, explica os ativos, compara produtos, monta kits dentro do orçamento e opera a vitrine e a cesta em tempo real.

A jornada é **ponta a ponta ("Do prompt à compra")**: da primeira dúvida até a escolha de Entrega Expressa em 2h (Omnichannel) e confirmação do pedido via PIX.

---

## 🏆 Diferenciais em Relação a um Chatbot Convencional

1. **Não é apenas uma janela de texto:** A IA opera a loja através de **Function Calling**. Ela filtra a vitrine, exibe tabelas comparativas interativas e adiciona itens à cesta diretamente.
2. **Cards clicáveis na conversa:** Os produtos recomendados aparecem como cards dentro do chat, permitindo adicionar à cesta com 1 clique direto na mensagem.
3. **Multimodalidade (Foto de Receita e Produtos):** Suporte a envio de imagens (fotos de receitas médicas ou rótulos antigos) com reconhecimento de princípios ativos e correspondência no catálogo da Pague Menos.
4. **Segurança Farmacêutica & Ética (Guardrails Anvisa):** A IA não alucina diagnósticos nem prescreve doses terapêuticas. Diante de sintomas graves, gestação, amamentação ou medicamentos tarjados, aciona o `encaminhar_farmaceutico` com botão direto de teleatendimento.
5. **Métricas Determinísticas Anti-Alucinação:** Cálculos de valor (custo por dose, preço por grama de proteína, preço por 10g) são computados matematicamente no código, nunca gerados livremente pelo LLM.
6. **Checkout Simulado Completo:** Finalização com cálculo de frete grátis, opção de Entrega Expressa em 2h ou Clique & Retire nas lojas da rede, e pagamento instantâneo por PIX.

---

## 🏗️ Arquitetura de Integração Proposta (Pague Menos)

Como a INTUA se conecta aos sistemas corporativos existentes da Pague Menos:

```
[ Cliente ] ── (Texto / Foto de Receita)
     │
     ▼
[ Camada de Interface: Next.js + INTUA Floating Widget ]
     │
     ▼
[ Orquestrador de IA Commerce (API Route / Gateway) ]
     ├── Guardrails Éticos & Anvisa (Bloqueio de automedicação)
     ├── Tool Calling Engine (LLM Groq Llama 3.3 / Gemini 2.5)
     │
     ├──▶ [ Catálogo & Preços ] ──▶ Integrador VTEX IO / SAP Commerce
     ├──▶ [ Estoque & Lojas ]  ──▶ Hub Omnichannel Pague Menos (Lojas em 2h)
     ├──▶ [ Base de Saúde ]    ──▶ Dados Abertos Anvisa (Princípios Ativos)
     └──▶ [ Handoff Humano ]   ──▶ Teleatendimento Farmacêutico (WhatsApp/Chat)
```

- **Substituição de Dados:** Toda a camada de dados em `src/lib/catalog.ts` e `src/lib/tools.ts` foi desacoplada via adaptadores tipados com Zod. Em produção, substitui-se o mock por endpoints GraphQL da VTEX e ERP da Pague Menos sem necessidade de refatorar a interface.

---

## 🚀 Como Rodar o Projeto

Requer **Node 20** ou superior.

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente (opcional para IA real)
cp .env.example .env.local

# 3. Iniciar o servidor de desenvolvimento
npm run dev
# Acesse: http://localhost:3000
```

### Modos de Execução:
- **Com `GROQ_API_KEY` ou `GEMINI_API_KEY`:** IA ativa com orquestração real de ferramentas e modelos rápidos gratuitos (`llama-3.3-70b-versatile` ou `gemini-2.5-flash`).
- **Sem chave de API:** O sistema ativa automaticamente o **Modo Demonstração** determinístico, garantindo que a banca teste todos os fluxos sem falhas de conexão.

---

## 📁 Estrutura do Código

```
src/
├── app/
│   ├── page.tsx            # Página principal, vitrine full-width e widget flutuante
│   └── api/chat/route.ts   # Endpoint de orquestração de IA e tool calling
├── components/
│   ├── Chat.tsx            # Chat multimodal com cards de produtos embutidos
│   ├── CartBar.tsx         # Modal da cesta e checkout simulado (Entrega 2h + PIX)
│   ├── ProductCard.tsx     # Cards de produtos com alinhamento rigoroso
│   ├── ProductVisual.tsx   # Renderizador de imagens de catálogo com fallback
│   ├── Showcase.tsx        # Grade de produtos responsiva (5 a 6 colunas)
│   ├── CompareTable.tsx    # Comparador visual de produtos lado a lado
│   ├── ExplainModal.tsx    # Modal de explicabilidade (XAI) "Por que a INTUA recomendou?"
│   └── Header.tsx          # Cabeçalho oficial Pague Menos
├── data/
│   └── products.json       # 22 produtos com fotografias de estúdio e ativos
└── lib/
    ├── catalog.ts          # Métricas de custo por dose/proteína e buscas
    ├── tools.ts            # Definições das ferramentas da IA (Zod schemas)
    ├── system-prompt.ts    # Guardrails de saúde, ética Anvisa e persona INTUA
    ├── demo.ts             # Roteiro de fallback determinístico para demonstração
    └── llm.ts              # Conector OpenAI-compatible para Groq e Gemini
```

---

## 🔒 Segurança e Boas Práticas

- **Sem injeção de prompt:** Prompt protegido contra comandos de jailbreak e desvio de função.
- **Validação de tipos em tempo de execução:** Todos os inputs e chamadas de ferramentas validados com **Zod**.
- **Sem alucinação de estoque e preço:** O modelo de IA nunca calcula preços de cabeça; valores e estoque são sempre injetados pelo backend.
