import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SearchHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  normalizeQuery(query: string): string {
    return query.trim().toLowerCase().replace(/\s+/g, " ");
  }

  async recordSearch(userId: number, rawQuery: string): Promise<void> {
    const normalized = this.normalizeQuery(rawQuery);
    const display = rawQuery.trim();

    if (normalized.length < 3) return;

    await this.pruneOldEntries();

    const existing = await this.prisma.searchQuery.findFirst({
      where: { normalizedQuery: normalized },
    });

    if (existing) {
      await this.prisma.searchQuery.update({
        where: { id: existing.id },
        data: {
          searchCount: { increment: 1 },
          lastSearchedAt: new Date(),
          displayQuery: display,
        },
      });
      await this.prisma.userSearchHistory.create({
        data: { userId, searchQueryId: existing.id },
      });
    } else {
      const created = await this.prisma.searchQuery.create({
        data: {
          normalizedQuery: normalized,
          displayQuery: display,
          searchCount: 1,
        },
      });
      await this.prisma.userSearchHistory.create({
        data: { userId, searchQueryId: created.id },
      });
    }
  }

  async getRecentSearches(userId: number, limit = 10): Promise<string[]> {
    const histories = await this.prisma.userSearchHistory.findMany({
      where: { userId },
      orderBy: { searchedAt: "desc" },
      take: limit,
      distinct: ["searchQueryId"],
      select: {
        searchQuery: { select: { displayQuery: true } },
      },
    });
    return histories.map((h) => h.searchQuery.displayQuery);
  }

  async getTopSearches(period: "week" | "month" | "all" = "week", limit = 10): Promise<Array<{ query: string; count: number }>> {
    const windowStart = new Date();
    if (period === "week") {
      windowStart.setDate(windowStart.getDate() - 7);
    } else if (period === "month") {
      windowStart.setMonth(windowStart.getMonth() - 1);
    } else {
      windowStart.setFullYear(windowStart.getFullYear() - 100);
    }

    const results = await this.prisma.searchQuery.findMany({
      where: period === "all" ? {} : { lastSearchedAt: { gte: windowStart } },
      orderBy: { searchCount: "desc" },
      take: limit,
      select: { displayQuery: true, searchCount: true },
    });
    return results.map((r) => ({ query: r.displayQuery, count: r.searchCount }));
  }

  async clearRecentSearches(userId: number): Promise<void> {
    await this.prisma.userSearchHistory.deleteMany({ where: { userId } });
  }

  private async pruneOldEntries(): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    await this.prisma.searchQuery.deleteMany({
      where: { lastSearchedAt: { lt: cutoff } },
    });
  }
}
