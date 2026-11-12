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
      try {
        window.localStorage.setItem(LAST_TXN_KEY, data.transactionId);
        window.localStorage.removeItem(LAST_ORDER_KEY);
      } catch {
        /* storage might be unavailable */
      }

      const successUrl = `${window.location.origin}/checkout/success?_ptxn=${encodeURIComponent(
        data.transactionId,
      )}`;

      try {
        const paddle = await getPaddle();
        paddle.Checkout.open({
          transactionId: data.transactionId,
          settings: {
            displayMode: "overlay",
            successUrl,
          },
        });
      } catch {
        window.location.href = data.checkoutUrl || successUrl;
      }
    },
  });
}
