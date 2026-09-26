/*
  Hardening Sprint - Search History + Notification Engine Fields
  
  Adds:
  - SearchQuery table (normalized query tracking)
  - UserSearchHistory table (per-user search history)
  - Notification: severity, status, readAt, archived fields
*/

-- CreateTable
CREATE TABLE "SearchQuery" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "normalizedQuery" TEXT NOT NULL,
    "displayQuery" TEXT NOT NULL,
    "searchCount" INTEGER NOT NULL DEFAULT 0,
    "firstSearchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSearchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "SearchQuery_normalizedQuery_idx" ON "SearchQuery"("normalizedQuery");
CREATE INDEX "SearchQuery_lastSearchedAt_idx" ON "SearchQuery"("lastSearchedAt");
CREATE INDEX "SearchQuery_searchCount_idx" ON "SearchQuery"("searchCount");

-- CreateTable
CREATE TABLE "UserSearchHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "searchQueryId" INTEGER NOT NULL,
    "searchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserSearchHistory_searchQueryId_fkey" FOREIGN KEY ("searchQueryId") REFERENCES "SearchQuery" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserSearchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("userId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "UserSearchHistory_userId_idx" ON "UserSearchHistory"("userId");

-- Add notification severity, status, readAt, archived fields
PRAGMA foreign_keys=ON;

-- RedefineTables
CREATE TABLE "new_Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "activityLogId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "status" TEXT NOT NULL DEFAULT 'DELIVERED',
    "readAt" DATETIME,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Notification_activityLogId_fkey" FOREIGN KEY ("activityLogId") REFERENCES "ActivityLog" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("userId") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Notification" ("activityLogId", "createdAt", "id", "link", "message", "read", "title", "type", "updatedAt", "userId") SELECT "activityLogId", "createdAt", "id", "link", "message", "read", "title", "type", "updatedAt", "userId" FROM "Notification";

DROP TABLE "Notification";

ALTER TABLE "new_Notification" RENAME TO "Notification";

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_userId_read_createdAt_idx" ON "Notification"("userId", "read", "createdAt");
CREATE INDEX "Notification_status_idx" ON "Notification"("status");
CREATE INDEX "Notification_archived_idx" ON "Notification"("archived");
