import { describe, expect, it } from "vitest";
import { ApiError } from "../../utils/api-error";
import {
  decideRefund,
  validateCompletedTransaction,
  type OrderSnapshot,
} from "./webhook.logic";

const order: OrderSnapshot = {
  currency: "USD",
  total: 2900,
  items: [{ paddlePriceId: "pri_123", quantity: 1 }],
};

function transaction(overrides: Record<string, unknown> = {}) {
  return {
    status: "completed",
    currencyCode: "USD",
    items: [{ price: { id: "pri_123" }, quantity: 1 }],
    details: { totals: { total: "2900" } },
    ...overrides,
  };
}

describe("validateCompletedTransaction", () => {
  it("accepts a matching transaction", () => {
    expect(() => validateCompletedTransaction(transaction(), order)).not.toThrow();
  });

  it("rejects a transaction that is not completed", () => {
    expect(() =>
      validateCompletedTransaction(transaction({ status: "ready" }), order),
    ).toThrow(ApiError);
  });

  it("rejects a currency mismatch", () => {
    expect(() =>
      validateCompletedTransaction(transaction({ currencyCode: "EUR" }), order),
    ).toThrow(/Currency mismatch/);
  });

  it("rejects an unknown price", () => {
    expect(() =>
      validateCompletedTransaction(
        transaction({ items: [{ price: { id: "pri_other" }, quantity: 1 }] }),
        order,
      ),
    ).toThrow(/unknown price/);
  });

  it("rejects a quantity mismatch", () => {
    expect(() =>
      validateCompletedTransaction(
        transaction({ items: [{ price: { id: "pri_123" }, quantity: 2 }] }),
        order,
      ),
    ).toThrow(/Quantity mismatch/);
  });

  it("rejects an underpaid transaction", () => {
    expect(() =>
      validateCompletedTransaction(
        transaction({ details: { totals: { total: "1000" } } }),
        order,
      ),
    ).toThrow(/less than the order total/);
  });

  it("accepts a fully discounted transaction", () => {
    expect(() =>
      validateCompletedTransaction(
        transaction({
          details: {
            totals: { subtotal: "2900", discount: "2900", total: "0" },
          },
        }),
        order,
      ),
    ).not.toThrow();
  });

  it("rejects an underpaid transaction even with a partial discount", () => {
    expect(() =>
      validateCompletedTransaction(
        transaction({
          details: {
            totals: { subtotal: "2900", discount: "1000", total: "1000" },
          },
        }),
        order,
      ),
    ).toThrow(/less than the order total/);
  });
});

describe("decideRefund", () => {
  it("treats an approved full refund as full", () => {
    expect(
      decideRefund({ action: "refund", status: "approved", amount: 2900, orderTotal: 2900 }),
    ).toEqual({ handled: true, isFullRefund: true, amount: 2900 });
  });

  it("treats a smaller refund as partial", () => {
    expect(
      decideRefund({ action: "refund", status: "approved", amount: 1000, orderTotal: 2900 }),
    ).toEqual({ handled: true, isFullRefund: false, amount: 1000 });
  });

  it("ignores pending adjustments", () => {
    expect(
      decideRefund({ action: "refund", status: "pending", amount: 2900, orderTotal: 2900 })
        .handled,
    ).toBe(false);
  });

  it("ignores non-refund actions", () => {
    expect(
      decideRefund({ action: "credit", status: "approved", amount: 2900, orderTotal: 2900 })
        .handled,
    ).toBe(false);
  });
});
