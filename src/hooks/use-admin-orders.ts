"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AdminOrder, OrderStatus, Pagination } from "@/lib/types";

export interface OrderFilters {
  page: number;
  pageSize: number;
  status?: OrderStatus;
  search?: string;
}

export const adminOrderKeys = {
  all: ["admin", "orders"] as const,
  list: (filters: OrderFilters) => ["admin", "orders", filters] as const,
};

export function useAdminOrders(filters: OrderFilters) {
  return useQuery({
    queryKey: adminOrderKeys.list(filters),
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page: filters.page,
        pageSize: filters.pageSize,
      };
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;

      const response = await api.get<{ data: AdminOrder[]; pagination: Pagination }>(
        "/admin/orders",
        { params },
      );
      return { items: response.data.data, pagination: response.data.pagination };
    },
    placeholderData: (previous) => previous,
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const response = await api.get<{
        data: {
          niches: number;
          activeNiches: number;
          products: number;
          productsWithoutFiles: number;
          orders: number;
          pendingOrders: number;
          failedOrders: number;
          paidOrders: number;
          revenue: number;
          revenueLast7Days: number;
          averageOrderValue: number;
          conversionRate: number;
          chatSessions: number;
          chatSessionsLast7Days: number;
          chatMessages: number;
          chatAverageMessages: number;
          recentOrders: AdminOrder[];
          topProducts: {
            productId: string;
            name: string;
            niche: string | null;
            units: number;
            revenue: number;
          }[];
        };
      }>("/admin/stats");
      return response.data.data;
    },
  });
}
