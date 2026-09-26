import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { handleApiError } from "@/hooks/useGlobalErrorHandler";

export interface Project {
  id: number;
  key?: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  status?: string;
  priority?: string;
  health?: string;
  objectives?: string;
  archived?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  capacityHoursPerWeek?: number;
  capacityStoryPoints?: number;
  team?: Team;
  organizationMemberships?: Array<{
    id: number;
    organizationId: number;
    userId: number;
    role: string;
    organization?: Organization;
  }>;
  notificationPreference?: {
    id: number;
    userId: number;
    notificationType: string;
    emailEnabled: boolean;
    inAppEnabled: boolean;
    updatedAt: string;
  };
  createdAt?: string;
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
  id: number;
  teamName: string;
  productOwnerUserId?: number;
  projectManagerUserId?: number;
  productOwnerUsername?: string;
  projectManagerUsername?: string;
  projectTeams?: Array<{
    id: number;
    project: {
      id: number;
      name: string;
    };
  }>;
}

export interface Organization {
  id: number;
  name: string;
  slug: string;
  memberships: Array<{ userId: number; role: string; user?: User }>;
  settings: Array<{ key: string; value: string }>;
  members?: Array<{ userId: number; username: string; role: string }>;
  integrations?: Array<{ id: number; provider: string; name: string; enabled: boolean }>;
  customFields?: CustomFieldDefinition[];
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
  readAt?: string | null;
  severity?: string;
  status?: string;
  createdAt: string;
  link?: string;
}

export interface Sprint {
  id: number;
  name: string;
  projectId: number;
  goal?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  capacity?: number;
  ownerId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Milestone {
  id: number;
  name: string;
  description?: string;
  projectId: number;
  startDate?: string;
  dueDate?: string;
  status: string;
  ownerId?: number;
}

export const baseQuery = fetchBaseQuery({
  baseUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`,
  prepareHeaders: async (headers) => {
    const session = await fetchAuthSession();
    const { accessToken } = session.tokens ?? {};
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await baseQuery(args, api, extraOptions);

  if (result.data && typeof result.data === "object" && "success" in result.data && "data" in result.data) {
    return { data: (result.data as { success: boolean; data: unknown; timestamp: string }).data };
  }

  if (result.error) {
    const endpointName = typeof args === "string" ? args : (args as FetchArgs).url || "unknown";
    handleApiError(result.error, endpointName);
  }

  return result;
};

export const api = createApi({
  baseQuery: baseQueryWithReauth,
  reducerPath: "api",
  tagTypes: ["Projects", "Tasks", "Users", "Teams", "Organization", "CustomFields", "Notifications", "Calendar"],
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
        } catch {
          const usersResponse = await fetchWithBQ("users");
          const usersData = usersResponse.data as { data: User[]; meta: any };
          const users = usersData?.data;
          if (users && users.length > 0) {
            const devUser = users[0];
            return {
              data: {
                user: { username: devUser.username, userId: String(devUser.userId ?? "") },
                userSub: devUser.cognitoId || "dev-user",
                userDetails: devUser,
              },
            };
          }
          return { error: { status: 500, data: "Could not fetch user data" } };
        }
      },
    }),
    getAuthUserProfile: build.query<User, void>({
      query: () => "users/me",
      providesTags: ["Users"],
    }),
    updateNotificationPreferences: build.mutation<unknown, { userId: number; emailEnabled?: boolean; inAppEnabled?: boolean; notificationType?: string }>({
      query: ({ userId, ...body }) => ({
        url: `users/${userId}/notification-preferences`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Users"],
    }),
    getProjects: build.query<Project[], void>({
      query: () => "projects",
      transformResponse: (response: { data: Project[]; meta: any }) => response.data,
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
    updateProject: build.mutation<Project, { id: number; updates: Partial<Project> }>({
      query: ({ id, updates }) => ({
        url: `projects/${id}`,
        method: "PATCH",
        body: updates,
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
    updateTask: build.mutation<Task, { id: number; updates: Partial<Task> }>({
      query: ({ id, updates }) => ({
        url: `tasks/${id}`,
        method: "PATCH",
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Tasks", id },
      ],
    }),
    getUsers: build.query<User[], void>({
      query: () => "users",
      providesTags: ["Users"],
    }),
    getTeams: build.query<Team[], void>({
      query: () => "teams",
      transformResponse: (response: { data: Team[]; meta: any }) => response.data,
      providesTags: ["Teams"],
    }),
    getSprints: build.query<Sprint[], { projectId: number }>({
      query: ({ projectId }) => `sprints?projectId=${projectId}`,
      providesTags: (result) =>
        result
          ? result.map(({ id }) => ({ type: "Tasks" as const, id }))
          : [{ type: "Tasks" as const }],
    }),
    search: build.query<SearchResults, string>({
      query: (query) => `search?query=${query}`,
    }),
    getRecentSearches: build.query<string[], number>({
      query: (userId) => `search/recent?userId=${userId}`,
      transformResponse: (response: string[]) => response,
    }),
    getTopSearches: build.query<Array<{ query: string; count: number }>, { period?: string; limit?: number }>({
      query: ({ period = "week", limit = 10 }) => `search/top?period=${period}&limit=${limit}`,
      transformResponse: (response: Array<{ query: string; count: number }>) => response,
    }),
    clearRecentSearches: build.mutation<{ success: boolean }, number>({
      query: (userId) => ({
        url: `search/recent?userId=${userId}`,
        method: "DELETE",
      }),
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
    archiveNotification: build.mutation<Notification, number>({
      query: (id) => ({ url: `notifications/${id}/archive`, method: "PATCH" }),
      invalidatesTags: ["Notifications"],
    }),
    getUnreadNotificationCount: build.query<{ count: number }, number>({
      query: (userId) => `notifications/user/${userId}/unread-count`,
      providesTags: ["Notifications"],
    }),
    getCalendarEvents: build.query<any, { organizationId: number; calendarId?: string; startDate?: string; endDate?: string; page?: number; limit?: number }>({
      query: ({ organizationId, calendarId, startDate, endDate, page, limit }) => {
        const params = new URLSearchParams();
        if (calendarId) params.set("calendarId", calendarId);
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
        if (page) params.set("page", String(page));
        if (limit) params.set("limit", String(limit));
        return `organizations/${organizationId}/calendar/events?${params.toString()}`;
      },
    }),
    createCalendarEvent: build.mutation<any, { organizationId: number; calendarId: string; title: string; startDate: string; endDate: string; description?: string; taskId?: number }>({
      query: ({ organizationId, ...body }) => ({ url: `organizations/${organizationId}/calendar/events`, method: "POST", body }),
      invalidatesTags: ["Calendar"],
    }),
    updateCalendarEvent: build.mutation<any, { organizationId: number; eventId: number; updates: any }>({
      query: ({ organizationId, eventId, updates }) => ({ url: `organizations/${organizationId}/calendar/events/${eventId}`, method: "PUT", body: updates }),
      invalidatesTags: ["Calendar"],
    }),
    deleteCalendarEvent: build.mutation<{ message: string }, { organizationId: number; eventId: number }>({
      query: ({ organizationId, eventId }) => ({ url: `organizations/${organizationId}/calendar/events/${eventId}`, method: "DELETE" }),
      invalidatesTags: ["Calendar"],
    }),
    syncCalendar: build.mutation<any, { organizationId: number; provider: string; calendarId: string; syncToken?: string }>({
      query: ({ organizationId, ...body }) => ({ url: `organizations/${organizationId}/calendar/sync`, method: "POST", body }),
      invalidatesTags: ["Calendar"],
    }),
    getCalendarEventsByIcal: build.mutation<{ events: any[] }, { organizationId: number; ical: string }>({
      query: ({ organizationId, ...body }) => ({ url: `organizations/${organizationId}/calendar/parse-ical`, method: "POST", body }),
    }),
    linkCalendarEventToTask: build.mutation<any, { organizationId: number; eventId: number; taskId: number }>({
      query: ({ organizationId, eventId, taskId }) => ({ url: `organizations/${organizationId}/calendar/events/${eventId}/link-task`, method: "POST", body: { taskId } }),
      invalidatesTags: ["Calendar", "Tasks"],
    }),
    getModelConfig: build.query<any, { organizationId: number }>({
      query: ({ organizationId }) => `organizations/${organizationId}/ai/model-config`,
    }),
    setModelConfig: build.mutation<any, { organizationId: number; config: any }>({
      query: ({ organizationId, ...body }) => ({ url: `organizations/${organizationId}/ai/model-config`, method: "PUT", body }),
    }),
    naturalLanguageSearch: build.mutation<any, { organizationId: number; query: string; projectId?: number }>({
      query: ({ organizationId, ...body }) => ({ url: `organizations/${organizationId}/ai/search`, method: "POST", body }),
    }),
    generateReport: build.mutation<any, { organizationId: number; projectId: number; reportType: string }>({
      query: ({ organizationId, ...body }) => ({ url: `organizations/${organizationId}/ai/report`, method: "POST", body }),
    }),
    suggestTaskBreakdown: build.mutation<any, { organizationId: number; projectId: number; taskTitle: string; taskDescription?: string }>({
      query: ({ organizationId, ...body }) => ({ url: `organizations/${organizationId}/ai/task-breakdown`, method: "POST", body }),
    }),
    assistPlanning: build.mutation<any, { organizationId: number; projectId: number; timeframe: string; capacity?: number }>({
      query: ({ organizationId, ...body }) => ({ url: `organizations/${organizationId}/ai/planning`, method: "POST", body }),
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useGetTasksQuery,
  useGetTasksByUserQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useUpdateTaskStatusMutation,
  useGetSprintsQuery,
  useSearchQuery,
  useGetRecentSearchesQuery,
  useGetTopSearchesQuery,
  useClearRecentSearchesMutation,
  useGetUsersQuery,
  useGetTeamsQuery,
  useGetAuthUserQuery,
  useGetAuthUserProfileQuery,
  useUpdateNotificationPreferencesMutation,
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
  useArchiveNotificationMutation,
  useGetUnreadNotificationCountQuery,
  useGetCalendarEventsQuery,
  useCreateCalendarEventMutation,
  useUpdateCalendarEventMutation,
  useDeleteCalendarEventMutation,
  useSyncCalendarMutation,
  useGetCalendarEventsByIcalMutation,
  useLinkCalendarEventToTaskMutation,
  useGetModelConfigQuery,
  useSetModelConfigMutation,
  useNaturalLanguageSearchMutation,
  useGenerateReportMutation,
  useSuggestTaskBreakdownMutation,
  useAssistPlanningMutation,
} = api;
