/*
  Phase 3 - Methodology field on Project + MethodologyConfig table
*/

-- Add methodology field to Project
ALTER TABLE "Project" ADD COLUMN "methodology" TEXT NOT NULL DEFAULT 'KANBAN';

-- CreateTable
CREATE TABLE "MethodologyConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL UNIQUE,
    "config" TEXT NOT NULL DEFAULT '{}',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default methodology configs
INSERT INTO "MethodologyConfig" ("name", "key", "config", "isDefault", "createdAt", "updatedAt") VALUES
('Kanban', 'KANBAN', '{"workflowStates": ["To Do", "In Progress", "In Review", "Done"], "showBoard": true, "showSprints": true, "showMilestones": true, "showGantt": false, "requiredFields": ["title", "status", "assignee"]}', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Waterfall', 'WATERFALL', '{"phases": ["Requirements", "Design", "Implementation", "Testing", "Deployment"], "showBoard": false, "showSprints": false, "showMilestones": true, "showGantt": true, "requiredFields": ["title", "phase", "startDate", "endDate"]}', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Scrum', 'SCRUM', '{"workflowStates": ["Backlog", "Sprint Planning", "In Progress", "In Review", "Done"], "showBoard": true, "showSprints": true, "showMilestones": true, "showGantt": false, "requiredFields": ["title", "status", "assignee", "storyPoints"]}', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);