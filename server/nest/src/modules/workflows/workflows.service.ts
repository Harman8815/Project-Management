import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateWorkflowDto, UpdateWorkflowDto, WorkflowDefinition } from "./dto/create-workflow.dto";
import { getPaginationParams } from "../../common/utils/pagination.util";
import { PaginationDto } from "../../common/dto/pagination.dto";

@Injectable()
export class WorkflowsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createWorkflowDto: CreateWorkflowDto, actorId: number) {
    // Verify organization membership
    await this.checkOrganizationAccess(actorId, createWorkflowDto.organizationId, ["ADMIN", "OWNER"]);
    
    // Validate workflow definition
    this.validateWorkflowDefinition(createWorkflowDto.definition);
    
    // Check if default state exists in definition
    if (!createWorkflowDto.definition.states[createWorkflowDto.definition.defaultState]) {
      throw new BadRequestException("Default state must exist in workflow definition");
    }

    return this.prisma.organizationSetting.create({
      data: {
        organizationId: createWorkflowDto.organizationId,
        key: `workflow_${createWorkflowDto.type}`,
        value: JSON.stringify({
          name: createWorkflowDto.name,
          description: createWorkflowDto.description,
          type: createWorkflowDto.type,
          definition: createWorkflowDto.definition,
          createdBy: actorId,
          createdAt: new Date().toISOString(),
        }),
      },
    });
  }

  async findAll(query: PaginationDto & { organizationId?: number; type?: string }, userId?: number) {
    const { skip, take } = getPaginationParams(query);

    const where: any = {};
    if (query.organizationId) {
      where.organizationId = Number(query.organizationId);
      
      // Check if user has access to the organization
      if (userId) {
        await this.checkOrganizationAccess(userId, Number(query.organizationId));
      }
    }
    if (query.type) {
      where.key = `workflow_${query.type}`;
    }

    const settings = await this.prisma.organizationSetting.findMany({
      where,
      skip,
      take,
      orderBy: { updatedAt: "desc" },
    });

    const workflows = settings.map(setting => ({
      id: setting.id,
      ...JSON.parse(setting.value),
    }));

    const total = await this.prisma.organizationSetting.count({ where });
    return { data: workflows, meta: { total, page: query.page || 1, limit: query.limit || 10 } };
  }

  async findOne(organizationId: number, type: string, userId?: number) {
    // Check if user has access to the organization
    if (userId) {
      await this.checkOrganizationAccess(userId, organizationId);
    }

    const setting = await this.prisma.organizationSetting.findUnique({
      where: {
        organizationId_key: {
          organizationId,
          key: `workflow_${type}`,
        },
      },
    });

    if (!setting) {
      throw new NotFoundException(`Workflow of type ${type} not found for organization ${organizationId}`);
    }

    return {
      id: setting.id,
      ...JSON.parse(setting.value),
    };
  }

  async update(organizationId: number, type: string, updateWorkflowDto: UpdateWorkflowDto, actorId: number) {
    // Check if user has access to the organization
    await this.checkOrganizationAccess(actorId, organizationId, ["ADMIN", "OWNER"]);

    const setting = await this.prisma.organizationSetting.findUnique({
      where: {
        organizationId_key: {
          organizationId,
          key: `workflow_${type}`,
        },
      },
    });

    if (!setting) {
      throw new NotFoundException(`Workflow of type ${type} not found for organization ${organizationId}`);
    }

    const currentWorkflow = JSON.parse(setting.value);
    const updatedWorkflow = {
      ...currentWorkflow,
      ...updateWorkflowDto,
      updatedAt: new Date().toISOString(),
      updatedBy: actorId,
    };

    // Validate updated definition if provided
    if (updateWorkflowDto.definition) {
      this.validateWorkflowDefinition(updateWorkflowDto.definition);
      
      if (updateWorkflowDto.definition.defaultState && !updateWorkflowDto.definition.states[updateWorkflowDto.definition.defaultState]) {
        throw new BadRequestException("Default state must exist in workflow definition");
      }
    }

    return this.prisma.organizationSetting.update({
      where: {
        organizationId_key: {
          organizationId,
          key: `workflow_${type}`,
        },
      },
      data: {
        value: JSON.stringify(updatedWorkflow),
      },
    });
  }

  async remove(organizationId: number, type: string, actorId: number) {
    // Check if user has access to the organization
    await this.checkOrganizationAccess(actorId, organizationId, ["ADMIN", "OWNER"]);

    const setting = await this.prisma.organizationSetting.findUnique({
      where: {
        organizationId_key: {
          organizationId,
          key: `workflow_${type}`,
        },
      },
    });

    if (!setting) {
      throw new NotFoundException(`Workflow of type ${type} not found for organization ${organizationId}`);
    }

    await this.prisma.organizationSetting.delete({
      where: {
        organizationId_key: {
          organizationId,
          key: `workflow_${type}`,
        },
      },
    });

    return { message: "Workflow deleted successfully" };
  }

  async validateTransition(organizationId: number, type: string, currentState: string, newState: string) {
    const workflow = await this.findOne(organizationId, type);
    
    const stateConfig = workflow.definition.states[currentState];
    if (!stateConfig) {
      throw new BadRequestException(`Current state ${currentState} not found in workflow definition`);
    }

    if (!stateConfig.allowedTransitions.includes(newState)) {
      throw new BadRequestException(`Transition from ${currentState} to ${newState} is not allowed`);
    }

    return { valid: true, allowed: true };
  }

  async executeTransitionActions(organizationId: number, type: string, transition: string, context: any) {
    const workflow = await this.findOne(organizationId, type);
    
    // Find the state that has this transition
    const fromState = Object.keys(workflow.definition.states).find(
      state => workflow.definition.states[state].allowedTransitions.includes(transition)
    );

    if (!fromState) {
      throw new BadRequestException(`Transition ${transition} not found in workflow definition`);
    }

    const stateConfig = workflow.definition.states[fromState];
    const actions = stateConfig.actions?.filter((action: any) => action.onTransition === transition) || [];

    // Execute actions (in production, this would be more sophisticated)
    const executedActions = actions.map((action: any) => ({
      type: action.type,
      status: "executed",
      result: action.config || {},
    }));

    return {
      transition,
      fromState,
      toState: transition,
      actionsExecuted: executedActions,
    };
  }

  private validateWorkflowDefinition(definition: WorkflowDefinition) {
    if (!definition.states || Object.keys(definition.states).length === 0) {
      throw new BadRequestException("Workflow definition must have at least one state");
    }

    for (const [stateKey, stateConfig] of Object.entries(definition.states)) {
      if (!stateConfig.label) {
        throw new BadRequestException(`State ${stateKey} must have a label`);
      }

      if (!stateConfig.allowedTransitions || !Array.isArray(stateConfig.allowedTransitions)) {
        throw new BadRequestException(`State ${stateKey} must have allowedTransitions array`);
      }

      // Validate that all target states exist
      for (const transition of stateConfig.allowedTransitions) {
        if (!definition.states[transition]) {
          throw new BadRequestException(`Transition target state ${transition} does not exist in workflow definition`);
        }
      }
    }
  }

  private async checkOrganizationAccess(userId: number, organizationId: number, requiredRoles: string[] = []): Promise<void> {
    const membership = await this.prisma.organizationMembership.findFirst({
      where: { userId, organizationId },
    });

    if (!membership) {
      throw new ForbiddenException("You do not have access to this organization");
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(membership.role)) {
      throw new ForbiddenException("You do not have the required role for this operation");
    }
  }
}
