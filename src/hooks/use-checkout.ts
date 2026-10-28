"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getPaddle } from "@/lib/paddle";

export const LAST_ORDER_KEY = "section_last_order";
export const LAST_ACCESS_KEY = "section_last_access";

export interface StoredCheckoutAccess {
  orderNumber: string;
  transactionId: string;
  accessToken: string;
}

export interface CheckoutPayload {
  productId: string;
  email?: string;
}

export interface CheckoutResult {
  orderNumber: string;
  transactionId: string;
  checkoutUrl: string;
  accessToken: string;
}

export function useCheckout() {
  return useMutation({
    mutationFn: async (payload: CheckoutPayload): Promise<CheckoutResult> => {
      const response = await api.post<{ data: CheckoutResult }>("/checkout", payload);
      return response.data.data;
    },
    onSuccess: async (data) => {
      try {
        window.localStorage.setItem(LAST_ORDER_KEY, data.orderNumber);
        window.localStorage.setItem(
          LAST_ACCESS_KEY,
          JSON.stringify({
            orderNumber: data.orderNumber,
            transactionId: data.transactionId,
            accessToken: data.accessToken,
          } satisfies StoredCheckoutAccess),
        );
      } catch {
        /* storage might be unavailable */
      }

      const successUrl = `${window.location.origin}/checkout/success?order=${encodeURIComponent(
        data.orderNumber,
      )}&access=${encodeURIComponent(data.accessToken)}`;

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
