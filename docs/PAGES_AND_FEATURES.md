# ProjeX - Pages & Functionality Reference

## Frontend Pages (Next.js App Router)

### 1. Home / Dashboard (`/`)
**File:** `client/src/app/page.tsx` → `client/src/app/home/page.tsx`
- Project Management Dashboard
- Shows Task Priority Distribution bar chart (by priority)
- Shows Project Status pie chart (Active vs Completed)
- Shows "Your Tasks" data grid for project ID 1
- Dark mode support via Redux state

### 2. Project Detail (`/projects/[id]`)
**File:** `client/src/app/projects/[id]/page.tsx`
- Project detail page with 4 view tabs:
  - **Board** - Drag-and-drop Kanban board (react-dnd)
  - **List** - Task cards in grid layout
  - **Table** - MUI DataGrid table view
  - **Timeline** - Gantt chart view (gantt-task-react)
- Header with "New Boards" button (opens ModalNewProject)
- Filter, Share, and Search Task input
- ModalNewTask for adding new tasks

### 3. Projects List (`/projects`)
**File:** `client/src/app/projects/` (layout components)
- ProjectHeader - Header with view tab switcher
- ModalNewProject - Modal for creating new projects
- BoardView - Kanban board with drag-and-drop task status updates
  - Columns: To Do, Work In Progress, Under Review, Completed
  - Task cards show priority, tags, dates, points, author/assignee avatars, comment count
- ListView - Task cards grid with "Add Task" button
- TableView - MUI DataGrid with task details
- TimelineView - Gantt chart with Day/Week/Month view mode selector

### 4. Priority Pages (`/priority/[priority]`)
- **Urgent** (`/priority/urgent/page.tsx`)
- **High** (`/priority/high/page.tsx`)
- **Medium** (`/priority/medium/page.tsx`)
- **Low** (`/priority/low/page.tsx`)
- **Backlog** (`/priority/backlog/page.tsx`)
- All use shared `ReusablePriorityPage` component
- Shows tasks filtered by priority for current user (user ID hardcoded to 3)
- Toggle between List and Table view
- "Add Task" button opens ModalNewTask

### 5. Timeline (`/timeline`)
**File:** `client/src/app/timeline/page.tsx`
- Global Projects Timeline (all projects)
- Gantt chart with Day/Week/Month view mode selector
- Shows project start/end dates and progress (50% fixed)

### 6. Teams (`/teams`)
**File:** `client/src/app/teams/page.tsx`
- MUI DataGrid showing all teams
- Columns: Team ID, Team Name, Product Owner, Project Manager
- Custom toolbar with Filter and Export buttons
- Pagination enabled

### 7. Users (`/users`)
**File:** `client/src/app/users/page.tsx`
- MUI DataGrid showing all users
- Columns: ID, Username, Profile Picture (circular image)
- Custom toolbar with Filter and Export buttons
- Pagination enabled

### 8. Search (`/search`)
**File:** `client/src/app/search/page.tsx`
- Search input with 500ms debounce
- Only triggers search when 3+ characters entered
- Displays results in 3 sections: Tasks (TaskCard), Projects (ProjectCard), Users (UserCard)

### 9. Settings (`/settings`)
**File:** `client/src/app/settings/page.tsx`
- Display-only user settings (hardcoded data)
- Shows: Username, Email, Team, Role

## Shared Components

- **Header** - Page header with optional button component
- **Navbar** - Navigation bar
- **Sidebar** - Side navigation
- **Modal** - Base modal component
- **ModalNewTask** - Form modal for creating new tasks
- **ModalNewProject** - Form modal for creating new projects
- **TaskCard** - Reusable task card
- **ProjectCard** - Reusable project card
- **UserCard** - Reusable user card
- **authProvider** - AWS Cognito authentication provider
- **dashboardWrapper** - Wraps pages with auth + store provider

## State Management (Redux Toolkit / RTK Query)
- `api.ts` - RTK Query API endpoints:
  - `getAuthUser`, `getProjects`, `createProject`
  - `getTasks`, `getTasksByUser`, `createTask`, `updateTaskStatus`
  - `getUsers`, `getTeams`, `search`
- `redux.tsx` - Redux store with redux-persist (persisted to localStorage)
- Global state: `isDarkMode` toggle

## Backend API Endpoints (Express.js)

| Method | Endpoint | Controller | Description |
|--------|----------|-----------|-------------|
| GET | `/projects` | projectController | Get all projects |
| POST | `/projects` | projectController | Create project |
| GET | `/tasks?projectId={id}` | taskController | Get tasks by project |
| POST | `/tasks` | taskController | Create task |
| PATCH | `/tasks/{id}/status` | taskController | Update task status |
| GET | `/tasks/user/{userId}` | taskController | Get tasks by user |
| GET | `/users` | userController | Get all users |
| GET | `/teams` | teamController | Get all teams |
| GET | `/search?query={q}` | searchController | Search tasks/projects/users |

## Database Models (Prisma)
- **User** - userId, cognitoId, username, profilePictureUrl, teamId
- **Team** - id, teamName, productOwnerUserId, projectManagerUserId
- **Project** - id, name, description, startDate, endDate
- **Task** - id, title, description, status, priority, tags, startDate, dueDate, points, projectId, authorUserId, assignedUserId
- **TaskAssignment** - id, userId, taskId
- **Attachment** - id, fileURL, fileName, taskId, uploadedById
- **Comment** - id, text, taskId, userId