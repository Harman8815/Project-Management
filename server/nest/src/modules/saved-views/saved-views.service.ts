import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export interface SavedViewData {
  viewName: string;
  viewType: string;
  filters: any;
  sortConfig?: any;
  columnConfig?: any;
  isDefault?: boolean;
}

@Injectable()
export class SavedViewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, data: SavedViewData) {
    // Check if user already has a default view for this type
    if (data.isDefault) {
      await this.prisma.savedView.updateMany({
        where: { userId, viewType: data.viewType, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.savedView.create({
      data: {
        userId,
        viewName: data.viewName,
        viewType: data.viewType,
        filters: data.filters,
        sortConfig: data.sortConfig,
        columnConfig: data.columnConfig,
        isDefault: data.isDefault || false,
      },
    });
  }

  async findAll(userId: number, viewType?: string) {
    const where: any = { userId };
    if (viewType) {
      where.viewType = viewType;
    }
    return this.prisma.savedView.findMany({
      where,
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }

  async findOne(id: number, userId: number) {
    const view = await this.prisma.savedView.findUnique({
      where: { id },
    });
    if (!view) {
      throw new NotFoundException(`Saved view with id ${id} not found`);
    }
    if (view.userId !== userId) {
      throw new ForbiddenException("You do not have access to this saved view");
    }
    return view;
  }

  async update(id: number, userId: number, data: Partial<SavedViewData>) {
    const view = await this.findOne(id, userId);
    
    if (data.isDefault && data.viewType) {
      await this.prisma.savedView.updateMany({
        where: { userId, viewType: data.viewType, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.savedView.update({
      where: { id },
      data: {
        viewName: data.viewName,
        viewType: data.viewType,
        filters: data.filters,
        sortConfig: data.sortConfig,
        columnConfig: data.columnConfig,
        isDefault: data.isDefault,
      },
    });
  }

  async delete(id: number, userId: number) {
    await this.findOne(id, userId);
    return this.prisma.savedView.delete({
      where: { id },
    });
  }

  async execute(userId: number, id: number, query?: { projectId?: number }) {
    const view = await this.findOne(id, userId);
    
    // Apply project filter if provided
    const filters = { ...view.filters };
    if (query?.projectId) {
      filters.projectId = query.projectId;
    }
    
    return {
      view,
      filters,
      sortConfig: view.sortConfig,
      columnConfig: view.columnConfig,
    };
  }

  async getDefaultView(userId: number, viewType: string) {
    return this.prisma.savedView.findFirst({
      where: { userId, viewType, isDefault: true },
    });
  }
}