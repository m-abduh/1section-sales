export interface Niche {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  audience: string | null;
  problems: string[];
  heroImage: string | null;
  accentColor: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  _count?: { products: number };
}

export type LearningLevel = "FOUNDATIONS" | "PRACTICAL" | "ADVANCED";

export const LEARNING_LEVELS: LearningLevel[] = [
  "FOUNDATIONS",
  "PRACTICAL",
  "ADVANCED",
];

export const LEARNING_LEVEL_LABEL: Record<LearningLevel, string> = {
  FOUNDATIONS: "Foundations",
  PRACTICAL: "Practical",
  ADVANCED: "Advanced",
};

export interface ProductFile {
  id: string;
  name: string;
  sortOrder: number;
  format?: string | null;
  provider?: "CLOUDINARY" | "LOCAL" | "EXTERNAL";
  storageKey?: string | null;
  resourceType?: string | null;
  bytes?: number | null;
  checksum?: string | null;
  fileUrl?: string | null;
  assetFileId?: string | null;
}

export interface Product {
  id: string;
  nicheId: string;
  slug: string;
  name: string;
  summary: string | null;
  description: string | null;
  audience: string | null;
  notFor: string | null;
  outcome: string | null;
  learnings: string[];
  limitations: string | null;
  license: string | null;
  sampleUrl: string | null;
  level: LearningLevel;
  coverImage: string | null;
  priceAmount: number;
  compareAtAmount: number | null;
  currency: string;
  paddleProductId: string | null;
  paddlePriceId: string | null;
  paddleSyncedAt: string | null;
  features: string[];
  files: ProductFile[];
  active: boolean;
  sortOrder: number;
  createdAt: string;
  niche?: { id: string; slug: string; name: string; accentColor?: string };
  _count?: { orderItems: number };
}

export interface NicheWithProducts extends Niche {
  products: Product[];
}


export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELED"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED";

export interface DownloadLink {
  token: string;
  label: string;
  url: string;
  remaining: number;
  expiresAt: string;
}

export interface PublicOrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitAmount: number;
  hasFiles: boolean;
  downloads: DownloadLink[];
}

export interface PublicOrder {
  orderNumber: string;
  status: OrderStatus;
  total: number;
  currency: string;
  paidAt: string | null;
  authorized: boolean;
  hasEmail: boolean;
  items: PublicOrderItem[];
}

export interface AdminDownloadStats {
  tokenCount: number;
  downloaded: boolean;
  totalDownloadCount: number;
}

export interface AdminOrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitAmount: number;
  nicheName?: string | null;
  downloadStats?: AdminDownloadStats;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  email: string | null;
  customerName: string | null;
  status: OrderStatus;
  currency: string;
  total: number;
  paidAt: string | null;
  createdAt: string;
  items: AdminOrderItem[];
  downloadStats?: AdminDownloadStats;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ChatTranscriptMessage {
  role: "user" | "assistant";
  content: string;
  at: string;
}

export interface AdminChatSessionSummary {
  id: string;
  pagePath: string;
  productSlug: string | null;
  nicheSlug: string | null;
  openedAt: string;
  firstMessageAt: string;
  lastSeenAt: string;
  closedAt: string | null;
  closeReason: string | null;
  messageCount: number;
  preview: string | null;
}

export interface AdminChatSessionDetail
  extends Omit<AdminChatSessionSummary, "preview"> {
  transcript: ChatTranscriptMessage[];
}

export interface AdminChatStats {
  total: number;
  open: number;
  closed: number;
  today: number;
  messages: number;
  averageMessages: number;
  topPages: { path: string; sessions: number }[];
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  pagination?: Pagination;
  error?: { code: string; message: string; details?: unknown };
}
