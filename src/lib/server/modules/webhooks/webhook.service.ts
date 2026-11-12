import { Prisma, type Order } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { paddle } from "../../lib/paddle";
import { generateOrderNumber } from "../../utils/ids";
import { fulfillOrder, revokeOrderEntitlements } from "../downloads/download.service";
import {
  decideRefund,
  itemPriceId,
  readItems,
  readNumber,
  readRecord,
  readString,
  validateCompletedTransaction,
} from "./webhook.logic";

type PaddleEvent = {
  eventId: string;
  eventType: string;
  data: Record<string, unknown>;
};

type OrderWithItems = Order & {
  items: {
    id: string;
    productId: string | null;
    paddlePriceId: string | null;
    quantity: number;
  }[];
};

async function resolveOrder(
  transactionId: string | undefined,
  customData: Record<string, unknown>,
): Promise<OrderWithItems | null> {
  const orderId = typeof customData.orderId === "string" ? customData.orderId : undefined;
  if (orderId) {
    const byId = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (byId) return byId;
  }
  if (transactionId) {
    return prisma.order.findUnique({
      where: { paddleTransactionId: transactionId },
      include: { items: true },
    });
  }
  return null;
}

async function resolveCustomerEmail(customerId: string | undefined): Promise<string | undefined> {
  if (!customerId) return undefined;
  try {
    const customer = await paddle.customers.get(customerId);
    return customer.email ?? undefined;
  } catch {
    return undefined;
  }
}

async function createOrderFromTransaction(
  transactionId: string,
  data: Record<string, unknown>,
  customData: Record<string, unknown>,
): Promise<OrderWithItems | null> {
  const items = readItems(data);
  const firstItem = items[0];
  const priceId = firstItem ? itemPriceId(firstItem) : undefined;
  const customProductId =
    typeof customData.productId === "string" ? customData.productId : undefined;

  let product = null as null | {
    id: string;
    name: string;
    priceAmount: number;
    currency: string;
    paddlePriceId: string | null;
  };

  if (customProductId) {
    product = await prisma.product.findUnique({
      where: { id: customProductId },
      select: { id: true, name: true, priceAmount: true, currency: true, paddlePriceId: true },
    });
  }
  if (!product && priceId) {
    product = await prisma.product.findFirst({
      where: { paddlePriceId: priceId },
      select: { id: true, name: true, priceAmount: true, currency: true, paddlePriceId: true },
    });
  }

  if (!product) {
    console.warn(`[webhook] cannot create order for ${transactionId}: product not resolved`);
    return null;
  }

  const currency =
    (readString(data, "currencyCode") ?? readString(data, "currency") ?? product.currency).toUpperCase();
  const totals = readRecord(readRecord(data, "details"), "totals");
  const amountPaid = readNumber(totals, "total") ?? readNumber(totals, "grandTotal") ?? product.priceAmount;
  const quantity = Math.max(1, firstItem?.quantity ?? 1);
  const unitAmount = quantity > 0 ? Math.round(amountPaid / quantity) : amountPaid;
  const customerId = readString(data, "customerId");
  const email = (await resolveCustomerEmail(customerId)) ?? null;
  const paddlePriceId = priceId ?? product.paddlePriceId ?? null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          email,
          status: "PAID",
          currency,
          subtotal: amountPaid,
          total: amountPaid,
          amountRefunded: 0,
          paddleTransactionId: transactionId,
          paddleCustomerId: customerId ?? null,
          paidAt: new Date(),
          items: {
            create: [
              {
                productId: product.id,
                productName: product.name,
                productTitle: product.name,
                unitAmount,
                quantity,
                lineTotal: amountPaid,
                paddlePriceId,
              },
            ],
          },
          payments: {
            create: [
              {
                provider: "PADDLE",
                providerTransactionId: transactionId,
                status: "COMPLETED",
                amount: amountPaid,
                currency,
              },
            ],
          },
        },
        include: { items: true },
      });
    } catch (error) {
      const isUnique =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
      if (!isUnique) throw error;
      const existing = await prisma.order.findUnique({
        where: { paddleTransactionId: transactionId },
        include: { items: true },
      });
      if (existing) return existing;
    }
  }
  return null;
}

async function markOrderPaid(event: PaddleEvent): Promise<void> {
  const data = event.data;
  const transactionId = readString(data, "id");
  const customData = readRecord(data, "customData");
  let order = await resolveOrder(transactionId, customData);

  if (!order && transactionId) {
    order = await createOrderFromTransaction(transactionId, data, customData);
  }

  if (!order) {
    console.warn(`[webhook] order not found for transaction ${transactionId}`);
    return;
  }

  if (order.status === "PAID") {
    const created = await fulfillOrder(order.id);
    if (created === 0) {
      console.warn(`[webhook] order ${order.id} produced no download tokens`);
    }
    return;
  }

  validateCompletedTransaction(data, order);

  const customerId = readString(data, "customerId");
  const email = order.email ?? (await resolveCustomerEmail(customerId)) ?? null;
  const totals = readRecord(readRecord(data, "details"), "totals");
  const amountPaid = readNumber(totals, "total") ?? order.total;

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paidAt: order.paidAt ?? new Date(),
        paddleTransactionId: transactionId ?? order.paddleTransactionId,
        paddleCustomerId: customerId ?? order.paddleCustomerId,
        email,
      },
    });

    if (transactionId) {
      await tx.payment.upsert({
        where: { providerTransactionId: transactionId },
        update: { status: "COMPLETED", amount: amountPaid, currency: order.currency },
        create: {
          orderId: order.id,
          provider: "PADDLE",
          providerTransactionId: transactionId,
          status: "COMPLETED",
          amount: amountPaid,
          currency: order.currency,
        },
      });
    }
  });

  const created = await fulfillOrder(order.id);
  if (created === 0) {
    console.warn(`[webhook] order ${order.id} produced no download tokens`);
  }
}

async function updateOrderStatus(
  event: PaddleEvent,
  status: Order["status"],
  paymentStatus?: "FAILED" | "CANCELED",
): Promise<void> {
  const data = event.data;
  const transactionId = readString(data, "id");
  const customData = readRecord(data, "customData");
  const order = await resolveOrder(transactionId, customData);

  if (!order) {
    return;
  }

  if (order.status === "PAID" && status !== "FAILED" && status !== "CANCELED") {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: order.id }, data: { status } });
    if (transactionId && paymentStatus) {
      await tx.payment.upsert({
        where: { providerTransactionId: transactionId },
        update: { status: paymentStatus },
        create: {
          orderId: order.id,
          provider: "PADDLE",
          providerTransactionId: transactionId,
          status: paymentStatus,
          amount: order.total,
          currency: order.currency,
        },
      });
    }
  });
}

async function handleAdjustment(event: PaddleEvent): Promise<void> {
  const data = event.data;
  const transactionId =
    readString(data, "transactionId") ??
    readString(readRecord(data, "transaction"), "id");
  const customData = readRecord(data, "customData");
  const order = await resolveOrder(transactionId, customData);

  if (!order) {
    return;
  }

  const totals = readRecord(data, "totals");
  const decision = decideRefund({
    action: readString(data, "action"),
    status: readString(data, "status"),
    amount: readNumber(totals, "total"),
    orderTotal: order.total,
  });

  if (!decision.handled) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: decision.isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED",
        amountRefunded: { increment: decision.amount },
        refundedAt: decision.isFullRefund ? new Date() : order.refundedAt,
      },
    });
    if (transactionId) {
      await tx.payment.updateMany({
        where: { providerTransactionId: transactionId },
        data: { status: "REFUNDED" },
      });
    }
  });

  if (decision.isFullRefund) {
    await revokeOrderEntitlements(order.id);
  }
}

export async function processEvent(event: PaddleEvent): Promise<void> {
  switch (event.eventType) {
    case "transaction.completed":
      await markOrderPaid(event);
      break;
    case "transaction.payment_failed":
      await updateOrderStatus(event, "FAILED", "FAILED");
      break;
    case "transaction.canceled":
      await updateOrderStatus(event, "CANCELED", "CANCELED");
      break;
    case "adjustment.created":
    case "adjustment.updated":
      await handleAdjustment(event);
      break;
    default:
      break;
  }
}

export interface BeginEventResult {
  id: string;
  shouldProcess: boolean;
}

export async function beginEvent(event: PaddleEvent): Promise<BeginEventResult> {
  try {
    const created = await prisma.webhookEvent.create({
      data: {
        eventId: event.eventId,
        type: event.eventType,
        payload: event.data as Prisma.InputJsonValue,
        status: "RECEIVED",
      },
    });
    return { id: created.id, shouldProcess: true };
  } catch (error) {
    const isUnique =
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
    if (!isUnique) {
      throw error;
    }

    const existing = await prisma.webhookEvent.findUnique({
      where: { eventId: event.eventId },
    });
    if (!existing) {
      throw error;
    }

    if (existing.status === "PROCESSED") {
      return { id: existing.id, shouldProcess: false };
    }
    return { id: existing.id, shouldProcess: true };
  }
}

export async function markProcessed(id: string): Promise<void> {
  await prisma.webhookEvent.update({
    where: { id },
    data: {
      status: "PROCESSED",
      processedAt: new Date(),
      attempts: { increment: 1 },
      error: null,
    },
  });
}

export async function markFailed(id: string, error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  await prisma.webhookEvent.update({
    where: { id },
    data: {
      status: "FAILED",
      attempts: { increment: 1 },
      error: message.slice(0, 2000),
    },
  });
}

/**
 * Reconciliation: re-issue entitlements for paid orders that are missing tokens.
 */
export async function reconcilePaidOrders(limit = 50): Promise<number> {
  const orders = await prisma.order.findMany({
    where: { status: "PAID" },
    orderBy: { paidAt: "asc" },
    take: limit,
  });

  let repaired = 0;
  for (const order of orders) {
    const created = await fulfillOrder(order.id);
    if (created > 0) repaired += 1;
  }
  return repaired;
}
