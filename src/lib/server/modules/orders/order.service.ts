import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import { env } from "../../config/env";
import { generateSecureToken } from "../../utils/ids";
import { fulfillOrder } from "../downloads/download.service";

export interface PublicOrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitAmount: number;
  hasFiles: boolean;
  downloads: {
    token: string;
    label: string;
    url: string;
    remaining: number;
    expiresAt: Date;
  }[];
}

export interface PublicOrder {
  orderNumber: string;
  status: OrderStatus;
  total: number;
  currency: string;
  paidAt: Date | null;
  authorized: boolean;
  hasEmail: boolean;
  items: PublicOrderItem[];
}

export interface AccessProof {
  email?: string;
  accessToken?: string;
}

async function isAuthorized(orderId: string, orderEmail: string | null, proof: AccessProof) {
  if (proof.accessToken) {
    const link = await prisma.accessLink.findUnique({
      where: { token: proof.accessToken },
    });
    if (
      link &&
      link.orderId === orderId &&
      link.expiresAt.getTime() > Date.now()
    ) {
      if (!link.usedAt) {
        await prisma.accessLink.update({
          where: { id: link.id },
          data: { usedAt: new Date() },
        });
      }
      return true;
    }
  }

  if (proof.email && orderEmail) {
    return orderEmail.toLowerCase() === proof.email.toLowerCase();
  }

  return false;
}

export async function getOrderStatus(
  orderNumber: string,
  proof: AccessProof,
): Promise<PublicOrder | null> {
  // `orderNumber` may be the store order number (ORD-...) or the Paddle
  // transaction ID (txn_...) coming from Paddle's success redirect.
  const order = await prisma.order.findFirst({
    where: {
      OR: [{ orderNumber }, { paddleTransactionId: orderNumber }],
    },
    include: {
      items: {
        include: {
          tokens: true,
          product: { select: { _count: { select: { files: true } } } },
        },
      },
    },
  });

  if (!order) {
    if (orderNumber.startsWith("txn_")) {
      return {
        orderNumber,
        status: "PENDING",
        total: 0,
        currency: "USD",
        paidAt: null,
        authorized: false,
        hasEmail: false,
        items: [],
      };
    }
    return null;
  }

  const authorized = await isAuthorized(order.id, order.email, proof);

  if (order.status === "PAID" && authorized) {
    // Self-heal: idempotently re-issue any missing entitlements/tokens.
    await fulfillOrder(order.id);
    order.items = await prisma.orderItem.findMany({
      where: { orderId: order.id },
      include: {
        tokens: true,
        product: { select: { _count: { select: { files: true } } } },
      },
    });
  }

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
    currency: order.currency,
    paidAt: order.paidAt,
    authorized,
    hasEmail: Boolean(order.email),
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      quantity: item.quantity,
      unitAmount: item.unitAmount,
      hasFiles: (item.product?._count?.files ?? 0) > 0,
      downloads:
        order.status === "PAID" && authorized
          ? item.tokens.map((token) => ({
              token: token.token,
              label: token.label,
              url: `/api/downloads/${token.token}`,
              remaining: token.maxDownloads - token.downloadCount,
              expiresAt: token.expiresAt,
            }))
          : [],
    })),
  };
}

/**
 * Creates a long-lived access link for an order. Used to unlock the success
 * page immediately after checkout and inside the purchase email.
 */
export async function createOrderAccessLink(
  orderId: string,
  email: string | null,
): Promise<string> {
  const token = generateSecureToken(24);
  await prisma.accessLink.create({
    data: {
      token,
      orderId,
      email: email?.toLowerCase() ?? null,
      expiresAt: new Date(
        Date.now() + env.ORDER_ACCESS_TTL_HOURS * 60 * 60 * 1000,
      ),
    },
  });
  return token;
}

export async function listAdminOrders(params: {
  page: number;
  pageSize: number;
  status?: OrderStatus;
  search?: string;
}) {
  const where: Prisma.OrderWhereInput = {};
  if (params.status) {
    where.status = params.status;
  }
  if (params.search) {
    where.OR = [
      { orderNumber: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: {
        items: {
          include: {
            tokens: {
              select: { downloadCount: true },
            },
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  const items = rows.map((order) => {
    let tokenCount = 0;
    let downloaded = false;
    let totalDownloadCount = 0;

    const items = order.items.map((item) => {
      let itemTokenCount = 0;
      let itemDownloaded = false;
      let itemTotalDownloadCount = 0;

      for (const token of item.tokens) {
        itemTokenCount += 1;
        itemTotalDownloadCount += token.downloadCount;
        if (token.downloadCount > 0) itemDownloaded = true;
      }

      tokenCount += itemTokenCount;
      totalDownloadCount += itemTotalDownloadCount;
      if (itemDownloaded) downloaded = true;

      const { tokens: _tokens, ...rest } = item;
      return {
        ...rest,
        downloadStats: {
          tokenCount: itemTokenCount,
          downloaded: itemDownloaded,
          totalDownloadCount: itemTotalDownloadCount,
        },
      };
    });

    return {
      ...order,
      items,
      downloadStats: {
        tokenCount,
        downloaded,
        totalDownloadCount,
      },
    };
  });

  return {
    items,
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.ceil(total / params.pageSize) || 1,
    },
  };
}

export async function getAdminOrder(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          tokens: true,
          entitlements: true,
          product: { select: { slug: true } },
        },
      },
      payments: true,
    },
  });

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  return order;
}
