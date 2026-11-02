-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "sessionKey" TEXT NOT NULL,
    "pagePath" TEXT NOT NULL,
    "productSlug" TEXT,
    "nicheSlug" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "closeReason" TEXT,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "transcript" JSONB NOT NULL DEFAULT '[]',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_sessions_sessionKey_key" ON "chat_sessions"("sessionKey");

-- CreateIndex
CREATE INDEX "chat_sessions_lastSeenAt_idx" ON "chat_sessions"("lastSeenAt");

-- CreateIndex
CREATE INDEX "chat_sessions_closedAt_idx" ON "chat_sessions"("closedAt");

-- CreateIndex
CREATE INDEX "chat_sessions_expiresAt_idx" ON "chat_sessions"("expiresAt");
