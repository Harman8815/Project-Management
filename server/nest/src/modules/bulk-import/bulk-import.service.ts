import { Injectable, BadRequestException, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import * as XLSX from "xlsx";

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: any;
}

export interface ValidationReport {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  totalRows: number;
  validRows: number;
  preview: any[];
}

export interface ImportSummary {
  created: number;
  updated: number;
  skipped: number;
  errors: ValidationError[];
}

@Injectable()
export class BulkImportService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly ENTITY_SCHEMAS = {
    employees: {
      required: ["username", "email"],
      optional: ["experienceLevel", "availability", "teamId", "capacityHoursPerWeek"],
      types: {
        username: "string",
        email: "string",
        experienceLevel: "string",
        availability: "string",
        teamId: "number",
        capacityHoursPerWeek: "number",
      },
      enumValues: {
        experienceLevel: ["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD"],
        availability: ["FULL_TIME", "PART_TIME", "BENCH", "UNAVAILABLE"],
      },
    },
    projects: {
      required: ["name", "key"],
      optional: ["description", "startDate", "endDate", "status", "priority", "health"],
      types: {
        name: "string",
        key: "string",
        description: "string",
        startDate: "date",
        endDate: "date",
        status: "string",
        priority: "string",
        health: "string",
      },
      enumValues: {
        status: ["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"],
        priority: ["Urgent", "High", "Medium", "Low", "Backlog"],
        health: ["ON_TRACK", "AT_RISK", "OFF_TRACK", "BLOCKED"],
      },
    },
    skills: {
      required: ["name"],
      optional: ["category"],
      types: {
        name: "string",
        category: "string",
      },
    },
    projectMemberships: {
      required: ["userId", "projectId"],
      optional: ["role"],
      types: {
        userId: "number",
        projectId: "number",
        role: "string",
      },
      enumValues: {
        role: ["OWNER", "ADMIN", "MEMBER"],
      },
    },
    employeeSkills: {
      required: ["userId", "skillId"],
      optional: ["level", "yearsExp"],
      types: {
        userId: "number",
        skillId: "number",
        level: "string",
        yearsExp: "number",
      },
      enumValues: {
        level: ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"],
      },
    },
  };

  getTemplateHeaders(entity: string): string[] {
    const schema = this.ENTITY_SCHEMAS[entity as keyof typeof this.ENTITY_SCHEMAS];
    if (!schema) {
      throw new BadRequestException(`Unknown entity: ${entity}`);
    }
    return [...schema.required, ...schema.optional];
  }

  parseFile(buffer: Buffer, filename: string): any[] {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet, { defval: "" });
  }

  validateRows(entity: string, rows: any[]): ValidationReport {
    const schema = this.ENTITY_SCHEMAS[entity as keyof typeof this.ENTITY_SCHEMAS];
    if (!schema) {
      throw new BadRequestException(`Unknown entity: ${entity}`);
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const preview = rows.slice(0, 5).map((row, i) => ({ row: i + 1, data: row }));

    rows.forEach((row, rowIndex) => {
      const rowNum = rowIndex + 2; // +2 for header and 0-index

      // Check required fields
      for (const field of schema.required) {
        const value = row[field];
        if (value === undefined || value === null || value === "") {
          errors.push({
            row: rowNum,
            field,
            message: `Required field '${field}' is missing`,
            value,
          });
        }
      }

      // Validate types and enum values
      for (const [field, expectedType] of Object.entries(schema.types)) {
        const value = row[field];
        if (value === undefined || value === null || value === "") continue;

        if (expectedType === "number") {
          const num = Number(value);
          if (isNaN(num)) {
            errors.push({
              row: rowNum,
              field,
              message: `Field '${field}' must be a number`,
              value,
            });
          }
        } else if (expectedType === "date") {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            errors.push({
              row: rowNum,
              field,
              message: `Field '${field}' must be a valid date`,
              value,
            });
          }
        } else if (expectedType === "boolean") {
          const str = String(value).toLowerCase();
          if (!["true", "false", "1", "0", "yes", "no"].includes(str)) {
            errors.push({
              row: rowNum,
              field,
              message: `Field '${field}' must be a boolean (true/false)`,
              value,
            });
          }
        }
      }

      // Check enum values
      for (const [field, allowedValues] of Object.entries(schema.enumValues || {})) {
        const value = row[field];
        if (value === undefined || value === null || value === "") continue;
        if (!allowedValues.includes(value)) {
          errors.push({
            row: rowNum,
            field,
            message: `Field '${field}' must be one of: ${allowedValues.join(", ")}`,
            value,
          });
        }
      }

      // Check for duplicate usernames/emails for employees
      if (entity === "employees") {
        if (row.username) {
          const duplicateIndex = rows.findIndex(
            (r, i) => i !== rowIndex && r.username === row.username
          );
          if (duplicateIndex >= 0) {
            warnings.push({
              row: rowNum,
              field: "username",
              message: `Duplicate username found at row ${duplicateIndex + 2}`,
              value: row.username,
            });
          }
        }
        if (row.email) {
          const duplicateIndex = rows.findIndex(
            (r, i) => i !== rowIndex && r.email === row.email
          );
          if (duplicateIndex >= 0) {
            warnings.push({
              row: rowNum,
              field: "email",
              message: `Duplicate email found at row ${duplicateIndex + 2}`,
              value: row.email,
            });
          }
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      totalRows: rows.length,
      validRows: rows.length - errors.length,
      preview,
    };
  }

  async importEmployees(rows: any[]): Promise<ImportSummary> {
    const summary: ImportSummary = { created: 0, updated: 0, skipped: 0, errors: [] };

    for (const row of rows) {
      try {
        const existing = await this.prisma.user.findUnique({
          where: { username: row.username },
        });

        if (existing) {
          await this.prisma.user.update({
            where: { userId: existing.userId },
            data: {
              email: row.email,
              experienceLevel: row.experienceLevel,
              availability: row.availability,
              teamId: row.teamId ? Number(row.teamId) : null,
              capacityHoursPerWeek: row.capacityHoursPerWeek ? Number(row.capacityHoursPerWeek) : 40,
            },
          });
          summary.updated++;
        } else {
          await this.prisma.user.create({
            data: {
              username: row.username,
              email: row.email,
              cognitoId: `imported-${row.username}`,
              experienceLevel: row.experienceLevel,
              availability: row.availability || "FULL_TIME",
              teamId: row.teamId ? Number(row.teamId) : null,
              capacityHoursPerWeek: row.capacityHoursPerWeek ? Number(row.capacityHoursPerWeek) : 40,
            },
          });
          summary.created++;
        }
      } catch (error: any) {
        summary.errors.push({
          row: 0,
          field: "username",
          message: error.message,
          value: row.username,
        });
        summary.skipped++;
      }
    }

    return summary;
  }

  async importProjects(rows: any[]): Promise<ImportSummary> {
    const summary: ImportSummary = { created: 0, updated: 0, skipped: 0, errors: [] };

    for (const row of rows) {
      try {
        const existing = await this.prisma.project.findUnique({
          where: { key: row.key },
        });

        if (existing) {
          await this.prisma.project.update({
            where: { id: existing.id },
            data: {
              name: row.name,
              description: row.description,
              startDate: row.startDate ? new Date(row.startDate) : null,
              endDate: row.endDate ? new Date(row.endDate) : null,
              status: row.status,
              priority: row.priority,
              health: row.health,
            },
          });
          summary.updated++;
        } else {
          await this.prisma.project.create({
            data: {
              key: row.key,
              name: row.name,
              description: row.description,
              startDate: row.startDate ? new Date(row.startDate) : null,
              endDate: row.endDate ? new Date(row.endDate) : null,
              dueDate: row.endDate ? new Date(row.endDate) : null,
              status: row.status || "PLANNED",
              priority: row.priority || "MEDIUM",
              health: row.health || "ON_TRACK",
            },
          });
          summary.created++;
        }
      } catch (error: any) {
        summary.errors.push({
          row: 0,
          field: "key",
          message: error.message,
          value: row.key,
        });
        summary.skipped++;
      }
    }

    return summary;
  }

  async importSkills(rows: any[]): Promise<ImportSummary> {
    const summary: ImportSummary = { created: 0, updated: 0, skipped: 0, errors: [] };

    for (const row of rows) {
      try {
        const existing = await this.prisma.skill.findUnique({
          where: { name: row.name },
        });

        if (existing) {
          await this.prisma.skill.update({
            where: { id: existing.id },
            data: { category: row.category },
          });
          summary.updated++;
        } else {
          await this.prisma.skill.create({
            data: {
              name: row.name,
              category: row.category,
            },
          });
          summary.created++;
        }
      } catch (error: any) {
        summary.errors.push({
          row: 0,
          field: "name",
          message: error.message,
          value: row.name,
        });
        summary.skipped++;
      }
    }

    return summary;
  }

  async importProjectMemberships(rows: any[]): Promise<ImportSummary> {
    const summary: ImportSummary = { created: 0, updated: 0, skipped: 0, errors: [] };

    for (const row of rows) {
      try {
        const existing = await this.prisma.projectMembership.findFirst({
          where: {
            userId: Number(row.userId),
            projectId: Number(row.projectId),
          },
        });

        if (existing) {
          await this.prisma.projectMembership.update({
            where: { id: existing.id },
            data: {
              role: row.role || "MEMBER",
              status: "ACTIVE",
            },
          });
          summary.updated++;
        } else {
          await this.prisma.projectMembership.create({
            data: {
              userId: Number(row.userId),
              projectId: Number(row.projectId),
              role: row.role || "MEMBER",
              status: "ACTIVE",
            },
          });
          summary.created++;
        }
      } catch (error: any) {
        summary.errors.push({
          row: 0,
          field: "userId",
          message: error.message,
          value: row.userId,
        });
        summary.skipped++;
      }
    }

    return summary;
  }

  async importEmployeeSkills(rows: any[]): Promise<ImportSummary> {
    const summary: ImportSummary = { created: 0, updated: 0, skipped: 0, errors: [] };

    for (const row of rows) {
      try {
        const existing = await this.prisma.employeeSkill.findFirst({
          where: {
            userId: Number(row.userId),
            skillId: Number(row.skillId),
          },
        });

        if (existing) {
          await this.prisma.employeeSkill.update({
            where: { id: existing.id },
            data: {
              level: row.level || "INTERMEDIATE",
              yearsExp: row.yearsExp ? Number(row.yearsExp) : null,
            },
          });
          summary.updated++;
        } else {
          await this.prisma.employeeSkill.create({
            data: {
              userId: Number(row.userId),
              skillId: Number(row.skillId),
              level: row.level || "INTERMEDIATE",
              yearsExp: row.yearsExp ? Number(row.yearsExp) : null,
            },
          });
          summary.created++;
        }
      } catch (error: any) {
        summary.errors.push({
          row: 0,
          field: "userId",
          message: error.message,
          value: row.userId,
        });
        summary.skipped++;
      }
    }

    return summary;
  }

  async importData(entity: string, rows: any[]): Promise<ImportSummary> {
    switch (entity) {
      case "employees":
        return this.importEmployees(rows);
      case "projects":
        return this.importProjects(rows);
      case "skills":
        return this.importSkills(rows);
      case "projectMemberships":
        return this.importProjectMemberships(rows);
      case "employeeSkills":
        return this.importEmployeeSkills(rows);
      default:
        throw new BadRequestException(`Import not supported for entity: ${entity}`);
    }
  }

  async exportData(entity: string, format: "csv" | "xlsx" = "xlsx"): Promise<Buffer> {
    let data: any[] = [];
    let headers: string[] = [];

    switch (entity) {
      case "employees":
        data = await this.prisma.user.findMany({
          include: {
            employeeSkills: { include: { skill: true } },
            projectMemberships: { where: { status: "ACTIVE" }, include: { project: true } },
          },
        });
        data = data.map((u) => ({
          username: u.username,
          email: u.cognitoId,
          experienceLevel: u.experienceLevel,
          availability: u.availability,
          teamId: u.teamId,
          capacityHoursPerWeek: u.capacityHoursPerWeek,
          skills: u.employeeSkills.map((es) => es.skill.name).join("; "),
          projects: u.projectMemberships.map((pm) => pm.project.name).join("; "),
        }));
        headers = ["username", "email", "experienceLevel", "availability", "teamId", "capacityHoursPerWeek", "skills", "projects"];
        break;

      case "projects":
        data = await this.prisma.project.findMany({
          include: {
            members: { where: { status: "ACTIVE" }, include: { user: true } },
          },
        });
        data = data.map((p) => ({
          key: p.key,
          name: p.name,
          description: p.description,
          startDate: p.startDate?.toISOString().split("T")[0],
          endDate: p.endDate?.toISOString().split("T")[0],
          status: p.status,
          priority: p.priority,
          health: p.health,
          memberCount: p.members.length,
        }));
        headers = ["key", "name", "description", "startDate", "endDate", "status", "priority", "health", "memberCount"];
        break;

      case "skills":
        data = await this.prisma.skill.findMany({
          include: { employeeSkills: { include: { user: true } } },
        });
        data = data.map((s) => ({
          name: s.name,
          category: s.category,
          employeeCount: s.employeeSkills.length,
        }));
        headers = ["name", "category", "employeeCount"];
        break;

      case "projectMemberships":
        data = await this.prisma.projectMembership.findMany({
          where: { status: "ACTIVE" },
          include: { user: true, project: true },
        });
        data = data.map((pm) => ({
          userId: pm.userId,
          projectId: pm.projectId,
          username: pm.user.username,
          projectName: pm.project.name,
          role: pm.role,
          status: pm.status,
        }));
        headers = ["userId", "projectId", "username", "projectName", "role", "status"];
        break;

      case "employeeSkills":
        data = await this.prisma.employeeSkill.findMany({
          include: { user: true, skill: true },
        });
        data = data.map((es) => ({
          userId: es.userId,
          skillId: es.skillId,
          username: es.user.username,
          skillName: es.skill.name,
          skillCategory: es.skill.category,
          level: es.level,
          yearsExp: es.yearsExp,
        }));
        headers = ["userId", "skillId", "username", "skillName", "skillCategory", "level", "yearsExp"];
        break;

      default:
        throw new BadRequestException(`Export not supported for entity: ${entity}`);
    }

    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, entity);

    if (format === "csv") {
      return Buffer.from(XLSX.utils.sheet_to_csv(worksheet));
    }
    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  }
}