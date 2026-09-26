/* eslint-disable */
/* generate-seed-data.ts - Script to generate seed data JSON files */
const fs = require("fs");
const path = require("path");

const seedDir = path.join(__dirname, "seedData");

function shuffle(array: any[], rng: () => number) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function seededRandom(seed: number) {
  let state = seed;
  return function () {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

const rng = seededRandom(42);

const orgRoles = ["OWNER", "ADMIN", "MANAGER", "MEMBER"];
const projectRoles = ["OWNER", "ADMIN", "MEMBER"];
const taskStatuses = ["To Do", "Work In Progress", "Under Review", "Completed"];
const taskPriorities = ["Urgent", "High", "Medium", "Low", "Backlog"];
const sprintStatuses = ["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"];
const milestoneStatuses = ["PLANNED", "IN_PROGRESS", "COMPLETED", "DELAYED"];
const notificationTypes = [
  "ASSIGNMENT", "MENTION", "STATUS_CHANGE", "COMMENT",
  "DUE_DATE_REMINDER", "OVERDUE_ALERT", "WORKFLOW_EVENT", "SYSTEM",
];
const notificationSeverities = ["INFO", "WARNING", "ERROR"];
const notificationStatuses = ["PENDING", "DELIVERED", "FAILED"];
const customFieldTypes = ["TEXT", "NUMBER", "BOOLEAN", "DATE", "SELECT"];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function dateOffset(days: number) {
  const d = new Date(2026 - 0 + 1 - 1, 0, 1);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function randomDate(startYear: number, endYear: number) {
  const year = startYear + Math.floor(rng() * (endYear - startYear + 1));
  const month = Math.floor(rng() * 12);
  const day = 1 + Math.floor(rng() * 27);
  const d = new Date(year, month, day);
  return d.toISOString().split("T")[0] + "T00:00:00Z";
}

// 1. organizations.json — 3 organizations
const orgNames = [
  { name: "TechVision", slug: "techvision", settings: { auditRetentionDays: "90", timezone: "UTC", currency: "USD" } },
  { name: "NexusCorp", slug: "nexuscorp", settings: { auditRetentionDays: "60", timezone: "UTC", currency: "EUR" } },
  { name: "StellarWorks", slug: "stellarworks", settings: { auditRetentionDays: "120", timezone: "UTC", currency: "USD" } },
];

const organizations: any[] = orgNames.map((org, i) => ({
  id: i + 1,
  name: org.name,
  slug: org.slug,
  createdById: 1,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
}));
fs.writeFileSync(path.join(seedDir, "organization.json"), JSON.stringify(organizations, null, 2));

// 2. organizationMembership.json
const orgMemberships: any[] = [];
let memId = 1;
for (let orgIdx = 0; orgIdx < 3; orgIdx++) {
  const orgId = orgIdx + 1;
  // Owner
  orgMemberships.push({ id: memId++, organizationId: orgId, userId: 1 + orgIdx * 5, role: "OWNER" });
  // Admin
  orgMemberships.push({ id: memId++, organizationId: orgId, userId: 2 + orgIdx * 5, role: "ADMIN" });
  // Manager
  orgMemberships.push({ id: memId++, organizationId: orgId, userId: 3 + orgIdx * 5, role: "MANAGER" });
  // 2-3 Members
  const memberCount = 2 + Math.floor(rng() * 2);
  for (let m = 0; m < memberCount; m++) {
    const userId = 5 + orgIdx * 5 + m;
    if (userId <= 20) {
      orgMemberships.push({ id: memId++, organizationId: orgId, userId, role: "MEMBER" });
    }
  }
}
fs.writeFileSync(path.join(seedDir, "organizationMembership.json"), JSON.stringify(orgMemberships, null, 2));

// 3. projectMembership.json — link users to projects
const projectMemberships: any[] = [];
let pmId = 1;
const projectIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
for (const projectId of projectIds) {
  const ownerId = 1 + Math.floor(rng() * 10);
  projectMemberships.push({ id: pmId++, userId: ownerId, projectId, role: "OWNER", status: "ACTIVE" });
  const memberCount = 2 + Math.floor(rng() * 3);
  for (let m = 0; m < memberCount; m++) {
    const userId = 1 + Math.floor(rng() * 20);
    if (userId !== ownerId) {
      projectMemberships.push({ id: pmId++, userId, projectId, role: "MEMBER", status: "ACTIVE" });
    }
  }
}
fs.writeFileSync(path.join(seedDir, "projectMembership.json"), JSON.stringify(projectMemberships, null, 2));

// 4. sprint.json — 30 sprints across projects
const sprints: any[] = [];
const sprintNames = ["Sprint Alpha", "Sprint Bravo", "Sprint Charlie", "Sprint Delta", "Sprint Echo",
  "Sprint Foxtrot", "Sprint Golf", "Sprint Hotel", "Sprint India", "Sprint Juliet"];
let sprintId = 1;
for (let i = 0; i < 30; i++) {
  const projectIdx = i % 10;
  const projectId = projectIds[projectIdx];
  const statusIdx = Math.floor(rng() * sprintStatuses.length);
  const status = sprintStatuses[statusIdx];
  const sprintStart = randomDate(2023, 2025);
  const start = new Date(sprintStart);
  start.setDate(start.getDate() + Math.floor(rng() * 14));
  const end = new Date(start);
  end.setDate(end.getDate() + 14);
  const ownerId = 1 + Math.floor(rng() * 20);
  sprints.push({
    id: sprintId++,
    name: `${sprintNames[i % sprintNames.length]}`,
    projectId,
    goal: `Goal for ${sprintNames[i % sprintNames.length]}`,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    status,
    capacity: 30 + Math.floor(rng() * 50),
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    ownerId,
  });
}
fs.writeFileSync(path.join(seedDir, "sprint.json"), JSON.stringify(sprints, null, 2));

// 5. milestone.json — 25 milestones
const milestones: any[] = [];
const milestoneNames = ["MVP Release", "Beta Launch", "Security Audit", "Performance Review", "User Onboarding",
  "API Stability", "Mobile Support", "Docs Complete", "UX Finalized", "Market Research"];
let milestoneId = 1;
for (let i = 0; i < 25; i++) {
  const projectId = projectIds[i % 10];
  const statusIdx = Math.floor(rng() * milestoneStatuses.length);
  const status = milestoneStatuses[statusIdx];
  const due = randomDate(2023, 2025);
  const start = new Date(due);
  start.setDate(start.getDate() - 30);
  const ownerId = 1 + Math.floor(rng() * 20);
  milestones.push({
    id: milestoneId++,
    name: milestoneNames[i % milestoneNames.length],
    description: `Description for ${milestoneNames[i % milestoneNames.length]}`,
    projectId,
    startDate: start.toISOString(),
    dueDate: due,
    status,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    ownerId,
  });
}
fs.writeFileSync(path.join(seedDir, "milestone.json"), JSON.stringify(milestones, null, 2));

// 6. notification.json — 200 notifications
const notifications: any[] = [];
const notificationTitles = {
  ASSIGNMENT: ["New task assigned", "Task reassigned", "Assignment update"],
  MENTION: ["You were mentioned", "Mention in comment", "New mention"],
  STATUS_CHANGE: ["Task status changed", "Status update", "Progress update"],
  COMMENT: ["New comment on your task", "Comment added", "Task discussion"],
  DUE_DATE_REMINDER: ["Task due soon", "Reminder: upcoming deadline", "Due date approaching"],
  OVERDUE_ALERT: ["Task overdue", "Overdue alert", "Past due date"],
  WORKFLOW_EVENT: ["Workflow updated", "Workflow transition", "Process change"],
  SYSTEM: ["System notification", "Maintenance notice", "System update"],
};
const notificationMessages = {
  ASSIGNMENT: ["You have been assigned to a task.", "A task has been assigned to you.", "New assignment for review."],
  MENTION: ["You were mentioned in a comment.", "Someone mentioned you.", "Check the mention in the discussion."],
  STATUS_CHANGE: ["The status of your task has changed.", "Task is now in progress.", "Status updated for your task."],
  COMMENT: ["A new comment was added to your task.", "Reply to the latest comment.", "Discussion update on your task."],
  DUE_DATE_REMINDER: ["Your task is due soon.", "Upcoming deadline reminder.", "Don't forget the approaching deadline."],
  OVERDUE_ALERT: ["Your task is now overdue.", "Action required: overdue task.", "Past the due date for this task."],
  WORKFLOW_EVENT: ["A workflow event occurred.", "Workflow state has changed.", "Process transition completed."],
  SYSTEM: ["System maintenance notice.", "Platform update available.", "Important system information."],
};

for (let i = 0; i < 200; i++) {
  const type = randomFrom(notificationTypes);
  const severity = randomFrom(notificationSeverities);
  const status = randomFrom(notificationStatuses);
  const read = rng() < 0.6;
  const readAt = read ? dateOffset(-Math.floor(rng() * 30)) : null;
  const archived = rng() < 0.05;
  const userId = 1 + Math.floor(rng() * 20);
  const titles = notificationTitles[type as keyof typeof notificationTitles];
  const msgs = notificationMessages[type as keyof typeof notificationMessages];
  const ts = dateOffset(-Math.floor(rng() * 60));
  notifications.push({
    id: i + 1,
    userId,
    type,
    title: randomFrom(titles),
    message: randomFrom(msgs),
    read,
    link: `/tasks/${1 + Math.floor(rng() * 40)}`,
    activityLogId: null,
    createdAt: ts,
    updatedAt: ts,
    severity,
    status,
    readAt,
    archived,
  });
}
fs.writeFileSync(path.join(seedDir, "notification.json"), JSON.stringify(notifications, null, 2));

// 7. notificationPreference.json
const notificationPreferences: any[] = [];
for (let i = 1; i <= 20; i++) {
  notificationPreferences.push({
    id: i,
    userId: i,
    notificationType: rng() < 0.7 ? "ALL" : randomFrom(["MENTIONS", "ASSIGNMENTS", "ALL"]),
    emailEnabled: rng() < 0.8,
    inAppEnabled: rng() < 0.9,
    updatedAt: "2024-01-01T00:00:00Z",
  });
}
fs.writeFileSync(path.join(seedDir, "notificationPreference.json"), JSON.stringify(notificationPreferences, null, 2));

// 8. customFieldDefinition.json
const fieldDefs: any[] = [];
const fieldNames = [
  { name: "Business Unit", key: "business_unit", type: "TEXT", options: null },
  { name: "Budget (USD)", key: "budget", type: "NUMBER", options: null },
  { name: "Is External", key: "is_external", type: "BOOLEAN", options: null },
  { name: "Go Live Date", key: "go_live_date", type: "DATE", options: null },
  { name: "Compliance Level", key: "compliance_level", type: "SELECT", options: "Standard,High,Critical" },
  { name: "Customer Tier", key: "customer_tier", type: "SELECT", options: "Platinum,Gold,Silver,Bronze" },
];
let fdId = 1;
for (const orgId of [1, 2, 3]) {
  for (const fd of fieldNames) {
    fieldDefs.push({
      id: fdId++,
      organizationId: orgId,
      name: fd.name,
      key: fd.key,
      fieldType: fd.type,
      options: fd.options,
      required: rng() < 0.3,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    });
  }
}
fs.writeFileSync(path.join(seedDir, "customFieldDefinition.json"), JSON.stringify(fieldDefs, null, 2));

// 9. customFieldValue.json
const fieldValues: any[] = [];
let fvId = 1;
const selectOptions = {
  compliance_level: ["Standard", "High", "Critical"],
  customer_tier: ["Platinum", "Gold", "Silver", "Bronze"],
};
for (const fd of fieldDefs) {
  for (const projectId of projectIds) {
    let value: string;
    if (fd.fieldType === "BOOLEAN") {
      value = rng() < 0.5 ? "true" : "false";
    } else if (fd.fieldType === "NUMBER") {
      value = String(Math.floor(rng() * 100000) + 10000);
    } else if (fd.fieldType === "SELECT") {
      const opts = selectOptions[fd.key as keyof typeof selectOptions] || ["Option A"];
      value = randomFrom(opts);
    } else if (fd.fieldType === "DATE") {
      value = randomDate(2024, 2026);
    } else {
      value = `Value for ${fd.name}`;
    }
    fieldValues.push({
      id: fvId++,
      definitionId: fd.id,
      projectId,
      taskId: null,
      value,
    });
  }
}
fs.writeFileSync(path.join(seedDir, "customFieldValue.json"), JSON.stringify(fieldValues, null, 2));

// 10. integration.json
const integrations: any[] = [];
const providers = [
  { provider: "github", name: "GitHub" },
  { provider: "gitlab", name: "GitLab" },
  { provider: "slack", name: "Slack" },
  { provider: "google-calendar", name: "Google Calendar" },
  { provider: "jira", name: "Jira" },
];
let intId = 1;
for (let i = 0; i < providers.length; i++) {
  const orgId = (i % 3) + 1;
  const enabled = rng() < 0.7;
  const statuses = ["ACTIVE", "DISABLED", "FAILED"];
  const status = enabled ? "ACTIVE" : randomFrom(["DISABLED", "FAILED"]);
  integrations.push({
    id: intId++,
    organizationId: orgId,
    provider: providers[i].provider,
    name: providers[i].name,
    config: "{}",
    secretRef: null,
    enabled,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  });
}
fs.writeFileSync(path.join(seedDir, "integration.json"), JSON.stringify(integrations, null, 2));

console.log("Seed data generated:");
console.log(`  organizations: ${organizations.length}`);
console.log(`  organizationMemberships: ${orgMemberships.length}`);
console.log(`  projectMemberships: ${projectMemberships.length}`);
console.log(`  sprints: ${sprints.length}`);
console.log(`  milestones: ${milestones.length}`);
console.log(`  notifications: ${notifications.length}`);
console.log(`  notificationPreferences: ${notificationPreferences.length}`);
console.log(`  customFieldDefinitions: ${fieldDefs.length}`);
console.log(`  customFieldValues: ${fieldValues.length}`);
console.log(`  integrations: ${integrations.length}`);
