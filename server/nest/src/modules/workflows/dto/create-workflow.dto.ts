import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsObject, IsOptional, IsNumber } from "class-validator";

export class CreateWorkflowDto {
  @ApiProperty({ description: "Workflow name" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: "Workflow description" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: "Organization ID" })
  @IsNumber()
  organizationId: number;

  @ApiProperty({ description: "Workflow type (task_status, project_lifecycle, etc.)" })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: "Workflow definition with states and transitions" })
  @IsObject()
  definition: WorkflowDefinition;
}

export interface WorkflowDefinition {
  states: {
    [key: string]: {
      label: string;
      color?: string;
      allowedTransitions: string[];
      conditions?: any[];
      actions?: any[];
    };
  };
  defaultState: string;
  metadata?: Record<string, any>;
}

export class UpdateWorkflowDto {
  @ApiProperty({ description: "Workflow name", required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: "Workflow description", required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: "Workflow definition", required: false })
  @IsObject()
  @IsOptional()
  definition?: WorkflowDefinition;
}
