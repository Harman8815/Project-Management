import { Controller, Post, Get, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, Res } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { BulkImportService, ValidationReport, ImportSummary } from "./bulk-import.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags("bulk-import")
@ApiBearerAuth()
@Controller("bulk")
@UseGuards(JwtAuthGuard, RolesGuard)
export class BulkImportController {
  constructor(private readonly bulkImportService: BulkImportService) {}

  @Get("templates/:entity")
  @Roles("ADMIN", "OWNER")
  async getTemplate(@Param("entity") entity: string, @Res() res: Response) {
    const headers = this.bulkImportService.getTemplateHeaders(entity);
    const csv = headers.join(",") + "\n";
    
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${entity}-template.csv"`);
    res.send(csv);
  }

  @Post("import/validate")
  @Roles("ADMIN", "OWNER")
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
        entity: { type: "string", enum: ["employees", "projects", "skills", "projectMemberships", "employeeSkills"] },
      },
    },
  })
  async validateFile(
    @UploadedFile() file: Express.Multer.File,
    @Body("entity") entity: string,
  ): Promise<ValidationReport> {
    if (!file) {
      throw new Error("No file uploaded");
    }

    const rows = this.bulkImportService.parseFile(file.buffer, file.originalname);
    return this.bulkImportService.validateRows(entity, rows);
  }

  @Post("import/confirm")
  @Roles("ADMIN", "OWNER")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        entity: { type: "string", enum: ["employees", "projects", "skills", "projectMemberships", "employeeSkills"] },
        data: { type: "array", items: { type: "object" } },
      },
    },
  })
  async confirmImport(
    @Body() body: { entity: string; data: any[] },
  ): Promise<ImportSummary> {
    return this.bulkImportService.importData(body.entity, body.data);
  }

  @Get("export/:entity")
  @Roles("ADMIN", "OWNER")
  @ApiQuery({ name: "format", required: false, enum: ["csv", "xlsx"] })
  async exportData(
    @Param("entity") entity: string,
    @Query("format") format: "csv" | "xlsx" = "xlsx",
    @Res() res: Response,
  ) {
    const buffer = await this.bulkImportService.exportData(entity, format);
    
    const ext = format === "csv" ? "csv" : "xlsx";
    const mime = format === "csv" ? "text/csv" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    
    res.setHeader("Content-Type", mime);
    res.setHeader("Content-Disposition", `attachment; filename="${entity}-export.${ext}"`);
    res.send(buffer);
  }
}