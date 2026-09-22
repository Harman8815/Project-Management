/**
 * Shared mock API fixtures for ProjeX E2E tests.
 *
 * All fixtures use the same identifier/data shape as the NestJS tasks
 * endpoints (see server/nest/src/modules/tasks) and the RTK Query
 * slices in client/src/state/api.ts so that route interception stays
 * consistent with the real API contract.
 */

export const PROJECT_ID = 42;
export const OTHER_PROJECT_ID = 99;

export const users = {
  owner: {
    userId: 1,
    username: "alice_owner",
    email: "alice@example.com",
    profilePictureUrl: "/avatars/alice.png",
    cognitoId: "cognito-owner",
    teamId: 1,
  },
  member: {
    userId: 2,
    username: "bob_member",
    email: "bob@example.com",
    profilePictureUrl: "/avatars/bob.png",
    cognitoId: "cognito-member",
    teamId: 1,
  },
  outsider: {
    userId: 3,
    username: "carol_outsider",
    email: "carol@example.com",
    profilePictureUrl: "/avatars/carol.png",
    cognitoId: "cognito-outsider",
    teamId: 2,
  },
};

export const projects = [
  {
    id: PROJECT_ID,
    name: "Phoenix Migration",
    description: "Migrate legacy services to NestJS",
    startDate: "2024-01-01T00:00:00Z",
    endDate: null,
  },
  {
    id: OTHER_PROJECT_ID,
    name: "Billing Overhaul",
    description: "Rebuild invoicing pipeline",
    startDate: "2024-02-01T00:00:00Z",
    endDate: null,
  },
];

export const tasks = {
  todo: {
    id: 101,
    title: "Draft migration checklist",
    description: "Enumerate every Express route to migrate",
    status: "To Do",
    priority: "High",
    tags: "migration,planning",
    startDate: "2024-01-05T00:00:00Z",
    dueDate: "2024-01-12T00:00:00Z",
    points: 5,
    projectId: PROJECT_ID,
    authorUserId: users.owner.userId,
    assignedUserId: users.member.userId,
    author: users.owner,
    assignee: users.member,
    comments: [],
    attachments: [],
  },
  inProgress: {
    id: 102,
    title: "Refactor task controller",
    description: "Convert Express taskController to NestJS",
    status: "Work In Progress",
    priority: "Critical",
    tags: "backend,migration",
    startDate: "2024-01-08T00:00:00Z",
    dueDate: "2024-01-20T00:00:00Z",
    points: 8,
    projectId: PROJECT_ID,
    authorUserId: users.owner.userId,
    assignedUserId: users.member.userId,
    author: users.owner,
    assignee: users.member,
    comments: [],
    attachments: [],
  },
  blocked: {
    id: 103,
    title: "Dependent on auth refactor",
    description: "Cannot proceed until JWT guard is stable",
    status: "Blocked",
    priority: "Medium",
    tags: "backend,blocked",
    startDate: "2024-01-10T00:00:00Z",
    dueDate: "2024-01-25T00:00:00Z",
    points: 3,
    projectId: PROJECT_ID,
    authorUserId: users.member.userId,
    assignedUserId: null,
    author: users.member,
    assignee: null,
    comments: [],
    attachments: [],
  },
};

export function projectTasks(projectId: number) {
  return Object.values(tasks).filter((t) => t.projectId === projectId);
}

export function makeTask(overrides: Partial<typeof tasks.todo> = {}) {
  return {
    ...tasks.todo,
    id: 9001,
    title: "E2E created task",
    description: "Created by an E2E test",
    status: "To Do",
    priority: "Medium",
    tags: "e2e",
    projectId: PROJECT_ID,
    authorUserId: users.owner.userId,
    assignedUserId: users.member.userId,
    author: users.owner,
    assignee: users.member,
    comments: [],
    attachments: [],
    ...overrides,
  };
}