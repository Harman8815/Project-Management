export type UserFixture = {
  userId: number;
  cognitoId: string;
  username: string;
};

export type ProjectFixture = {
  id: number;
  name: string;
  key: string;
  status: string;
};

export type TaskFixture = {
  id: number;
  title: string;
  projectId: number;
  status: string;
  priority: string;
};

export const buildUser = (overrides: Partial<UserFixture> = {}): UserFixture => ({
  userId: 1,
  cognitoId: "cognito-fixture-1",
  username: "fixture.user",
  ...overrides,
});

export const buildProject = (overrides: Partial<ProjectFixture> = {}): ProjectFixture => ({
  id: 1,
  name: "Fixture Project",
  key: "FIX-1",
  status: "PLANNED",
  ...overrides,
});

export const buildTask = (overrides: Partial<TaskFixture> = {}): TaskFixture => ({
  id: 1,
  title: "Fixture task",
  projectId: 1,
  status: "To Do",
  priority: "Medium",
  ...overrides,
});

export const buildProjectMembership = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  userId: 1,
  projectId: 1,
  role: "MEMBER",
  status: "ACTIVE",
  ...overrides,
});
