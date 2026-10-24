"use client";

import { MessageCircle, ShoppingCart, Sparkles, Store } from "lucide-react";
import Image from "next/image";
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

  // No PC e mobile, o chat agora começa fechado e só abre quando solicitado
  const [chatOpen, setChatOpen] = useState(false);

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
    setCartOpen(true);
  };

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <Header
        count={count}
        total={total}
        query={query}
        category={category}
        onQuery={(q) => {
          setQuery(q);
        }}
        onCart={openCart}
        onNav={(c) => {
          setCategory(c);
          setQuery("");
        }}
      />

      <div className="flex min-h-0 flex-1">
        {/* Vitrine e carrinho ocupam a tela inteira por padrão */}
        <section
          aria-label="Vitrine e carrinho"
          className="min-h-0 flex-1 overflow-y-auto bg-surface"
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

      {/* Botão flutuante do bonequinho da INTUA com balão de chamada no canto inferior direito */}
      {!chatOpen && (
        <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2.5 sm:bottom-6 sm:right-6">
          {/* Balão com mensagem chamando para falar com a INTUA */}
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="group relative flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-left shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
          >
            <div className="flex flex-col">
              <span className="flex items-center gap-1.5 text-xs font-bold text-navy">
                <Sparkles className="h-3.5 w-3.5 text-brand" />
                Oi! Precisa de ajuda?
              </span>
              <span className="text-[11px] text-slate-600">
                Clique aqui para falar com a <strong className="text-brand">INTUA</strong> 👋
              </span>
            </div>
            {/* Triângulo indicador do balão apontando para o bonequinho */}
            <div
              className="absolute -bottom-2 right-6 h-0 w-0 border-x-8 border-x-transparent border-t-8 border-t-white drop-shadow-sm"
              aria-hidden="true"
            />
          </button>

          {/* Bonequinho da INTUA (avatar do mascote) */}
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            aria-label="Abrir assistente INTUA"
            className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-navy p-1 ring-4 ring-brand/30 shadow-2xl transition-all duration-300 hover:scale-110 hover:ring-brand active:scale-95"
          >
            <div className="relative h-full w-full overflow-hidden rounded-full ring-2 ring-white">
              <Image
                src="/brand/mascote-avatar.jpg"
                alt="Mascote INTUA"
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            {/* Indicador de status online com pulso */}
            <span className="absolute bottom-0 right-0 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
            </span>
          </button>
        </div>
      )}

      {/* Janela de chat aberta: no PC flutua no canto inferior direito; no mobile abre como modal sobreposto */}
      {chatOpen && (
        <section
          aria-label="Conversa com a INTUA"
          className="fixed inset-x-0 bottom-0 top-14 z-50 flex flex-col overflow-hidden rounded-t-2xl bg-navy shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-auto sm:h-[620px] sm:max-h-[calc(100dvh-5rem)] sm:w-[420px] sm:rounded-2xl sm:border sm:border-white/10"
        >
          <Chat
            messages={messages}
            loading={loading}
            suggested={suggested}
            handoff={handoff}
            mode={mode}
            onSend={send}
            onViewShop={() => setChatOpen(false)}
            onClose={() => setChatOpen(false)}
          />
        </section>
      )}

      {/* Navegação inferior para celular */}
      <nav className="grid grid-cols-3 border-t border-white/10 bg-navy text-white lg:hidden" aria-label="Navegação">
        {(
          [
            { key: "chat", label: "Falar com INTUA", Icon: MessageCircle, badge: 0, action: () => setChatOpen(true) },
            { key: "shop", label: "Vitrine", Icon: Store, badge: recommended.length, action: () => setChatOpen(false) },
            { key: "cart", label: "Carrinho", Icon: ShoppingCart, badge: count, action: openCart },
          ] as const
        ).map(({ key, label, Icon, badge, action }) => {
          const active = (key === "chat" && chatOpen) || (key === "shop" && !chatOpen);
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

      {/* Modal de explicação do produto */}
      {explainId !== null && (
        <ExplainModal
          productId={explainId}
          reason={recommended.find((r) => r.id === explainId)?.reason}
          onClose={() => setExplainId(null)}
          onAsk={(text) => {
            setExplainId(null);
            setChatOpen(true);
            void send(text);
          }}
        />
      )}
    </div>
  );
}
