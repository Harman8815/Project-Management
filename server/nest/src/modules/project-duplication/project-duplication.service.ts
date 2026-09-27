import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ProjectMembershipsService } from "../project-memberships/project-memberships.service";

export interface DuplicateOptions {
  includeTasks?: boolean;
  includeTaskStructure?: boolean;
  includeSprints?: boolean;
  includeMilestones?: boolean;
  includeWorkflows?: boolean;
  includeCustomFields?: boolean;
}

@Injectable()
export class ProjectDuplicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectMembershipsService: ProjectMembershipsService,
  ) {}

  async duplicate(
    sourceProjectId: number,
    actorId: number,
    options: {
      name: string;
      key: string;
      include: DuplicateOptions;
    },
  ) {
    // Check access to source project
    const sourceAccess = await this.projectMembershipsService.checkUserAccess(
      actorId,
      sourceProjectId,
      ["OWNER", "ADMIN"],
    );
    if (!sourceAccess) {
      throw new ForbiddenException("You do not have permission to duplicate this project");
    }

    // Check if key already exists
    const existingKey = await this.prisma.project.findUnique({
      where: { key: options.key },
    });
    if (existingKey) {
      throw new BadRequestException(`Project with key ${options.key} already exists`);
    }

    return this.prisma.$transaction(async (prisma) => {
      // Get source project
      const sourceProject = await prisma.project.findUnique({
        where: { id: sourceProjectId },
        include: {
          tasks: options.include.includeTasks ? { include: { children: true } } : false,
          sprints: options.include.includeSprints ? true : false,
          milestones: options.include.includeMilestones ? true : false,
          customFieldValues: options.include.includeCustomFields ? { include: { definition: true } } : false,
        },
      });

      if (!sourceProject) {
        throw new NotFoundException("Source project not found");
      }

      // Create new project
      const newProject = await prisma.project.create({
        data: {
          key: options.key,
          name: options.name,
          description: sourceProject.description,
          startDate: sourceProject.startDate,
          endDate: sourceProject.endDate,
          dueDate: sourceProject.dueDate,
          status: "PLANNED",
          priority: sourceProject.priority,
          health: "ON_TRACK",
          organizationId: sourceProject.organizationId,
        },
      });

      // Add actor as owner of new project
      await prisma.projectMembership.create({
        data: {
          userId: actorId,
          projectId: newProject.id,
          role: "OWNER",
          status: "ACTIVE",
        },
      });

      // Duplicate tasks if requested
      const taskIdMap = new Map<number, number>();
      if (options.include.includeTasks && sourceProject.tasks) {
        // First pass: create all tasks without relationships
        for (const task of sourceProject.tasks) {
          const newTask = await prisma.task.create({
            data: {
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              severity: task.severity,
              type: task.type,
              tags: task.tags,
              startDate: task.startDate,
              dueDate: task.dueDate,
              points: task.points,
              estimateHours: task.estimateHours,
              acceptanceCriteria: task.acceptanceCriteria,
              projectId: newProject.id,
              authorUserId: actorId,
              assignedUserId: task.assignedUserId,
              sprintId: null, // Will be updated after sprints are created
              milestoneId: null, // Will be updated after milestones are created
            },
          });
          taskIdMap.set(task.id, newTask.id);
        }

        // Second pass: update parent-child relationships
        if (options.include.includeTaskStructure) {
          for (const task of sourceProject.tasks) {
            if (task.parentId && taskIdMap.has(task.parentId)) {
              await prisma.task.update({
                where: { id: taskIdMap.get(task.id)! },
                data: { parentId: taskIdMap.get(task.parentId) },
              });
            }
          }

          // Third pass: update task dependencies
          for (const task of sourceProject.tasks) {
            const dependencies = await prisma.taskDependency.findMany({
              where: { taskId: task.id },
            });
            for (const dep of dependencies) {
              if (taskIdMap.has(dep.blockedById) && taskIdMap.has(dep.taskId)) {
                await prisma.taskDependency.create({
                  data: {
                    taskId: taskIdMap.get(dep.taskId)!,
                    blockedById: taskIdMap.get(dep.blockedById)!,
                  },
                });
              }
            }
          }
        }
      }

      // Duplicate sprints if requested
      const sprintIdMap = new Map<number, number>();
      if (options.include.includeSprints && sourceProject.sprints) {
        for (const sprint of sourceProject.sprints) {
          const newSprint = await prisma.sprint.create({
            data: {
              name: sprint.name,
              projectId: newProject.id,
              goal: sprint.goal,
              startDate: sprint.startDate,
              endDate: sprint.endDate,
              status: "PLANNED",
              capacity: sprint.capacity,
              ownerId: actorId,
            },
          });
          sprintIdMap.set(sprint.id, newSprint.id);
        }

        // Update task sprint assignments
        if (options.include.includeTasks) {
          for (const [oldTaskId, newTaskId] of taskIdMap.entries()) {
            const oldTask = sourceProject.tasks.find(t => t.id === oldTaskId);
            if (oldTask?.sprintId && sprintIdMap.has(oldTask.sprintId)) {
              await prisma.task.update({
                where: { id: newTaskId },
                data: { sprintId: sprintIdMap.get(oldTask.sprintId)! },
              });
            }
          }
        }
      }

      // Duplicate milestones if requested
      const milestoneIdMap = new Map<number, number>();
      if (options.include.includeMilestones && sourceProject.milestones) {
        for (const milestone of sourceProject.milestones) {
          const newMilestone = await prisma.milestone.create({
            data: {
              name: milestone.name,
              description: milestone.description,
              projectId: newProject.id,
              startDate: milestone.startDate,
              dueDate: milestone.dueDate,
              status: "PLANNED",
              ownerId: actorId,
            },
          });
          milestoneIdMap.set(milestone.id, newMilestone.id);
        }

        // Update task milestone assignments
        if (options.include.includeTasks) {
          for (const [oldTaskId, newTaskId] of taskIdMap.entries()) {
            const oldTask = sourceProject.tasks.find(t => t.id === oldTaskId);
            if (oldTask?.milestoneId && milestoneIdMap.has(oldTask.milestoneId)) {
              await prisma.task.update({
                where: { id: newTaskId },
                data: { milestoneId: milestoneIdMap.get(oldTask.milestoneId)! },
              });
            }
          }
        }
      }

      // Duplicate custom field values if requested
      if (options.include.includeCustomFields && sourceProject.customFieldValues) {
        for (const cfv of sourceProject.customFieldValues) {
          await prisma.customFieldValue.create({
            data: {
              definitionId: cfv.definitionId,
              projectId: newProject.id,
              value: cfv.value,
            },
          });
        }
      }

      // Create activity log
      await prisma.activityLog.create({
        data: {
          eventType: "PROJECT_DUPLICATED",
          actorId,
          projectId: newProject.id,
          message: `Project duplicated from ${sourceProject.name} (${sourceProject.key})`,
          metadata: JSON.stringify({
            sourceProjectId,
            sourceProjectKey: sourceProject.key,
            include: options.include,
          }),
        },
      });

      return newProject;
    });
  }
}