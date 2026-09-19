# Frontend Codebase Audit

## Overview

The frontend is a Next.js 14.2.5 application (App Router) using TypeScript, Tailwind CSS, Material-UI, Redux Toolkit with RTK Query, AWS Amplify for authentication, react-dnd for drag-and-drop, gantt-task-react for timelines, recharts for charts, and react-dnd for board drag-and-drop.

## 1. Routes and Pages

### Application Routes

| Route | File | Description |
|-------|------|-------------|
| `/` | `src/app/page.tsx` | Redirects to `./home/page.tsx` dashboard |
| `/home` | `src/app/home/page.tsx` | Dashboard: task priority chart, project status chart, task list |
| `/projects/[id]` | `src/app/projects/[id]/page.tsx` | Project detail page; renders Board, List, Timeline, Table views |
| `/projects/[id]/Board` | `src/app/projects/BoardView/index.tsx` | Kanban board with drag-and-drop status columns |
| `/projects/[id]/List` | `src/app/projects/ListView/index.tsx` | List view of tasks |
| `/projects/[id]/Table` | `src/app/projects/TableView/index.tsx` | MUI DataGrid table view of tasks |
| `/projects/[id]/Timeline` | `src/app/projects/TimelineView/index.tsx` | Gantt chart timeline |
| `/priority/urgent` | `src/app/priority/urgent/page.tsx` | Urgent priority tasks (wraps ReusablePriorityPage) |
| `/priority/high` | `src/app/priority/high/page.tsx` | High priority tasks |
| `/priority/medium` | `src/app/priority/medium/page.tsx` | Medium priority tasks |
| `/priority/low` | `src/app/priority/low/page.tsx` | Low priority tasks |
| `/priority/backlog` | `src/app/priority/backlog/page.tsx` | Backlog priority tasks |
| `/priority/reusablePriorityPage` | `src/app/priority/reusablePriorityPage/index.tsx` | Shared component for all priority pages |
| `/search` | `src/app/search/page.tsx` | Search across tasks, projects, users |
| `/teams` | `src/app/teams/page.tsx` | Team list with DataGrid |
| `/users` | `src/app/users/page.tsx` | User list with DataGrid |
| `/settings` | `src/app/settings/page.tsx` | Static settings page |
| `/timeline` | `src/app/timeline/page.tsx` | Project timeline Gantt chart |

### Page States

- **Loading**: Each page returns `<div>Loading...</div>` or `<div>Loading..</div>` as a minimal inline fallback. No dedicated loading components or skeletons.
- **Error**: Each page returns `<div>Error fetching data</div>` or similar. No error boundaries or retry mechanisms.
- **Empty**: Some pages (e.g., ReusablePriorityPage) show a "No data available" message. Not consistently applied.

## 2. Components

### Reusable Components

| Component | File | Description |
|-----------|------|-------------|
| `Header` | `src/components/Header/index.tsx` | Page header with title and optional button |
| `Modal` | `src/components/Modal/index.tsx` | Portal-based modal wrapper |
| `ModalNewTask` | `src/components/ModalNewTask/index.tsx` | Form for creating new tasks |
| `Navbar` | `src/components/Navbar/index.tsx` | Top navigation bar with dark mode toggle |
| `Sidebar` | `src/components/Sidebar/index.tsx` | Collapsible sidebar with navigation links |
| `ProjectCard` | `src/components/ProjectCard/index.tsx` | Simple project summary card |
| `TaskCard` | `src/components/TaskCard/index.tsx` | Task detail card with attachments, tags, dates |
| `UserCard` | `src/components/UserCard/index.tsx` | Simple user display card |

### Component Issues

- **No shared design system**: Each view defines its own Tailwind class strings inline. No centralized design tokens (colors are referenced via `blue-primary`, `dark-bg`, etc. in tailwind config only).
- **Duplicated column definitions**: `TableView` and `reusablePriorityPage` define nearly identical `GridColDef` column arrays with slight variations (e.g., `author` field rendering differs: `params.value.username` vs `params.value?.author`).
- **Duplicated button styles**: The "Add Task" and "Create Project" buttons use identical inline Tailwind classes duplicated across `ProjectHeader`, `ListView`, `TableView`, `TimelineView`, and `ProjectHeader`.
- **UserCard profile picture bug** (critical): Line 14 hardcodes `src="/p1.jpeg"` for all users instead of using `user.profilePictureUrl`.

## 3. State Management

### Redux Store

- **Store configuration**: `src/app/redux.tsx` - uses `configureStore` with `combineReducers`. Persists only the `global` slice (not RTK Query cache).
- **Global slice**: `src/state/index.ts` - manages `isSidebarCollapsed` and `isDarkMode` state.
- **API slice**: `src/state/api.ts` - RTK Query API with 8 endpoints:
  - `getAuthUser` - Fetches current Cognito user
  - `getProjects` / `createProject` - Project CRUD (create only, no update/delete)
  - `getTasks(projectId)` / `createTask` / `updateTaskStatus(taskId, status)` - Task operations
  - `getTasksByUser(userId)` - Tasks assigned to or authored by a user
  - `getUsers` - List all users
  - `getTeams` - List all teams
  - `search(query)` - Search across tasks, projects, users

### Auth Flow

- **`authProvider.tsx`**: Configures AWS Amplify with Cognito. Wraps the app in `Authenticator` UI component.
- **`dashboardWrapper.tsx`**: AuthProvider is **commented out** (line 42: `{/* <AuthProvider> */}`). The app renders without requiring authentication.
- **`api.ts`**: `prepareHeaders` retrieves AWS session tokens and sets `Authorization: Bearer <accessToken>` header.
- **Sidebar/Navbar**: Call `useGetAuthUserQuery` and `signOut` from AWS Amplify, but handle null user gracefully.

### Static / Mock / Hardcoded Data

1. **`reusablePriorityPage/index.tsx` line 82**: `const userId = 3;` - Hardcoded user ID for fetching tasks instead of using the authenticated user.
2. **`settings/page.tsx` lines 6-11**: Entire settings object is hardcoded (username: "johndoe", email: "john.doe@example.com", teamName: "Development Team", roleName: "Developer").
3. **`ProjectHeader.tsx` line 30**: Project name hardcoded as "Product Design Development" instead of using the actual project name from the route or API.
4. **`home/page.tsx` line 43**: `projectId: parseInt("1")` - Hardcoded project ID.
5. **`UserCard` line 14**: Hardcoded `/p1.jpeg` profile picture.
6. **`api.ts` `Team` interface**: `Team` type has `teamId` as the field name, but the backend Prisma schema and seed data use `id`. The API endpoint `/teams` returns objects with `id` (from Prisma), but the frontend `Team` interface expects `teamId`. This mismatch is handled implicitly by the DataGrid column `field: "id"` in `teams/page.tsx`.

## 4. Unused Files and Dependencies

- **`authProvider.tsx`** is defined but never imported anywhere (AuthProvider is commented out in `dashboardWrapper.tsx`). The AWS Amplify auth configuration runs at import time but the Authenticator wrapper is not used.
- **`@aws-amplify/ui-react`** and related CSS import in `authProvider.tsx` are effectively dead code since the AuthProvider wrapper is disabled.
- **`server/src/routes/seeder.ts`** and related seed route imports are commented out in `index.ts`.
- **`client/src/app/favicon.ico`** exists but no favicon route handling.

## 5. UI and API Issues

### UI Issues
- No error boundaries at the route or component level.
- No dedicated loading/empty/error state components (inline divs only).
- Dark mode toggle exists but `AuthProvider` (which would gate access) is disabled.
- Profile pictures are served from local static `public/` images (e.g., `p1.jpeg`), not actual URLs from a storage service.
- `isFormValid()` in `ModalNewTask` has a logic bug: returns `true` when `!(id !== null || projectId)` is true (i.e., when neither id nor projectId is set), which is the opposite of valid.

### API Issues
- Only partial CRUD: Projects have create/read but no update/delete. Tasks have create/read/update-status but no delete. No task update endpoint.
- No pagination on list endpoints.
- No filtering/sorting parameters beyond projectId and userId.
- RTK Query cache is not persisted; users lose data on page refresh.
- No request cancellation or retry logic configured.

## 6. Key Files

| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout; wraps app in DashboardWrapper |
| `src/app/dashboardWrapper.tsx` | App shell: Redux Provider, Sidebar, Navbar, AuthProvider (disabled) |
| `src/app/redux.tsx` | Redux store configuration with persistence |
| `src/state/api.ts` | RTK Query API definitions and TypeScript interfaces |
| `src/state/index.ts` | Global UI state slice (sidebar, dark mode) |
| `src/lib/utils.ts` | DataGrid styling utilities |
