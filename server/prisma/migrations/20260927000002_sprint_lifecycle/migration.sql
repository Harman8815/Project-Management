/*
  Phase 3 - Sprint Lifecycle Statuses
*/

-- Update Sprint status to include lifecycle states
-- We need to update existing data and add new status values

-- First, update existing sprints to new status values based on dates
UPDATE "Sprint" SET "status" = 'UPCOMING' WHERE "status" = 'PLANNED' AND "startDate" > date('now');
UPDATE "Sprint" SET "status" = 'ACTIVE' WHERE "status" = 'PLANNED' AND "startDate" <= date('now') AND "endDate" >= date('now');
UPDATE "Sprint" SET "status" = 'NEAR_COMPLETION' WHERE "status" = 'ACTIVE' AND "endDate" < date('now', '+7 days') AND "endDate" > date('now');
UPDATE "Sprint" SET "status" = 'COMPLETED' WHERE "status" = 'COMPLETED';
UPDATE "Sprint" SET "status" = 'CLOSED' WHERE "status" = 'COMPLETED' AND "endDate" < date('now', '-30 days');