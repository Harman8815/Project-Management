import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";

export interface Project {
  id: number;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export enum Priority {
  Urgent = "Urgent",
  High = "High",
  Medium = "Medium",
  Low = "Low",
  Backlog = "Backlog",
}

export enum Status {
  ToDo = "To Do",
  WorkInProgress = "Work In Progress",
  UnderReview = "Under Review",
  Completed = "Completed",
}

export interface User {
  userId?: number;
  username: string;
  email: string;
  profilePictureUrl?: string;
  cognitoId?: string;
  teamId?: number;
}

export interface Attachment {
  id: number;
  fileURL: string;
  fileName: string;
  taskId: number;
  uploadedById: number;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status?: Status;
  priority?: Priority;
  tags?: string;
  startDate?: string;
  dueDate?: string;
  points?: number;
  projectId: number;
  authorUserId?: number;
  assignedUserId?: number;

  author?: User;
  assignee?: User;
  comments?: Comment[];
  attachments?: Attachment[];
}

export interface SearchResults {
  tasks?: Task[];
  projects?: Project[];
  users?: User[];
}

export interface Team {
  teamId: number;
  teamName: string;
  productOwnerUserId?: number;
  projectManagerUserId?: number;
}

export interface Organization {
  id: number;
  name: string;
  slug: string;
  memberships: Array<{ userId: number; role: string }>;
  settings: Array<{ key: string; value: string }>;
}

export interface CustomFieldDefinition {
  id: number;
  name: string;
  key: string;
  fieldType: string;
  required: boolean;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    prepareHeaders: async (headers) => {
      const session = await fetchAuthSession();
      const { accessToken } = session.tokens ?? {};
      if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
      }
      return headers;
    },
  }),
  reducerPath: "api",
  tagTypes: ["Projects", "Tasks", "Users", "Teams", "Organization", "CustomFields", "Notifications"],
  endpoints: (build) => ({
    getAuthUser: build.query({
      queryFn: async (_, _queryApi, _extraoptions, fetchWithBQ) => {
        try {
          const user = await getCurrentUser();
          const session = await fetchAuthSession();
          if (!session) throw new Error("No session found");
          const { userSub } = session;
          const { accessToken } = session.tokens ?? {};

          const userDetailsResponse = await fetchWithBQ(`users/${userSub}`);
          const userDetails = userDetailsResponse.data as User;

          return { data: { user, userSub, userDetails } };
        } catch (error: any) {
          return { error: error.message || "Could not fetch user data" };
        }
      },
    }),
    getProjects: build.query<Project[], void>({
      query: () => "projects",
      providesTags: ["Projects"],
    }),
    createProject: build.mutation<Project, Partial<Project>>({
      query: (project) => ({
        url: "projects",
        method: "POST",
        body: project,
      }),
      invalidatesTags: ["Projects"],
    }),
    getTasks: build.query<Task[], { projectId: number }>({
      query: ({ projectId }) => `tasks?projectId=${projectId}`,
      providesTags: (result) =>
        result
          ? result.map(({ id }) => ({ type: "Tasks" as const, id }))
          : [{ type: "Tasks" as const }],
    }),
    getTasksByUser: build.query<Task[], number>({
      query: (userId) => `tasks/user/${userId}`,
      providesTags: (result, error, userId) =>
        result
          ? result.map(({ id }) => ({ type: "Tasks", id }))
          : [{ type: "Tasks", id: userId }],
    }),
    createTask: build.mutation<Task, Partial<Task>>({
      query: (task) => ({
        url: "tasks",
        method: "POST",
        body: task,
      }),
      invalidatesTags: ["Tasks"],
    }),
    updateTaskStatus: build.mutation<Task, { taskId: number; status: string }>({
      query: ({ taskId, status }) => ({
        url: `tasks/${taskId}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Tasks", id: taskId },
      ],
    }),
    getUsers: build.query<User[], void>({
      query: () => "users",
      providesTags: ["Users"],
    }),
    getTeams: build.query<Team[], void>({
      query: () => "teams",
      providesTags: ["Teams"],
    }),
    search: build.query<SearchResults, string>({
      query: (query) => `search?query=${query}`,
    }),
    getOrganization: build.query<Organization, number>({
      query: (organizationId) => `organizations/${organizationId}`,
      providesTags: ["Organization"],
    }),
    updateOrganizationSettings: build.mutation<unknown, { organizationId: number; settings: Record<string, string> }>({
      query: ({ organizationId, settings }) => ({ url: `organizations/${organizationId}/settings`, method: "POST", body: settings }),
      invalidatesTags: ["Organization"],
    }),
    addOrganizationMember: build.mutation<unknown, { organizationId: number; userId: number; role: string }>({
      query: ({ organizationId, ...body }) => ({ url: `organizations/${organizationId}/members`, method: "POST", body }),
      invalidatesTags: ["Organization"],
    }),
    getCustomFields: build.query<CustomFieldDefinition[], number>({
      query: (organizationId) => `organizations/${organizationId}/custom-fields`,
      providesTags: ["CustomFields"],
    }),
    createCustomField: build.mutation<CustomFieldDefinition, { organizationId: number; name: string; key: string; fieldType: string; required?: boolean }>({
      query: ({ organizationId, ...body }) => ({ url: `organizations/${organizationId}/custom-fields`, method: "POST", body }),
      invalidatesTags: ["CustomFields"],
    }),
    createIntegration: build.mutation<unknown, { organizationId: number; provider: string; name: string; config?: Record<string, unknown> }>({
      query: ({ organizationId, ...body }) => ({ url: `organizations/${organizationId}/integrations`, method: "POST", body }),
    }),
    askAi: build.mutation<{ requestId: number; answer: string; sources: Array<{ type: string; id: number }> }, { organizationId: number; projectId?: number; prompt: string }>({
      query: ({ organizationId, ...body }) => ({ url: `organizations/${organizationId}/ai/answer`, method: "POST", body }),
    }),
    getNotifications: build.query<{ data: Notification[]; meta: { total: number } }, { userId: number; unreadOnly?: boolean }>({
      query: ({ userId, unreadOnly }) => `notifications?userId=${userId}${unreadOnly ? "&unreadOnly=true" : ""}`,
      providesTags: ["Notifications"],
    }),
    markNotificationRead: build.mutation<Notification, number>({
      query: (id) => ({ url: `notifications/${id}/read`, method: "PATCH" }),
      invalidatesTags: ["Notifications"],
    }),
    markAllNotificationsRead: build.mutation<unknown, number>({
      query: (userId) => ({ url: `notifications/user/${userId}/read-all`, method: "PATCH" }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useCreateProjectMutation,
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskStatusMutation,
  useSearchQuery,
  useGetUsersQuery,
  useGetTeamsQuery,
  useGetTasksByUserQuery,
  useGetAuthUserQuery,
  useGetOrganizationQuery,
  useUpdateOrganizationSettingsMutation,
  useAddOrganizationMemberMutation,
  useGetCustomFieldsQuery,
  useCreateCustomFieldMutation,
  useCreateIntegrationMutation,
  useAskAiMutation,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = api;
