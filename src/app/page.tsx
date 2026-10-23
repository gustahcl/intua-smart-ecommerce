"use client";

import { MessageCircle, ShoppingCart, Store } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { CartBar } from "@/components/CartBar";
import { Chat, type UiMessage } from "@/components/Chat";
import { ExplainModal } from "@/components/ExplainModal";
import { Header } from "@/components/Header";
import { Showcase, type CategoryFilter } from "@/components/Showcase";
import { applyCartActions, cartCount, cartTotal, type Cart } from "@/lib/cart";
import { cx } from "@/lib/cx";
import type { ChatResponse } from "@/lib/types";

const WELCOME: UiMessage = {
  id: 0,
  role: "assistant",
  content:
    "Oi! Eu sou a INTUA, sua assistente de compras. Me conta o que você procura, como um whey, um protetor solar ou uma rotina de skin care, e eu ajudo a encontrar, comparar e escolher.",
};

type Tab = "chat" | "shop";

export default function Home() {
  const [messages, setMessages] = useState<UiMessage[]>([WELCOME]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"ai" | "demo" | null>(null);
  const [suggested, setSuggested] = useState<string[]>([]);
  const [handoff, setHandoff] = useState<string | null>(null);

  const [recommended, setRecommended] = useState<{ id: number; reason: string }[]>([]);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [cart, setCart] = useState<Cart>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutNote, setCheckoutNote] = useState(false);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("todos");
  const [explainId, setExplainId] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("chat");

  const nextId = useRef(1);

  const send = useCallback(
    async (text: string) => {
      const clean = text.trim().slice(0, 500);
      if (!clean || loading) return;

      const userMsg: UiMessage = { id: nextId.current++, role: "user", content: clean };
      setMessages((m) => [...m, userMsg]);
      setLoading(true);
      setHandoff(null);
      setSuggested([]);

      const history = [...messages, userMsg]
        .slice(-12)
        .map(({ role, content }) => ({ role, content }));

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history,
            cart: Object.entries(cart).map(([id, quantity]) => ({ productId: Number(id), quantity })),
            shownProductIds: recommended.map((r) => r.id),
          }),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error ?? "Não consegui responder agora.");
        }
        const data = (await res.json()) as ChatResponse;

        setMode(data.mode);
        if (data.recommendedProductIds.length > 0) {
          setRecommended(data.recommendedProductIds.map((id) => ({ id, reason: data.reasons[id] ?? "" })));
          setCategory("todos");
          setQuery("");
        }
        if (data.compareProductIds.length >= 2) setCompareIds(data.compareProductIds);
        if (data.cartActions.length > 0) {
          setCart((c) => applyCartActions(c, data.cartActions));
          setCartOpen(true);
        }
        setSuggested(data.suggestedActions);
        setHandoff(data.pharmacistHandoff);
        setMessages((m) => [
          ...m,
          {
            id: nextId.current++,
            role: "assistant",
            content: data.message,
            productIds: data.recommendedProductIds,
          },
        ]);
      } catch (e) {
        setMessages((m) => [
          ...m,
          {
            id: nextId.current++,
            role: "assistant",
            content: e instanceof Error ? e.message : "Algo deu errado. Tente novamente.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages, cart, recommended, loading],
  );

  const addToCart = (id: number) => setCart((c) => applyCartActions(c, [{ type: "add", productId: id, quantity: 1 }]));
  const setQty = (id: number, quantity: number) =>
    setCart((c) => applyCartActions(c, [{ type: "set", productId: id, quantity }]));

  const count = cartCount(cart);
  const total = cartTotal(cart);

  const openCart = () => {
    setTab("shop");
    setCartOpen(true);
  };

  return (
    <div className="flex h-dvh flex-col">
      <Header
        count={count}
        total={total}
        query={query}
        category={category}
        onQuery={(q) => {
          setQuery(q);
          if (q) setTab("shop");
        }}
        onCart={openCart}
        onNav={(c) => {
          setCategory(c);
          setQuery("");
        }}
      />

      <div className="flex min-h-0 flex-1">
        <section
          aria-label="Conversa com a INTUA"
          className={cx(
            "min-h-0 w-full lg:block lg:w-[420px] lg:flex-none",
            tab === "chat" ? "block" : "hidden",
          )}
        >
          <Chat
            messages={messages}
            loading={loading}
            suggested={suggested}
            handoff={handoff}
            mode={mode}
            onSend={send}
            onViewShop={() => setTab("shop")}
          />
        </section>

        <section
          aria-label="Vitrine e carrinho"
          className={cx(
            "min-h-0 flex-1 overflow-y-auto bg-surface lg:block",
            tab === "shop" ? "block" : "hidden",
          )}
        >
          <CartBar
            cart={cart}
            open={cartOpen}
            checkoutNote={checkoutNote}
            onToggle={() => setCartOpen((o) => !o)}
            onSetQty={setQty}
            onClear={() => setCart({})}
            onCheckout={() => setCheckoutNote(true)}
          />
          <Showcase
            cart={cart}
            recommended={recommended}
            compareIds={compareIds}
            query={query}
            category={category}
            onCategory={setCategory}
            onAdd={addToCart}
            onSetQty={setQty}
            onExplain={setExplainId}
            onCloseCompare={() => setCompareIds([])}
          />
        </section>
      </div>

      <nav className="grid grid-cols-3 border-t border-white/10 bg-navy text-white lg:hidden" aria-label="Navegação">
        {(
          [
            { key: "chat", label: "Conversar", Icon: MessageCircle, badge: 0, action: () => setTab("chat") },
            { key: "shop", label: "Vitrine", Icon: Store, badge: recommended.length, action: () => setTab("shop") },
            { key: "cart", label: "Carrinho", Icon: ShoppingCart, badge: count, action: openCart },
          ] as const
        ).map(({ key, label, Icon, badge, action }) => {
          const active = (key === "chat" && tab === "chat") || (key === "shop" && tab === "shop");
          return (
            <button
              key={key}
              type="button"
              onClick={action}
              className={cx(
                "relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                active ? "text-ai" : "text-white/70",
              )}
            >
              <span className="relative">
                <Icon className="h-5 w-5" />
                {badge > 0 && (
                  <span className="absolute -right-3 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </span>
              {label}
            </button>
          );
        })}
      </nav>

      {explainId !== null && (
        <ExplainModal
          productId={explainId}
          reason={recommended.find((r) => r.id === explainId)?.reason}
          onClose={() => setExplainId(null)}
          onAsk={(text) => {
            setExplainId(null);
            setTab("chat");
            void send(text);
          }}
        />
      )}
    </div>
  );
}
