"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Niche } from "@/lib/types";

export interface NicheInput {
  name: string;
  slug?: string;
  tagline?: string | null;
  description?: string | null;
  accentColor?: string;
  active?: boolean;
  sortOrder?: number;
}

export const adminNicheKeys = {
  all: ["admin", "niches"] as const,
};

export function useAdminNiches() {
  return useQuery({
    queryKey: adminNicheKeys.all,
    queryFn: async () => {
      const response = await api.get<{ data: Niche[] }>("/admin/niches");
      return response.data.data;
    },
  });
}

export function useCreateNiche() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: NicheInput) => {
      const response = await api.post<{ data: Niche }>("/admin/niches", input);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminNicheKeys.all }),
  });
}

export function useUpdateNiche() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<NicheInput> }) => {
      const response = await api.patch<{ data: Niche }>(`/admin/niches/${id}`, input);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminNicheKeys.all }),
  });
}

export function useDeleteNiche() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/niches/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminNicheKeys.all }),
  });
}
