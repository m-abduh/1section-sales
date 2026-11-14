"use client";

import { useEffect, useState } from "react";
import { api, getApiErrorMessage } from "@/lib/api";
import { getPaddle } from "@/lib/paddle";
import { LAST_ORDER_KEY, LAST_TXN_KEY } from "@/hooks/use-checkout";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { Product } from "@/lib/types";

interface BuyButtonProps {
  product: Product;
  label?: string;
  size?: "md" | "lg";
  className?: string;
}

type State =
  | { kind: "idle" }
  | { kind: "creating" }
  | { kind: "ready"; transactionId: string }
  | { kind: "error"; message: string };

export function BuyButton({
  product,
  label = "Buy and get instant access",
  size = "lg",
  className = "",
}: BuyButtonProps) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Detect theme for Paddle.
  useEffect(() => {
    const update = () => {
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    };
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // Create transaction on demand.
  const start = async () => {
    setState({ kind: "creating" });
    try {
      const res = await api.post<{ data: { transactionId: string; checkoutUrl: string } }>(
        "/checkout",
        { productId: product.id },
      );
      const data = res.data.data;
      const transactionId = typeof data.transactionId === "string" ? data.transactionId.trim() : "";
      if (!transactionId) {
        throw new Error("Checkout did not return a transaction ID");
      }
      try {
        window.localStorage.setItem(LAST_TXN_KEY, transactionId);
        window.localStorage.removeItem(LAST_ORDER_KEY);
      } catch {
        // ignore
      }
      setState({ kind: "ready", transactionId });
    } catch (err) {
      setState({ kind: "error", message: getApiErrorMessage(err) });
    }
  };

  // Render Paddle inline once ready.
  useEffect(() => {
    if (state.kind !== "ready") return;
    const { transactionId } = state;
    const successUrl = `${window.location.origin}/checkout/success?_ptxn=${encodeURIComponent(transactionId)}`;
    let cancelled = false;
    (async () => {
      try {
        const paddle = await getPaddle();
        if (cancelled) return;
        paddle.Checkout.open({
          transactionId,
          settings: {
            displayMode: "inline",
            variant: "one-page",
            theme,
            locale: "en",
            frameTarget: "inline-checkout-container",
            frameInitialHeight: "450",
            frameStyle:
              "width: 100%; min-width: 312px; background-color: transparent; border: none;",
            successUrl,
          },
          eventCallback: (event: { name?: string; data?: { height?: number | string } }) => {
            if (event?.name === "checkout.completed") {
              window.location.href = successUrl;
            }
            if (event?.name === "checkout.frameHeight" && event.data?.height) {
              const h = typeof event.data.height === "number" ? event.data.height : parseInt(String(event.data.height), 10);
              if (Number.isFinite(h) && h > 0) {
                const frame = document.querySelector<HTMLElement>(".inline-checkout-container iframe");
                const target = frame ?? document.querySelector<HTMLElement>(".inline-checkout-container");
                if (target) target.style.height = `${h}px`;
              }
            }
          },
        } as Record<string, unknown>);
      } catch (err) {
        if (cancelled) return;
        setState({ kind: "error", message: getApiErrorMessage(err) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state, theme]);

  if (state.kind === "idle") {
    return (
      <div className="w-full">
        <Button
          type="button"
          size={size}
          className={`w-full rounded-full bg-slate-900 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:opacity-100 dark:bg-white dark:text-[#0d0e13] dark:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.6)] dark:hover:bg-neutral-100 ${className}`}
          onClick={start}
        >
          {label}
        </Button>
      </div>
    );
  }

  if (state.kind === "creating") {
    return (
      <div className="flex w-full items-center justify-center rounded-2xl border border-border bg-surface-muted px-4 py-6">
        <Spinner />
        <span className="ml-3 text-sm text-fg-muted">Preparing checkout…</span>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="w-full space-y-3">
        <p className="text-sm text-red-600">{state.message}</p>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => setState({ kind: "idle" })}
        >
          Try again
        </Button>
      </div>
    );
  }

  // ready
  return (
    <div className="w-full space-y-3">
      <div className="inline-checkout-container w-full rounded-2xl border border-border bg-card" />
    </div>
  );
}
