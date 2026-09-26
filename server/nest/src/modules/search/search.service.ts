import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { SearchHistoryService } from "./search-history.service";

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly searchHistoryService: SearchHistoryService,
  ) {}

  async search(query: string, userId?: number) {
    if (!query) return { tasks: [], projects: [], users: [] };

    const [tasks, projects, users] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
            { tags: { contains: query } },
          ],
        },
        include: { author: true, assignee: true },
      }),
      this.prisma.project.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { description: { contains: query } },
          ],
        },
      }),
      this.prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: query } },
          ],
        },
      }),
    ]);

    if (userId && query.trim().length >= 3) {
      void this.searchHistoryService.recordSearch(userId, query);
    }

    return { tasks, projects, users };
  }
}
