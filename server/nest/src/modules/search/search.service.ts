import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: string) {
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

    return { tasks, projects, users };
  }
}
