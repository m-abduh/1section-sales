"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  AdminChatSessionDetail,
  AdminChatSessionSummary,
  AdminChatStats,
  Pagination,
} from "@/lib/types";

export interface ChatFilters {
  page: number;
  pageSize: number;
  status?: "open" | "closed";
  search?: string;
}

export const adminChatKeys = {
  all: ["admin", "chats"] as const,
  list: (filters: ChatFilters) => ["admin", "chats", filters] as const,
  detail: (id: string) => ["admin", "chats", "detail", id] as const,
};

export function useAdminChats(filters: ChatFilters) {
  return useQuery({
    queryKey: adminChatKeys.list(filters),
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page: filters.page,
        pageSize: filters.pageSize,
      };
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;

      const response = await api.get<{
        data: AdminChatSessionSummary[];
        pagination: Pagination;
        stats: AdminChatStats;
      }>("/admin/chats", { params });

      return {
        items: response.data.data,
        pagination: response.data.pagination,
        stats: response.data.stats,
      };
    },
    placeholderData: (previous) => previous,
  });
}

export function useAdminChatSession(id: string | null) {
  return useQuery({
    queryKey: adminChatKeys.detail(id ?? "none"),
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await api.get<{ data: AdminChatSessionDetail }>(
        `/admin/chats/${id}`,
      );
      return response.data.data;
    },
  });
}
