import { Injectable, BadRequestException } from "@nestjs/common";

export interface WorkflowTransition {
  from: string;
  to: string;
}

export interface WorkflowDefinition {
  statuses: string[];
  transitions: { from: string; to: string[] }[];
}

export const DEFAULT_WORKFLOW: WorkflowDefinition = {
  statuses: ["To Do", "In Progress", "In Review", "Completed", "Blocked"],
  transitions: [
    { from: "To Do", to: ["In Progress", "Blocked"] },
    { from: "In Progress", to: ["In Review", "Blocked", "To Do"] },
    { from: "In Review", to: ["Completed", "Blocked", "In Progress"] },
    { from: "Blocked", to: ["To Do", "In Progress"] },
    { from: "Completed", to: [] },
  ],
};

@Injectable()
export class WorkflowService {
  private projectWorkflows = new Map<number, WorkflowDefinition>();

  validateTransition(
    currentStatus: string | null | undefined,
    newStatus: string,
    projectId?: number,
  ): boolean {
    if (!currentStatus) {
      return true;
    }

    const workflow = this.getProjectWorkflow(projectId);

    const validTransitions = workflow.transitions.find(
      (t) => t.from === currentStatus,
    );

    if (!validTransitions) {
      throw new BadRequestException(
        `No transitions defined from status "${currentStatus}"`,
      );
    }

    if (!validTransitions.to.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition: "${currentStatus}" -> "${newStatus}". ` +
          `Valid transitions: ${validTransitions.to.join(", ")}`,
      );
    }

    return true;
  }

  getProjectWorkflow(projectId?: number): WorkflowDefinition {
    if (projectId) {
      return this.projectWorkflows.get(projectId) ?? DEFAULT_WORKFLOW;
    }
    return DEFAULT_WORKFLOW;
  }

  setProjectWorkflow(projectId: number, workflow: WorkflowDefinition) {
    this.projectWorkflows.set(projectId, workflow);
  }

  getWorkflowSteps(projectId?: number): string[] {
    return this.getProjectWorkflow(projectId).statuses;
  }

  getValidTransitions(currentStatus: string, projectId?: number) {
    const workflow = this.getProjectWorkflow(projectId);
    const transition = workflow.transitions.find(
      (t) => t.from === currentStatus,
    );
    return transition ? transition.to : [];
  }

  isTerminalStatus(
    status: string,
    projectId?: number,
  ): boolean {
    const workflow = this.getProjectWorkflow(projectId);
    const transition = workflow.transitions.find(
      (t) => t.from === status,
    );
    return transition ? transition.to.length === 0 : true;
  }

  validateStatus(status: string, projectId?: number): boolean {
    const workflow = this.getProjectWorkflow(projectId);
    return workflow.statuses.includes(status);
  }
}
