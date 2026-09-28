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

export interface CustomFieldValue {
  id: number;
  definitionId: number;
  projectId?: number;
  taskId?: number;
  value: string;
  definition?: CustomFieldDefinition;
}

export interface TimelineProject extends Project {
  sprints?: Sprint[];
  delayed?: boolean;
  delayDays?: number;
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

export interface ResourceOverview {
  totalEmployees: number;
  allocatedEmployees: number;
  availableEmployees: number;
  benchEmployees: number;
  vacantProjectSeats: number;
  overallUtilization: number;
  skillDistribution: Array<{ skill: string; count: number }>;
}

export interface Employee {
  userId: number;
  username: string;
  email: string;
  experienceLevel?: string;
  availability?: string;
  benchDate?: string;
  currentProjectId?: number;
  skills: Array<{ skillId: number; skillName: string; skillCategory?: string; level: string; yearsExp?: number }>;
  projects: Array<{ projectId: number; projectName: string; projectKey?: string; role: string }>;
}

export interface ProjectResource {
  projectId: number;
  projectName: string;
  projectKey?: string;
  status?: string;
  capacity: number;
  allocatedResources: number;
  vacantSeats: number;
  utilizationPercentage: number;
  requiredSkills: string[];
  employees: Array<{ userId: number; username: string; role: string; skills: Array<{ skillId: number; skillName: string; level: string }>; availability?: string }>;
}

export interface SkillResource {
  skill: string;
  total: number;
  allocated: number;
  available: number;
  bench: number;
}

export interface BenchCandidate {
  userId: number;
  username: string;
  email: string;
  role: string;
  skills: Array<{ skillId: number; skillName: string; skillCategory?: string; level: string; yearsExp?: number }>;
  experienceLevel?: string;
  availability?: string;
  benchDate?: string;
  previousProject?: string;
  potentialMatches: Array<{ projectId: number; matchReason: string }>;
}

export interface SavedView {
  id: number;
  userId: number;
  viewName: string;
  viewType: string;
  filters: any;
  sortConfig?: any;
  columnConfig?: any;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavedViewInput {
  viewName: string;
  viewType: string;
  filters: any;
  sortConfig?: any;
  columnConfig?: any;
  isDefault?: boolean;
}

export interface MethodologyConfig {
  id: number;
  name: string;
  key: "KANBAN" | "WATERFALL" | "SCRUM";
  config: {
    workflowStates?: string[];
    phases?: string[];
    showBoard?: boolean;
    showSprints?: boolean;
    showMilestones?: boolean;
    showGantt?: boolean;
    requiredFields?: string[];
  };
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
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
  // Add debug logging
  fetchFn: async (input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    console.log('[API] Request:', url, 'init:', init);
    console.log('[API] Base URL from env:', process.env.NEXT_PUBLIC_API_BASE_URL);
    const response = await fetch(input, init);
    console.log('[API] Response:', response.status, response.statusText, url);
    return response;
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
    
    // Handle 401 - token expired/revoked/invalid
    if (result.error.status === 401) {
      const errorData = result.error.data as { errorCode?: string; message?: string } | undefined;
      const errorCode = errorData?.errorCode;
      
      // Clear cache and redirect to login for auth errors
      if (errorCode === "AUTH_TOKEN_EXPIRED" || errorCode === "AUTH_TOKEN_REVOKED" || errorCode === "AUTH_TOKEN_INVALID") {
        api.dispatch({ type: "api/util/resetApiState" });
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return result;
      }
    }
    
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
        console.log('[getAuthUser] Starting auth check...');
        console.log('[getAuthUser] NEXT_PUBLIC_AUTH_DISABLED:', process.env.NEXT_PUBLIC_AUTH_DISABLED);
        try {
          console.log('[getAuthUser] Calling getCurrentUser...');
          const user = await getCurrentUser().catch(e => { console.log('[getAuthUser] getCurrentUser failed:', e); return null; });
          console.log('[getAuthUser] getCurrentUser result:', user);
          if (!user) throw new Error("No user from getCurrentUser");
          const session = await fetchAuthSession().catch(e => { console.log('[getAuthUser] fetchAuthSession failed:', e); return null; });
          console.log('[getAuthUser] fetchAuthSession result:', session);
          if (!session) throw new Error("No session found");
          const { userSub } = session;
          const { accessToken } = session.tokens ?? {};

          const userDetailsResponse = await fetchWithBQ(`users/${userSub}`);
          const userDetails = userDetailsResponse.data as User;

          return { data: { user, userSub, userDetails } };
        } catch (err) {
          console.error('[getAuthUser] Error caught:', err);
          // Only allow dev fallback when AUTH_DISABLED=true
          if (process.env.NEXT_PUBLIC_AUTH_DISABLED === "true") {
            console.log('[getAuthUser] Using dev fallback...');
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
    getArchivedProjects: build.query<Project[], void>({
      query: () => "projects?archived=true",
      transformResponse: (response: { data: Project[]; meta: any }) => response.data,
      providesTags: ["Projects"],
    }),
    getAllProjectsDashboard: build.query<{
      totalProjects: number;
      activeProjects: number;
      totalTasks: number;
      completedTasks: number;
      inProgressTasks: number;
      overdueTasks: number;
      upcomingDeadlines: Array<{ id: number; title: string; dueDate: string; projectId: number; project: { name: string; key?: string } }>;
      activeSprints: Array<{ id: number; name: string; projectId: number; project: { name: string; key?: string } }>;
      recentActivity: Array<{ id: number; eventType: string; message: string; createdAt: string; user?: { username: string }; project?: { name: string; key?: string } }>;
      teamWorkload: Array<{ userId: number; username: string; activeTaskCount: number; totalStoryPoints: number; totalEstimatedHours: number; hoursUtilization: number }>;
    }, void>({
      query: () => "dashboard/all-projects",
      providesTags: ["Projects"],
    }),
    getResourceOverview: build.query<ResourceOverview, void>({
      query: () => "resources/overview",
      providesTags: ["Resources"],
    }),
    getEmployees: build.query<Employee[], void>({
      query: () => "resources/employees",
      providesTags: ["Resources"],
    }),
    getResourcesByProject: build.query<ProjectResource[], void>({
      query: () => "resources/by-project",
      providesTags: ["Resources"],
    }),
    getResourcesBySkill: build.query<SkillResource[], void>({
      query: () => "resources/by-skill",
      providesTags: ["Resources"],
    }),
    getBenchCandidates: build.query<BenchCandidate[], void>({
      query: () => "resources/bench",
      providesTags: ["Resources"],
    }),
    transferResource: build.mutation<{ success: boolean; message: string; previousProjectId?: number; newProjectId?: number }, { userId: number; targetProjectId: number; role?: string }>({
      query: (body) => ({ url: "project-memberships/transfer", method: "POST", body }),
      invalidatesTags: ["Resources", "Projects"],
    }),
    getResourceTransferHistory: build.query<Array<{ id: number; employeeId: number; fromProjectId: number; toProjectId: number; actorName?: string; projectName?: string; projectKey?: string; date: string; role?: string }>, number>({
      query: (userId) => `project-memberships/transfer-history/${userId}`,
      providesTags: ["Resources"],
    }),
    validateBulkImport: build.mutation<{
      valid: boolean;
      errors: Array<{ row: number; field: string; message: string; value: any }>;
      warnings: Array<{ row: number; field: string; message: string; value: any }>;
      totalRows: number;
      validRows: number;
      preview: Array<{ row: number; data: any }>;
    }, { entity: string; file: File }>({
      query: ({ entity, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("entity", entity);
        return { url: "bulk/import/validate", method: "POST", body: formData };
      },
    }),
    confirmBulkImport: build.mutation<{
      created: number;
      updated: number;
      skipped: number;
      errors: Array<{ row: number; field: string; message: string; value: any }>;
    }, { entity: string; data: any[] }>({
      query: ({ entity, data }) => ({ url: "bulk/import/confirm", method: "POST", body: { entity, data } }),
      invalidatesTags: ["Resources", "Projects", "Users"],
    }),
    getBulkTemplate: build.query<Blob, { entity: string }>({
      query: ({ entity }) => ({ url: `bulk/templates/${entity}`, responseHandler: "blob" }),
    }),
    exportBulkData: build.query<Blob, { entity: string; format?: "csv" | "xlsx" }>({
      query: ({ entity, format }) => ({ 
        url: `bulk/export/${entity}?format=${format || "xlsx"}`, 
        responseHandler: "blob" 
      }),
    }),
    getSavedViews: build.query<SavedView[], { viewType?: string }>({
      query: ({ viewType }) => `saved-views${viewType ? `?viewType=${viewType}` : ""}`,
      providesTags: ["SavedViews"],
    }),
    getDefaultSavedView: build.query<SavedView, string>({
      query: (viewType) => `saved-views/default/${viewType}`,
      providesTags: ["SavedViews"],
    }),
    getSavedView: build.query<SavedView, number>({
      query: (id) => `saved-views/${id}`,
      providesTags: ["SavedViews"],
    }),
    executeSavedView: build.query<{ view: SavedView; filters: any; sortConfig?: any; columnConfig?: any }, { id: number; projectId?: number }>({
      query: ({ id, projectId }) => `saved-views/${id}/execute${projectId ? `?projectId=${projectId}` : ""}`,
    }),
    createSavedView: build.mutation<SavedView, SavedViewInput>({
      query: (data) => ({ url: "saved-views", method: "POST", body: data }),
      invalidatesTags: ["SavedViews"],
    }),
    updateSavedView: build.mutation<SavedView, { id: number; data: Partial<SavedViewInput> }>({
      query: ({ id, data }) => ({ url: `saved-views/${id}`, method: "PATCH", body: data }),
      invalidatesTags: ["SavedViews"],
    }),
    deleteSavedView: build.mutation<void, number>({
      query: (id) => ({ url: `saved-views/${id}`, method: "DELETE" }),
      invalidatesTags: ["SavedViews"],
    }),
    duplicateProject: build.mutation<Project, { id: number; name: string; key: string; include?: { includeTasks?: boolean; includeTaskStructure?: boolean; includeSprints?: boolean; includeMilestones?: boolean; includeWorkflows?: boolean; includeCustomFields?: boolean } }>({
      query: ({ id, ...body }) => ({ url: `projects/${id}/duplicate`, method: "POST", body }),
      invalidatesTags: ["Projects"],
    }),
    getMethodologies: build.query<MethodologyConfig[], void>({
      query: () => "methodology",
      providesTags: ["Methodology"],
    }),
    getDefaultMethodology: build.query<MethodologyConfig, void>({
      query: () => "methodology/default",
      providesTags: ["Methodology"],
    }),
    getMethodology: build.query<MethodologyConfig, string>({
      query: (key) => `methodology/${key}`,
      providesTags: ["Methodology"],
    }),
    getProjectMethodology: build.query<MethodologyConfig, number>({
      query: (projectId) => `methodology/project/${projectId}`,
      providesTags: ["Methodology"],
    }),
    setProjectMethodology: build.mutation<any, { projectId: number; methodologyKey: "KANBAN" | "WATERFALL" | "SCRUM" }>({
      query: ({ projectId, methodologyKey }) => ({ url: `methodology/project/${projectId}`, method: "POST", body: { methodologyKey } }),
      invalidatesTags: ["Methodology", "Projects"],
    }),
    getSprintLifecycle: build.query<any, number>({
      query: (sprintId) => `sprints/${sprintId}/lifecycle`,
      providesTags: ["Sprints"],
    }),
    updateSprintStatus: build.mutation<any, { sprintId: number; status: string }>({
      query: ({ sprintId, status }) => ({ url: `sprints/${sprintId}/status`, method: "PATCH", body: { status } }),
      invalidatesTags: ["Sprints", "Projects"],
    }),
    getTimeline: build.query<TimelineProject[], void>({
      query: () => "timeline",
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
    setCustomFieldValue: build.mutation<CustomFieldValue, { organizationId: number; definitionId: number; projectId?: number; taskId?: number; value: string }>({
      query: ({ organizationId, ...body }) => ({ url: `organizations/${organizationId}/custom-fields/values`, method: "POST", body }),
      invalidatesTags: ["CustomFields"],
    }),
    getCustomFieldValues: build.query<CustomFieldValue[], { organizationId: number; projectId?: number; taskId?: number; key?: string }>({
      query: ({ organizationId, ...params }) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) searchParams.set(key, String(value));
        });
        return `organizations/${organizationId}/custom-fields/values?${searchParams.toString()}`;
      },
      providesTags: ["CustomFields"],
    }),
    createIntegration: build.mutation<unknown, { organizationId: number; provider: string; name: string; config?: Record<string, unknown> }>({
      query: ({ organizationId, ...body }) => ({ url: `organizations/${organizationId}/integrations`, method: "POST", body }),
    }),
    askAi: build.mutation<{ requestId: number; answer: string; sources: Array<{ type: string; id: number }> }, { organizationId: number; projectId?: number; prompt: string }>({
      query: ({ organizationId, ...body }) => ({ url: `organizations/${organizationId}/ai/answer`, method: "POST", body }),
    }),
    getNotifications: build.query<{ data: Notification[]; meta: { total: number } }, { userId: number; unreadOnly?: boolean; type?: string }>({
      query: ({ userId, unreadOnly, type }) => {
        let url = `notifications?userId=${userId}`;
        if (unreadOnly) url += `&unreadOnly=true`;
        if (type) url += `&type=${type}`;
        return url;
      },
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
  useGetArchivedProjectsQuery,
  useGetAllProjectsDashboardQuery,
  useGetResourceOverviewQuery,
  useGetEmployeesQuery,
  useGetResourcesByProjectQuery,
  useGetResourcesBySkillQuery,
  useGetBenchCandidatesQuery,
  useTransferResourceMutation,
  useGetResourceTransferHistoryQuery,
  useValidateBulkImportMutation,
  useConfirmBulkImportMutation,
  useGetBulkTemplateQuery,
  useExportBulkDataQuery,
  useGetSavedViewsQuery,
  useGetDefaultSavedViewQuery,
  useGetSavedViewQuery,
  useExecuteSavedViewQuery,
  useCreateSavedViewMutation,
  useUpdateSavedViewMutation,
  useDeleteSavedViewMutation,
  useDuplicateProjectMutation,
  useGetMethodologiesQuery,
  useGetDefaultMethodologyQuery,
  useGetMethodologyQuery,
  useGetProjectMethodologyQuery,
  useSetProjectMethodologyMutation,
  useGetSprintLifecycleQuery,
  useUpdateSprintStatusMutation,
  useGetTimelineQuery,
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
  useSetCustomFieldValueMutation,
  useGetCustomFieldValuesQuery,
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
