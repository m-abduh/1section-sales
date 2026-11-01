import { z } from "zod";

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(1000),
});

export const chatRequestSchema = z.object({
  path: z.string().trim().max(300).default("/"),
  messages: z.array(chatMessageSchema).min(1).max(20),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
