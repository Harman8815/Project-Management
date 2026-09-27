/*
  Phase 0 - Skill & EmployeeSkill models + User employee attributes

  Adds:
  - Skill table (skill library)
  - EmployeeSkill join table (user <-> skill with level and yearsExp)
  - User: experienceLevel, availability, benchDate, currentProjectId (additive columns)
*/

-- CreateTable
CREATE TABLE "Skill" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL UNIQUE,
    "category" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "EmployeeSkill" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "skillId" INTEGER NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'INTERMEDIATE',
    "yearsExp" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmployeeSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("userId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EmployeeSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeSkill_userId_skillId_key" ON "EmployeeSkill"("userId", "skillId");
CREATE INDEX "EmployeeSkill_userId_idx" ON "EmployeeSkill"("userId");
CREATE INDEX "EmployeeSkill_skillId_idx" ON "EmployeeSkill"("skillId");

-- Add User employee attributes (additive columns - no table redefinition needed)
ALTER TABLE "User" ADD COLUMN "experienceLevel" TEXT;
ALTER TABLE "User" ADD COLUMN "availability" TEXT;
ALTER TABLE "User" ADD COLUMN "benchDate" DATETIME;
ALTER TABLE "User" ADD COLUMN "currentProjectId" INTEGER;