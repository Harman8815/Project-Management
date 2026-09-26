import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { DataGenerator } from "./data-generator";

type Scale = "small" | "medium" | "large";

const VALID_SCALES: Scale[] = ["small", "medium", "large"];
const VALID_MODELS = [
  "users",
  "teams",
  "projects",
  "tasks",
  "sprints",
  "milestones",
  "comments",
  "notifications",
  "organizationMemberships",
  "projectMemberships",
  "customFieldDefinitions",
  "customFieldValues",
  "integrations",
  "searchQueries",
  "userSearchHistories",
  "calendarEvents",
  "calendarSyncs",
  "activityLogs",
  "taskAssignments",
  "taskDependencies",
  "taskWatchers",
  "taskHistory",
  "attachments",
  "commentMentions",
  "integrationEvents",
  "aiRequestLogs",
  "aiFeedback",
  "organizationSettings",
  "organizationMemberships",
  "projectTeams",
  "projectTemplates",
];

@Injectable()
export class DevService {
  private readonly logger = new Logger(DevService.name);
  private readonly isDevMode: boolean;
  private readonly devKey: string | undefined;

  constructor(private readonly prisma: PrismaService) {
    this.isDevMode = process.env.AUTH_DISABLED === "true";
    this.devKey = process.env.DEV_KEY;
  }

  private assertAllowed(providedKey?: string): void {
    if (!this.isDevMode && (!this.devKey || providedKey !== this.devKey)) {
      throw new ForbiddenException(
        "Dev endpoints are only available in development mode or with a valid X-Dev-Key header",
      );
    }
  }

  async populate(scale: Scale, providedKey?: string) {
    this.assertAllowed(providedKey);

    if (!VALID_SCALES.includes(scale)) {
      throw new BadRequestException(
        `Invalid scale. Must be one of: ${VALID_SCALES.join(", ")}`,
      );
    }

    this.logger.warn(`Populating data with scale: ${scale}`);
    const generator = new DataGenerator(42, scale);
    const counts = await generator.generate(this.prisma);
    this.logger.log(`Data population complete:`, counts);
    return counts;
  }

  async clear(models: string[], providedKey?: string) {
    this.assertAllowed(providedKey);

    if (!models || models.length === 0) {
      throw new BadRequestException("At least one model must be specified");
    }

    const invalid = models.filter((m) => !VALID_MODELS.includes(m.toLowerCase()));
    if (invalid.length > 0) {
      throw new BadRequestException(
        `Invalid models: ${invalid.join(", ")}. Valid models: ${VALID_MODELS.join(", ")}`,
      );
    }

    const result: Record<string, number> = {};

    await this.prisma.$transaction(async (tx) => {
      for (const model of models) {
        const modelKey = model.charAt(0).toLowerCase() + model.slice(1);
        const singularKey = modelKey.replace(/ies$/, "y").replace(/s$/, "");
        const prismaModel = (tx as any)[singularKey] || (tx as any)[modelKey];
        if (prismaModel && typeof prismaModel.deleteMany === "function") {
          const { count } = await prismaModel.deleteMany({});
          result[model] = count;
          this.logger.log(`Cleared ${count} records from ${model}`);
        }
      }
    });

    return result;
  }

  async reset(scale: Scale, providedKey?: string) {
    this.assertAllowed(providedKey);

    if (!VALID_SCALES.includes(scale)) {
      throw new BadRequestException(
        `Invalid scale. Must be one of: ${VALID_SCALES.join(", ")}`,
      );
    }

    this.logger.warn(`Resetting database and populating with scale: ${scale}`);

    await this.prisma.$transaction(async (tx) => {
      const clearOrder = [
        "taskHistories",
        "taskWatchers",
        "taskDependencies",
        "taskAssignments",
        "comments",
        "attachments",
        "commentMentions",
        "customFieldValues",
        "customFieldDefinitions",
        "integrationEvents",
        "integrations",
        "aiFeedback",
        "aiRequestLogs",
        "userSearchHistories",
        "searchQueries",
        "notifications",
        "notificationPreferences",
        "activityLogs",
        "milestones",
        "sprints",
        "tasks",
        "projectMemberships",
        "projectTeams",
        "projectTemplates",
        "projects",
        "organizationSettings",
        "organizationMemberships",
        "organizations",
        "users",
        "teams",
      ];

      for (const model of clearOrder) {
        const singularKey = model.replace(/ies$/, "y").replace(/s$/, "");
        const prismaModel = (tx as any)[singularKey];
        if (prismaModel && typeof prismaModel.deleteMany === "function") {
          await prismaModel.deleteMany({});
        }
      }

      await tx.$executeRawUnsafe(`DELETE FROM "User";`);
      await tx.$executeRawUnsafe(`DELETE FROM "Team";`);
    });

    const generator = new DataGenerator(42, scale);
    const counts = await generator.generate(this.prisma);
    this.logger.log(`Reset complete:`, counts);
    return counts;
  }

  async getCurrentCounts() {
    const models: Record<string, any> = {
      organizations: this.prisma.organization,
      users: this.prisma.user,
      teams: this.prisma.team,
      projects: this.prisma.project,
      tasks: this.prisma.task,
      sprints: this.prisma.sprint,
      milestones: this.prisma.milestone,
      comments: this.prisma.comment,
      notifications: this.prisma.notification,
    };

    const counts: Record<string, number> = {};
    for (const [key, model] of Object.entries(models)) {
      counts[key] = await (model as any).count();
    }
    return counts;
  }
}
