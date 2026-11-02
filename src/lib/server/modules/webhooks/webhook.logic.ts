import type { Order } from "@prisma/client";
import { ApiError } from "../../utils/api-error";

export type PaddleTransactionItem = {
  price?: { id?: string };
  priceId?: string;
  quantity?: number;
};

export type OrderSnapshot = Pick<Order, "currency" | "total"> & {
  items: {
    paddlePriceId: string | null;
    quantity: number;
  }[];
};

export function readString(
  source: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = source[key];
  return typeof value === "string" ? value : undefined;
}

export function readNumber(
  source: Record<string, unknown> | undefined,
  key: string,
): number | undefined {
  if (!source) return undefined;
  const value = source[key];
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return undefined;
}

export function readRecord(
  source: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  const value = source[key];
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

export function readItems(data: Record<string, unknown>): PaddleTransactionItem[] {
  const value = data.items;
  return Array.isArray(value) ? (value as PaddleTransactionItem[]) : [];
}

export function itemPriceId(item: PaddleTransactionItem): string | undefined {
  return item.price?.id ?? item.priceId;
}

/**
 * Validate the (signed) transaction payload against our local order snapshot
 * before granting access. Protects against mismatched price / currency / quantity.
 */
export function validateCompletedTransaction(
  data: Record<string, unknown>,
  order: OrderSnapshot,
): void {
  const status = readString(data, "status");
  if (status && status !== "completed") {
    throw ApiError.badRequest(`Transaction is not completed (status=${status})`);
  }

  const currency = readString(data, "currencyCode") ?? readString(data, "currency");
  if (currency && currency.toUpperCase() !== order.currency.toUpperCase()) {
    throw ApiError.badRequest(
      `Currency mismatch: expected ${order.currency}, received ${currency}`,
    );
  }

  const items = readItems(data);
  for (const item of items) {
    const priceId = itemPriceId(item);
    const match = order.items.find(
      (orderItem) => orderItem.paddlePriceId && orderItem.paddlePriceId === priceId,
    );
    if (!match) {
      throw ApiError.badRequest(`Transaction contains an unknown price: ${priceId ?? "?"}`);
    }
    const quantity = item.quantity ?? 1;
    if (match.quantity !== quantity) {
      throw ApiError.badRequest(
        `Quantity mismatch for price ${priceId}: expected ${match.quantity}, received ${quantity}`,
      );
    }
  }

  const totals = readRecord(readRecord(data, "details"), "totals");
  const total = readNumber(totals, "total") ?? readNumber(totals, "grandTotal");
  const discount = readNumber(totals, "discount") ?? 0;
  if (typeof total === "number" && total + discount < order.total) {
    throw ApiError.badRequest(
      `Transaction total (${total}) plus discount (${discount}) is less than the order total (${order.total})`,
    );
  }
}

export interface RefundDecision {
  handled: boolean;
  isFullRefund: boolean;
  amount: number;
}

export function decideRefund(params: {
  action?: string;
  status?: string;
  amount?: number;
  orderTotal: number;
}): RefundDecision {
  const { action, status, orderTotal } = params;

  if (action && action !== "refund" && action !== "chargeback") {
    return { handled: false, isFullRefund: false, amount: 0 };
  }
  if (status && status !== "approved") {
    return { handled: false, isFullRefund: false, amount: 0 };
  }

  const amount = typeof params.amount === "number" ? params.amount : orderTotal;
  return { handled: true, isFullRefund: amount >= orderTotal, amount };
}
