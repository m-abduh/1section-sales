"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getPaddle } from "@/lib/paddle";

export const LAST_ORDER_KEY = "section_last_order";
export const LAST_TXN_KEY = "section_last_txn";

export interface CheckoutPayload {
  productId: string;
  email?: string;
}

export interface CheckoutResult {
  transactionId: string;
  checkoutUrl: string;
}

export function useCheckout() {
  return useMutation({
    mutationFn: async (payload: CheckoutPayload): Promise<CheckoutResult> => {
      const response = await api.post<{ data: CheckoutResult }>("/checkout", payload);
      return response.data.data;
    },
    onSuccess: async (data) => {
      const transactionId =
        typeof data?.transactionId === "string" ? data.transactionId.trim() : "";
      if (!transactionId) {
        return;
      }

      try {
        window.localStorage.setItem(LAST_TXN_KEY, transactionId);
        window.localStorage.removeItem(LAST_ORDER_KEY);
      } catch {
        /* storage might be unavailable */
      }

      const successUrl = `${window.location.origin}/checkout/success?_ptxn=${encodeURIComponent(
        transactionId,
      )}`;

      try {
        const paddle = await getPaddle();
        paddle.Checkout.open({
          transactionId,
          settings: {
            displayMode: "overlay",
            successUrl,
          },
          eventCallback: (event: { name?: string }) => {
            if (event?.name === "checkout.completed") {
              window.location.href = successUrl;
            }
          },
        } as Record<string, unknown>);
      } catch {
        // Hosted checkout fallback: redirect to Paddle checkout URL.
        // Default success URL in Paddle dashboard must point to /checkout/success
        // so Paddle can append _ptxn after payment.
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      }
    },
  });
}
