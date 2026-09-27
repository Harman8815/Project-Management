/*
  Phase 4 - Project Customization (iconName, color)
*/

-- Add iconName and color columns to Project
ALTER TABLE "Project" ADD COLUMN "iconName" TEXT;
ALTER TABLE "Project" ADD COLUMN "color" TEXT;