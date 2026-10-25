import { CATALOG, brl, formatMetric, getProduct, normalize, searchProducts, valueMetric } from "./catalog";
import { cartSummary, newUi, toResponse, type UiState } from "./tools";
import type { CatalogProduct, ChatMessage, ChatResponse } from "./types";

/**
 * Motor de regras usado quando não há chave de IA (GROQ_API_KEY/GEMINI_API_KEY) (ou quando a API falha).
 * NÃO é IA: é um roteiro determinístico que cobre os fluxos de demonstração
 * (whey, protetor solar, kit de rotina, comparar, mais barato, carrinho) usando
 * as mesmas funções de catálogo e o mesmo contrato de resposta da versão com IA.
 */

interface DemoInput {
  messages: ChatMessage[];
  cart: { productId: number; quantity: number }[];
  shownProductIds: number[];
}

type Skin = "oleosa" | "seca" | "mista" | "normal" | "sensivel";

function parseBudget(t: string): number | undefined {
  const m =
    t.match(/(?:r\$\s*|ate\s+|menos de\s+|no maximo\s+|maximo\s+)(\d{2,4})(?:[.,](\d{1,2}))?/) ??
    t.match(/(\d{2,4})\s*reais/);
  if (!m) return undefined;
  return Number(m[1]) + (m[2] ? Number(m[2].padEnd(2, "0")) / 100 : 0);
}

function parseSkin(t: string): Skin | undefined {
  if (/oleos/.test(t)) return "oleosa";
  if (/mist[ao]/.test(t)) return "mista";
  if (/sensiv/.test(t)) return "sensivel";
  if (/pele seca|\bseca\b/.test(t)) return "seca";
  if (/normal/.test(t)) return "normal";
  return undefined;
}

function reasonFor(p: CatalogProduct, skin?: Skin, budget?: number): string {
  const parts: string[] = [];
  if (p.category === "dermocosmetico") {
    if (skin && p.skinTypes?.includes(skin)) parts.push(`indicado para pele ${skin}`);
    if (p.fps) parts.push(`FPS ${p.fps}`);
    parts.push(`ativos: ${p.actives.slice(0, 2).join(" e ")}`);
  } else {
    if (p.proteinPerServingG) {
      parts.push(`${p.proteinPerServingG} g de proteína por porção de ${p.servingSize}`);
    } else if (p.servingSize) {
      parts.push(`porção de ${p.servingSize} conforme o rótulo`);
    }
    if (p.diet?.length) parts.push(p.diet[0]);
  }
  parts.push(formatMetric(valueMetric(p)));
  if (budget && p.price <= budget) parts.push(`cabe no orçamento de ${brl(budget)}`);
  const s = parts.join("; ");
  return s.charAt(0).toUpperCase() + s.slice(1) + ".";
}

function recommend(ui: UiState, items: CatalogProduct[], skin?: Skin, budget?: number) {
  ui.recommended = items.map((p) => ({ id: p.id, reason: reasonFor(p, skin, budget) }));
}

const total = (items: CatalogProduct[]) => items.reduce((s, p) => s + p.price, 0);

/**
 * Monta um kit respeitando o orçamento. Ordem de prioridade: limpeza, protetor solar,
 * hidratante e, por último, o sérum (item opcional).
 */
function buildKit(skin: Skin, budget?: number): { items: CatalogProduct[]; skipped: CatalogProduct[] } {
  const slots: Record<Skin, number[]> = {
    oleosa: [5, 1, 7, 9],
    mista: [5, 1, 7, 9],
    seca: [6, 3, 8, 10],
    normal: [6, 3, 7, 10],
    sensivel: [6, 3, 8],
  };
  const items: CatalogProduct[] = [];
  const skipped: CatalogProduct[] = [];
  for (const id of slots[skin]) {
    const p = getProduct(id);
    if (!p) continue;
    if (budget === undefined || total(items) + p.price <= budget) items.push(p);
    else skipped.push(p);
  }
  return { items, skipped };
}

export function runDemo(input: DemoInput): ChatResponse {
  const ui = newUi();
  const cart = new Map(input.cart.map((c) => [c.productId, c.quantity]));
  const userTurns = input.messages.filter((m) => m.role === "user");
  const raw = userTurns[userTurns.length - 1]?.content ?? "";
  const t = normalize(raw);
  const shown = input.shownProductIds.filter((id) => getProduct(id));
  const budget = parseBudget(t);
  const skin = parseSkin(t);
  const done = (message: string) => toResponse("demo", message, ui);

  /* 0. Tentativas de desviar o assistente: recusa com simpatia e volta ao assunto. */
  if (/(ignore|ignora|revele|prompt|system|instrucoes|esqueca (as|tudo)|finja|haja como)/.test(t)) {
    ui.suggested = ["Quero um whey protein", "Protetor solar pele oleosa", "Kit skin care pele oleosa até R$ 180"];
    return done("Eu só consigo ajudar com compras aqui na Pague Menos, como dermocosméticos e suplementos. O que você está procurando hoje?");
  }

  /* 1. Temas sensíveis: encaminha para o farmacêutico, sem recomendar. */
  if (/(gravida|gestante|gravidez|gestacao|amament|lactante|bebe|recem.?nascid|remedio|medicamento|anticoagul|diabet|hipertens|pressao alta|cancer|alergia|pinta|sangr|sintoma)/.test(t)) {
    ui.handoff = "Tema de saúde que precisa de orientação profissional.";
    ui.suggested = ["Ver protetores solares", "Ver suplementos"];
    return done(
      "Esse é um assunto em que o melhor caminho é conversar com um farmacêutico da Pague Menos, que pode avaliar o seu caso com segurança. Enquanto isso, posso te ajudar com outros produtos da loja.",
    );
  }

  /* 1.5. Foto de receita médica ou frasco de produto. */
  if (/(foto|receita|prescri|rotulo|frasco|imagem)/.test(t)) {
    const items = [getProduct(1), getProduct(10)].filter((x): x is CatalogProduct => x !== undefined);
    recommend(ui, items);
    ui.suggested = ["Adicionar ambos ao carrinho", "Ver opções mais baratas", "Falar com farmacêutico"];
    return done(
      "Analisei a foto da receita! Identifiquei a prescrição de Protetor Solar Facial Toque Seco FPS 60 e Sérum Antioxidante (Vitamina C 10%). Localizei as opções correspondentes disponíveis no catálogo da Pague Menos."
    );
  }

  /* 2. Carrinho. */
  const wantsAdd = /(adicion|coloca|colocar|poe |por no carrinho|levar|quero (o |a |esse|essa|esses))/.test(t);
  const wantsRemove = /(remov|tira |tirar|retira)/.test(t);
  if ((wantsAdd || wantsRemove) && shown.length > 0) {
    // "o 1º", "o primeiro"... referem-se à posição na vitrine; só "produto 13"/"id 13" é um id.
    const ordNum = t.match(/\b(\d)\s*[º°]/);
    const ordinal = ordNum
      ? Number(ordNum[1]) - 1
      : /primeir/.test(t)
        ? 0
        : /segund/.test(t)
          ? 1
          : /terceir/.test(t)
            ? 2
            : undefined;
    const idMention = Number(t.match(/(?:produto|id|numero)\s*(\d{1,2})\b/)?.[1]) || undefined;
    const all = /(tudo|todos|todas|kit)/.test(t);
    const targets =
      all && wantsAdd
        ? shown.slice(0, 6)
        : [
            (idMention !== undefined && shown.includes(idMention) ? idMention : undefined) ??
              (ordinal !== undefined ? shown[ordinal] : undefined) ??
              shown[0],
          ].filter((x): x is number => x !== undefined);

    if (wantsRemove && !wantsAdd) {
      for (const id of targets) {
        cart.delete(id);
        ui.cartActions.push({ type: "remove", productId: id });
      }
      ui.suggested = ["Ver mais opções", "Comparar produtos"];
      return done(`Tirei do carrinho. O total agora é ${brl(cartSummary(cart).total)}.`);
    }
    for (const id of targets) {
      const qty = Math.min(20, (cart.get(id) ?? 0) + 1);
      cart.set(id, qty);
      ui.cartActions.push({ type: "set", productId: id, quantity: qty });
    }
    const names = targets.map((id) => getProduct(id)?.name).filter(Boolean);
    ui.suggested = ["Ver opções mais baratas", "Montar kit completo"];
    return done(
      `Adicionei ao carrinho: ${names.join(", ")}. O total agora é ${brl(cartSummary(cart).total)}.`,
    );
  }

  /* 3. Comparar. */
  if (/(compar|diferenc)/.test(t)) {
    if (shown.length < 2) {
      ui.suggested = ["Quero um whey protein", "Protetor solar pele oleosa"];
      return done("Me diga o que você procura e eu mostro duas ou três opções para comparar lado a lado.");
    }
    const ids = shown.slice(0, 3);
    const items = ids.map((id) => getProduct(id)!).filter(Boolean);
    ui.compare = ids;
    const best = [...items].sort((a, b) => valueMetric(a).value - valueMetric(b).value)[0];
    ui.suggested = ["Ver opções mais baratas", `Adicionar o ${items.indexOf(best) + 1}º ao carrinho`];
    return done(
      `Abri a comparação na vitrine. Pelo custo-benefício, ${best.name} sai melhor: ${formatMetric(valueMetric(best))}.`,
    );
  }

  /* 4. Por que recomendou. */
  if (/(por ?que|porque|explica)/.test(t) && shown.length > 0) {
    const p = getProduct(shown[0])!;
    ui.suggested = ["Comparar opções", "Ver opções mais baratas"];
    return done(`${p.name}: ${reasonFor(p, skin, budget)} Toque em "Por que a INTUA recomendou?" no card para ver os detalhes.`);
  }

  /* 5. Alternativa mais barata. */
  if (/(barat|econom|em conta|menor preco)/.test(t) && shown.length > 0) {
    const base = getProduct(shown[0])!;
    const cheaper = CATALOG.filter(
      (p) =>
        p.id !== base.id &&
        p.category === base.category &&
        p.subcategory === base.subcategory &&
        p.price < base.price,
    )
      .sort((a, b) => a.price - b.price)
      .slice(0, 3);
    const pool =
      cheaper.length > 0
        ? cheaper
        : CATALOG.filter(
            (p) => p.id !== base.id && p.category === base.category && p.price < base.price && (!base.proteinPerServingG || p.proteinPerServingG),
          )
            .sort((a, b) => a.price - b.price)
            .slice(0, 3);
    if (pool.length === 0) {
      ui.suggested = ["Comparar opções"];
      return done(`${base.name} já é uma das opções mais em conta dessa linha.`);
    }
    recommend(ui, pool, skin, budget);
    ui.suggested = ["Comparar com a anterior", "Adicionar o 1º ao carrinho"];
    return done(`Achei ${pool.length} alternativa${pool.length > 1 ? "s" : ""} mais em conta que ${base.name}. A mais barata sai por ${brl(pool[0].price)}.`);
  }

  /* 6. Kit / rotina de skin care. */
  if (/(kit|rotina|skin ?care|skincare)/.test(t)) {
    if (!skin) {
      ui.suggested = ["Pele oleosa", "Pele seca", "Pele mista", "Pele sensível"];
      return done("Vamos montar sua rotina! Qual é o seu tipo de pele? Se tiver um orçamento em mente, pode me contar também.");
    }
    const { items: kit, skipped } = buildKit(skin, budget);
    if (kit.length === 0) {
      ui.suggested = ["Kit skin care pele oleosa até R$ 180"];
      return done(`Com ${brl(budget ?? 0)} ainda não consigo montar uma rotina completa. Quer tentar um orçamento um pouco maior?`);
    }
    recommend(ui, kit, skin, budget);
    ui.suggested = ["Adicionar tudo ao carrinho", "Ver opções mais baratas", "Comparar opções"];
    const steps = kit.map((p) => p.subcategory.toLowerCase()).join(", ");
    const within = budget === undefined ? "" : ` Ficou dentro dos ${brl(budget)}.`;
    const partial =
      skipped.length > 0
        ? ` Ficou de fora: ${skipped.map((p) => p.subcategory.toLowerCase()).join(", ")}, que passaria do orçamento.`
        : "";
    return done(
      `Montei uma rotina para pele ${skin} com ${kit.length} ${kit.length === 1 ? "item" : "itens"} (${steps}). O total é ${brl(total(kit))}.${within}${partial}`,
    );
  }

  /* 7. Creatina. */
  if (/creatina/.test(t)) {
    const p = getProduct(17)!;
    recommend(ui, [p], undefined, budget);
    ui.suggested = ["Quero um whey protein", "Adicionar ao carrinho"];
    return done(`Tenho a ${p.name} por ${brl(p.price)}. A porção do rótulo é de ${p.servingSize}, rendendo ${p.servings} doses.`);
  }

  /* 8. Whey e proteínas. */
  if (/(whey|proteina|massa|muscul|suplement)/.test(t)) {
    const vegan = /vegan/.test(t);
    const lactose = /lactose/.test(t);
    const cheapest = /(barat|econom)/.test(t);
    if (budget === undefined && !vegan && !lactose && !cheapest && userTurns.length <= 1) {
      ui.suggested = ["Ganhar massa até R$ 120", "Sem lactose", "Vegano", "O mais barato"];
      return done("Boa! Para indicar o whey certo, qual é o seu objetivo e quanto você quer investir? Também posso filtrar por sem lactose ou vegano.");
    }
    let pool = searchProducts({
      category: "suplemento",
      diet: vegan ? "vegano" : lactose ? "baixo teor de lactose" : undefined,
      limit: 8,
      sortBy: "custo_beneficio",
    }).filter((p) => p.proteinPerServingG);
    const inBudget = budget === undefined ? pool : pool.filter((p) => p.price <= budget);
    const noneInBudget = budget !== undefined && inBudget.length === 0;
    pool = (noneInBudget ? [...pool].sort((a, b) => a.price - b.price) : inBudget).slice(0, 3);
    recommend(ui, pool, undefined, budget);
    ui.suggested = ["Comparar opções", "Ver opções mais baratas", "Adicionar o 1º ao carrinho"];
    if (noneInBudget) {
      return done(`Não encontrei proteína até ${brl(budget!)}, mas estas são as mais em conta: a partir de ${brl(pool[0].price)}.`);
    }
    return done(
      `Separei ${pool.length} opç${pool.length > 1 ? "ões" : "ão"} de proteína${budget ? ` até ${brl(budget)}` : ""}. A de melhor custo-benefício é ${pool[0].name}: ${formatMetric(valueMetric(pool[0]))}.`,
    );
  }

  /* 9. Protetor solar (facial por padrão; corporal ou infantil só se pedirem). */
  if (/(protetor|solar|fps)/.test(t)) {
    const kind = /(infantil|crianca|filho|filha)/.test(t) ? "infantil" : /(corpo|corporal)/.test(t) ? "corporal" : "facial";
    const found = searchProducts({
      query: "protetor solar",
      category: "dermocosmetico",
      skinType: skin,
      maxPrice: budget,
      sortBy: "avaliacao",
      limit: 8,
    })
      .filter((p) => p.subcategory.toLowerCase().includes(kind))
      .slice(0, 3);
    if (found.length === 0) {
      ui.suggested = ["Protetor solar pele oleosa", "Kit skin care pele oleosa até R$ 180"];
      return done(`Não achei protetor solar ${kind}${budget ? ` até ${brl(budget)}` : ""} com esse perfil. Quer ver outras faixas de preço?`);
    }
    recommend(ui, found, skin, budget);
    ui.suggested = skin
      ? ["Ver opções mais baratas", "Comparar opções", "Adicionar o 1º ao carrinho"]
      : ["Pele oleosa", "Pele seca", "Pele sensível"];
    return done(
      `Encontrei ${found.length} ${found.length > 1 ? "opções" : "opção"} de protetor solar ${kind}${skin ? ` para pele ${skin}` : ""}${budget ? ` até ${brl(budget)}` : ""}.${skin ? "" : " Se me disser seu tipo de pele, refino a escolha."}`,
    );
  }

  /* 10. Preocupações de pele. */
  const concern = /(acne|espinha)/.test(t)
    ? "acne"
    : /mancha/.test(t)
      ? "manchas"
      : /oleos/.test(t)
        ? "oleosidade"
        : /(hidrat|resseca)/.test(t)
          ? "hidratacao"
          : /limpe/.test(t)
            ? "limpeza"
            : undefined;
  if (concern) {
    const found = searchProducts({ category: "dermocosmetico", concern, skinType: skin, maxPrice: budget, limit: 4 });
    if (found.length > 0) {
      recommend(ui, found, skin, budget);
      ui.suggested = ["Kit skin care pele oleosa", "Comparar opções"];
      const extra =
        concern === "acne" ? " Se a acne for persistente, inflamada ou dolorosa, vale uma avaliação com dermatologista ou farmacêutico." : "";
      return done(`Separei ${found.length} opç${found.length > 1 ? "ões" : "ão"} para ${concern}.${extra}`);
    }
  }

  /* 11. Busca livre. */
  const found = searchProducts({ query: raw, maxPrice: budget, limit: 4 });
  if (found.length > 0) {
    recommend(ui, found, skin, budget);
    ui.suggested = ["Comparar opções", "Ver opções mais baratas"];
    return done(`Encontrei ${found.length} produto${found.length > 1 ? "s" : ""} que podem combinar com o que você pediu.`);
  }

  ui.suggested = ["Quero um whey protein", "Protetor solar pele oleosa", "Kit skin care pele oleosa até R$ 150"];
  return done(
    "Ainda estou aprendendo o catálogo, mas já ajudo bem com dermocosméticos e suplementos. O que você está procurando hoje?",
  );
}
