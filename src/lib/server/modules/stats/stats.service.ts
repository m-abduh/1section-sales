import { prisma } from "../../lib/prisma";

export interface TopProduct {
  productId: string;
  name: string;
  niche: string | null;
  units: number;
  revenue: number;
}

export async function getDashboardStats() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    niches,
    activeNiches,
    products,
    productsWithoutFiles,
    orders,
    pendingOrders,
    failedOrders,
    paidOrders,
    revenue,
    revenueLast7Days,
    recentOrders,
    paidOrderItems,
    chatSessions,
    chatSessionsLast7Days,
    chatMessageAgg,
  ] = await Promise.all([
    prisma.niche.count(),
    prisma.niche.count({ where: { active: true } }),
    prisma.product.count(),
    prisma.product.count({ where: { files: { none: {} } } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "FAILED" } }),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.order.aggregate({
      where: { status: "PAID" },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { status: "PAID", paidAt: { gte: sevenDaysAgo } },
      _sum: { total: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { items: true },
    }),
    prisma.orderItem.findMany({
      where: { order: { status: "PAID" } },
      include: { product: { include: { niche: { select: { name: true } } } } },
    }),
    prisma.chatSession.count(),
    prisma.chatSession.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.chatSession.aggregate({ _sum: { messageCount: true } }),
  ]);

  // Aggregate top products by units sold.
  const byProduct = new Map<
    string,
    { name: string; niche: string | null; units: number; revenue: number }
  >();
  for (const item of paidOrderItems) {
    const key = item.productId ?? item.productName;
    const existing = byProduct.get(key);
    const units = item.quantity;
    const revenue = item.lineTotal ?? item.unitAmount * item.quantity;
    if (existing) {
      existing.units += units;
      existing.revenue += revenue;
    } else {
      byProduct.set(key, {
        name: item.productName,
        niche: item.product?.niche?.name ?? null,
        units,
        revenue,
      });
    }
  }
  const topProducts: TopProduct[] = [...byProduct.entries()]
    .map(([productId, v]) => ({ productId, ...v }))
    .sort((a, b) => b.units - a.units || b.revenue - a.revenue)
    .slice(0, 5);

  const revenueTotal = revenue._sum.total ?? 0;
  const averageOrderValue = paidOrders > 0 ? Math.round(revenueTotal / paidOrders) : 0;
  const conversionRate = orders > 0 ? Math.round((paidOrders / orders) * 100) : 0;
  const chatMessages = chatMessageAgg._sum.messageCount ?? 0;

  return {
    niches,
    activeNiches,
    products,
    productsWithoutFiles,
    orders,
    pendingOrders,
    failedOrders,
    paidOrders,
    revenue: revenueTotal,
    revenueLast7Days: revenueLast7Days._sum.total ?? 0,
    averageOrderValue,
    conversionRate,
    chatSessions,
    chatSessionsLast7Days,
    chatMessages,
    chatAverageMessages:
      chatSessions > 0 ? Math.round((chatMessages / chatSessions) * 10) / 10 : 0,
    recentOrders,
    topProducts,
  };
}
