import { z } from "zod";

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(1000),
});

export const chatRequestSchema = z.object({
  path: z.string().trim().max(300).default("/"),
  messages: z.array(chatMessageSchema).min(1).max(20),
  sessionKey: z.string().trim().min(8).max(100).optional(),
  openedAt: z.string().trim().max(40).optional(),
});

export const chatSessionCloseSchema = z.object({
  sessionKey: z.string().trim().min(8).max(100),
  reason: z.enum(["user_closed", "page_exit"]),
});

export const adminChatListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["open", "closed"]).optional(),
  search: z.string().trim().max(120).optional(),
});

export const chatSessionIdParamSchema = z.object({
  id: z.string().trim().min(1).max(60),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
