import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import { CATALOG, brl, formatMetric, getProduct, searchProducts } from "./catalog";
import type { CartAction, CatalogProduct, ChatResponse } from "./types";

/** Estado de interface que as ferramentas vão acumulando durante a conversa. */
export interface UiState {
  recommended: { id: number; reason: string }[];
  compare: number[];
  cartActions: CartAction[];
  suggested: string[];
  handoff: string | null;
}

export const newUi = (): UiState => ({
  recommended: [],
  compare: [],
  cartActions: [],
  suggested: [],
  handoff: null,
});

export interface ToolContext {
  cart: Map<number, number>;
  ui: UiState;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function cartSummary(cart: Map<number, number>) {
  const itens = [...cart.entries()].flatMap(([id, quantidade]) => {
    const p = getProduct(id);
    return p ? [{ id, nome: p.name, quantidade, subtotal: round2(p.price * quantidade) }] : [];
  });
  return { itens, total: round2(itens.reduce((s, i) => s + i.subtotal, 0)) };
}

const clip = (s: string, n: number) => s.replace(/\s+/g, " ").trim().slice(0, n);

/** Visão compacta do produto devolvida à IA. Preço e métricas vêm sempre do catálogo. */
function view(p: CatalogProduct) {
  return {
    id: p.id,
    nome: p.name,
    marca: p.brand,
    categoria: p.category,
    tipo: p.subcategory,
    preco: p.price,
    preco_original: p.originalPrice ?? null,
    tamanho: p.size,
    porcao: p.servingSize ?? null,
    tipos_de_pele: p.skinTypes ?? null,
    preocupacoes: p.concerns ?? null,
    fps: p.fps ?? null,
    proteina_por_porcao_g: p.proteinPerServingG ?? null,
    ativos: p.actives,
    dieta: p.diet ?? null,
    tags: p.tags,
    metricas: p.metrics.map((m) => ({ nome: m.label, valor: round2(m.value * 100) / 100, texto: formatMetric(m) })),
    avaliacao: p.rating,
    aviso: p.caution ?? null,
  };
}

/* ------------------------------- Schemas Zod ------------------------------ */

const buscarSchema = z.object({
  consulta: z.string().max(120).optional(),
  categoria: z.enum(["dermocosmetico", "suplemento"]).optional(),
  preco_max: z.number().positive().max(5000).optional(),
  tipo_pele: z.enum(["oleosa", "seca", "mista", "normal", "sensivel"]).optional(),
  preocupacao: z.string().max(60).optional(),
  dieta: z.enum(["vegano", "sem lactose", "baixo teor de lactose"]).optional(),
  ordenar_por: z
    .enum(["relevancia", "preco_asc", "preco_desc", "avaliacao", "custo_beneficio"])
    .optional(),
  limite: z.number().int().min(1).max(8).optional(),
});

const recomendarSchema = z.object({
  recomendacoes: z
    .array(z.object({ produto_id: z.number().int(), motivo: z.string().min(1).max(400) }))
    .min(1)
    .max(6),
  acoes_sugeridas: z.array(z.string().max(60)).max(4).optional(),
  orcamento_max: z.number().positive().max(5000).optional(),
});

const compararSchema = z.object({
  produto_ids: z.array(z.number().int()).min(2).max(3),
});

const carrinhoSchema = z.object({
  acao: z.enum(["adicionar", "remover", "definir_quantidade", "limpar"]),
  produto_id: z.number().int().optional(),
  quantidade: z.number().int().min(0).max(20).optional(),
});

const farmaceuticoSchema = z.object({
  motivo: z.string().min(1).max(300),
});

/* ----------------------------- Definição p/ Claude ------------------------ */

export const TOOLS: Anthropic.Tool[] = [
  {
    name: "buscar_produtos",
    description:
      "Busca produtos no catálogo da loja (dermocosméticos e suplementos). Use SEMPRE antes de recomendar. Devolve preço, ativos, métricas de custo-benefício e avisos reais do catálogo.",
    input_schema: {
      type: "object",
      properties: {
        consulta: { type: "string", description: "Palavras-chave livres, ex: 'whey', 'protetor', 'niacinamida'." },
        categoria: { type: "string", enum: ["dermocosmetico", "suplemento"] },
        preco_max: { type: "number", description: "Preço máximo em reais de um item." },
        tipo_pele: { type: "string", enum: ["oleosa", "seca", "mista", "normal", "sensivel"] },
        preocupacao: { type: "string", description: "Ex: 'acne', 'manchas', 'hidratacao', 'oleosidade', 'protecao solar', 'massa muscular'." },
        dieta: { type: "string", enum: ["vegano", "sem lactose", "baixo teor de lactose"] },
        ordenar_por: {
          type: "string",
          enum: ["relevancia", "preco_asc", "preco_desc", "avaliacao", "custo_beneficio"],
        },
        limite: { type: "integer", description: "Máximo de itens (1 a 8). Padrão 6." },
      },
    },
  },
  {
    name: "recomendar_produtos",
    description:
      "Exibe na vitrine os produtos escolhidos e registra o motivo de cada um. Chame sempre que sugerir produtos ao cliente. Devolve o total real e se cabe no orçamento.",
    input_schema: {
      type: "object",
      properties: {
        recomendacoes: {
          type: "array",
          minItems: 1,
          maxItems: 6,
          items: {
            type: "object",
            properties: {
              produto_id: { type: "integer" },
              motivo: {
                type: "string",
                description:
                  "1 ou 2 frases ligando a necessidade que o cliente disse a atributos reais do produto (ativos, FPS, proteína por porção, preço por dose). Sem promessas de resultado.",
              },
            },
            required: ["produto_id", "motivo"],
          },
        },
        acoes_sugeridas: {
          type: "array",
          maxItems: 4,
          items: { type: "string" },
          description: "Respostas rápidas curtas (até 6 palavras) que o cliente pode tocar em seguida.",
        },
        orcamento_max: { type: "number", description: "Orçamento total informado pelo cliente, se houver." },
      },
      required: ["recomendacoes"],
    },
  },
  {
    name: "comparar_produtos",
    description: "Abre uma tabela comparativa lado a lado (2 ou 3 produtos) na vitrine.",
    input_schema: {
      type: "object",
      properties: { produto_ids: { type: "array", minItems: 2, maxItems: 3, items: { type: "integer" } } },
      required: ["produto_ids"],
    },
  },
  {
    name: "atualizar_carrinho",
    description:
      "Altera o carrinho. Use SOMENTE quando o cliente pedir explicitamente (adicionar, trocar, remover, ajustar quantidade). Para trocar um item, remova um e adicione outro.",
    input_schema: {
      type: "object",
      properties: {
        acao: { type: "string", enum: ["adicionar", "remover", "definir_quantidade", "limpar"] },
        produto_id: { type: "integer" },
        quantidade: { type: "integer", description: "Para 'adicionar' (padrão 1) e 'definir_quantidade'." },
      },
      required: ["acao"],
    },
  },
  {
    name: "encaminhar_farmaceutico",
    description:
      "Sinaliza que o cliente deve falar com um farmacêutico (gestante/lactante, bebê, uso de medicamentos, condição de saúde, sintomas, lesões de pele). Mostra um aviso e o botão de atendimento.",
    input_schema: {
      type: "object",
      properties: { motivo: { type: "string", description: "Motivo em 1 frase, sem dados pessoais." } },
      required: ["motivo"],
    },
  },
];

/* -------------------------------- Execução -------------------------------- */

export function runTool(name: string, input: unknown, ctx: ToolContext): unknown {
  switch (name) {
    case "buscar_produtos": {
      const a = buscarSchema.safeParse(input);
      if (!a.success) return { erro: "Parâmetros inválidos." };
      const found = searchProducts({
        query: a.data.consulta,
        category: a.data.categoria,
        maxPrice: a.data.preco_max,
        skinType: a.data.tipo_pele,
        concern: a.data.preocupacao,
        diet: a.data.dieta,
        sortBy: a.data.ordenar_por,
        limit: a.data.limite,
      });
      return { total_encontrado: found.length, produtos: found.map(view) };
    }

    case "recomendar_produtos": {
      const a = recomendarSchema.safeParse(input);
      if (!a.success) return { erro: "Parâmetros inválidos." };
      const seen = new Set<number>();
      const itens: { id: number; nome: string; preco: number }[] = [];
      const invalid: number[] = [];
      const recommended: UiState["recommended"] = [];
      for (const r of a.data.recomendacoes) {
        const p = getProduct(r.produto_id);
        if (!p) {
          invalid.push(r.produto_id);
          continue;
        }
        if (seen.has(p.id)) continue;
        seen.add(p.id);
        recommended.push({ id: p.id, reason: clip(r.motivo, 320) });
        itens.push({ id: p.id, nome: p.name, preco: p.price });
      }
      if (recommended.length > 0) ctx.ui.recommended = recommended;
      if (a.data.acoes_sugeridas) {
        ctx.ui.suggested = a.data.acoes_sugeridas.map((s) => clip(s, 40)).filter(Boolean).slice(0, 4);
      }
      const total = round2(itens.reduce((s, i) => s + i.preco, 0));
      return {
        exibidos: itens,
        ids_invalidos: invalid,
        total_se_levar_todos: total,
        total_formatado: brl(total),
        dentro_do_orcamento: a.data.orcamento_max === undefined ? null : total <= a.data.orcamento_max,
      };
    }

    case "comparar_produtos": {
      const a = compararSchema.safeParse(input);
      if (!a.success) return { erro: "Informe de 2 a 3 produtos." };
      const items = [...new Set(a.data.produto_ids)].map(getProduct).filter((p): p is CatalogProduct => !!p);
      if (items.length < 2) return { erro: "Produtos não encontrados no catálogo." };
      ctx.ui.compare = items.map((p) => p.id);
      return { comparacao: items.map(view) };
    }

    case "atualizar_carrinho": {
      const a = carrinhoSchema.safeParse(input);
      if (!a.success) return { erro: "Parâmetros inválidos." };
      const { acao, produto_id, quantidade } = a.data;
      if (acao === "limpar") {
        ctx.cart.clear();
        ctx.ui.cartActions.push({ type: "clear" });
        return { ok: true, carrinho: cartSummary(ctx.cart) };
      }
      const p = produto_id === undefined ? undefined : getProduct(produto_id);
      if (!p) return { erro: "Produto não encontrado no catálogo." };
      const current = ctx.cart.get(p.id) ?? 0;
      if (acao === "adicionar") {
        const qty = Math.min(20, current + Math.max(1, quantidade ?? 1));
        ctx.cart.set(p.id, qty);
        ctx.ui.cartActions.push({ type: "set", productId: p.id, quantity: qty });
      } else if (acao === "remover") {
        ctx.cart.delete(p.id);
        ctx.ui.cartActions.push({ type: "remove", productId: p.id });
      } else {
        const qty = quantidade ?? 1;
        if (qty <= 0) {
          ctx.cart.delete(p.id);
          ctx.ui.cartActions.push({ type: "remove", productId: p.id });
        } else {
          ctx.cart.set(p.id, qty);
          ctx.ui.cartActions.push({ type: "set", productId: p.id, quantity: qty });
        }
      }
      return { ok: true, carrinho: cartSummary(ctx.cart) };
    }

    case "encaminhar_farmaceutico": {
      const a = farmaceuticoSchema.safeParse(input);
      if (!a.success) return { erro: "Parâmetros inválidos." };
      ctx.ui.handoff = clip(a.data.motivo, 200);
      return { ok: true };
    }

    default:
      return { erro: `Ferramenta desconhecida: ${name}` };
  }
}

/** Monta a resposta final enviada ao front (contrato da rota /api/chat). */
export function toResponse(mode: ChatResponse["mode"], message: string, ui: UiState): ChatResponse {
  const reasons: Record<number, string> = {};
  for (const r of ui.recommended) reasons[r.id] = r.reason;
  return {
    mode,
    message: message.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, 1500),
    recommendedProductIds: ui.recommended.map((r) => r.id),
    reasons,
    compareProductIds: ui.compare,
    cartActions: ui.cartActions,
    suggestedActions: ui.suggested,
    pharmacistHandoff: ui.handoff,
  };
}

export const CATALOG_SIZE = CATALOG.length;
