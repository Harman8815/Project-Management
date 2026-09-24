# ProjeX - Project Management System

A full-stack project management application built with Next.js (frontend) and NestJS + Prisma (backend). Supports SQLite for local development and PostgreSQL for production. The application helps teams manage projects, tasks, teams, and users with priority-based task tracking, board/list/table/timeline views, and JWT-based authentication.

## Features

- **Project Management**: Create, view, and manage projects with multiple views (Board, List, Table, Timeline)
- **Task Management**: Create tasks with priorities (Urgent, High, Medium, Low, Backlog), statuses, tags, points, and due dates
- **Team & User Management**: Assign users to teams, roles (Product Owner, Project Manager)
- **Priority Views**: Filter tasks by priority level
- **Search**: Search across tasks, projects, and users
- **Authentication**: JWT-based authentication with role-based authorization
- **State Management**: Redux Toolkit with RTK Query for API calls and redux-persist for state persistence
- **Database**: SQLite (local dev) / PostgreSQL (production) via Prisma ORM
- **Responsive UI**: Tailwind CSS + Material-UI components
- **Customizable Workflows**: Configurable workflow definitions per organization
- **Calendar Synchronization**: Sync with Google/Microsoft/Caldav providers, manage calendar events, link events to tasks
- **External Integrations**: GitHub/GitLab activity sync, structured project import/export, webhook verification
- **AI Assistant**: Natural-language task search, report generation, task breakdown suggestions, planning assistance
- **AI Safety**: Fallback behavior for model failures, authorization boundaries, prompt injection protection, daily rate limiting
- **Comments**: Comment system with mentions and replies

## Tech Stack

### Frontend (Client)
- **Next.js** 14 (React framework)
- **TypeScript**
- **Tailwind CSS** + **Material-UI** (@mui/material, @mui/x-data-grid)
- **Redux Toolkit** & **RTK Query** for state management and API calls
- **redux-persist** for state persistence
- **AWS Amplify** for authentication
- **react-dnd** for drag-and-drop board
- **gantt-task-react** for timeline/Gantt charts
- **recharts** for charts

### Backend (Server)
- **NestJS** framework with modular architecture
- **TypeScript**
- **Prisma ORM** with SQLite (local) / PostgreSQL (production)
- **JWT** authentication
- **Calendar sync** (Google, Microsoft, CalDAV)
- **Webhook verification** with HMAC signature validation
- **iCal parsing** for calendar events

## Project Structure

```
.
├── client/                 # Next.js frontend
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── app/            # Next.js App Router pages
│   │   ├── components/     # Reusable UI components
│   │   ├── state/          # Redux state & API hooks
│   │   └── lib/            # Utilities
│   └── package.json
├── server/                 # NestJS backend
│   ├── nest/
│   │   ├── src/            # Source code
│   │   │   ├── modules/    # Feature modules (tasks, projects, users, etc.)
│   │   │   ├── prisma/     # PrismaService & PrismaModule
│   │   │   ├── common/     # Guards, interceptors, filters, decorators
│   │   │   ├── config/     # Environment validation
│   │   │   └── app.module.ts
│   │   ├── prisma/         # Prisma schema, migrations, seed data
│   │   ├── dist/           # Compiled output (generated)
│   │   └── package.json
│   └── package.json        # Backend root package.json
└── README.md
```

## Getting Started

### Prerequisites

- **Node.js** v18+ (recommended)
- **npm** (comes with Node.js)

### Step 1: Backend Setup

```bash
cd server
npm install
```

### Step 2: Configure Backend Environment

Create a `.env` file in the `server/` directory:

```env
PORT=8000
DATABASE_URL="file:./dev.db"
JWT_SECRET="fallback-secret-change-me"
```

> **Note:** If `JWT_SECRET` is not set, the server defaults to `"fallback-secret-change-me"`.

### Step 3: Set Up the Database

```bash
cd server
npx prisma migrate dev --name init
```

This creates a SQLite database (`dev.db`) and runs migrations.

### Step 4: Seed Sample Data (Optional)

```bash
npm run seed
```

This seeds Teams, Projects, Users, Tasks, Comments, Calendar Events, and related data.

### Step 5: Start the Backend

**Development mode (auto-restart on file changes):**
```bash
npm run dev
```

**Production build and start:**
```bash
npm run build && node nest/dist/src/main.js
```

By default, the server runs on `http://localhost:8000`.

**API is available at:** `http://localhost:8000/api/v1/`

### Step 6: Frontend Setup

Open a new terminal window:

```bash
cd client
npm install
```

### Step 7: Configure Frontend Environment

Create a `.env.local` file in the `client/` directory:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

> **Important:** Set `NEXT_PUBLIC_API_BASE_URL` to the backend server URL (port 8000 by default, not 3000).

### Step 8: Start the Frontend

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Documentation

All API endpoints are prefixed with `/api/v1` and require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

### Generating a Test JWT Token

For testing purposes, generate a token using Node.js:

```bash
cd server
node -e "const jwt=require('jsonwebtoken'); console.log(jwt.sign({userId:1, cognitoId:'test-user', username:'testuser'}, 'fallback-secret-change-me', {expiresIn:'1h'}))"
```

### Testing the API with curl

```bash
# Test tasks endpoint (replace TOKEN with the generated JWT)
curl http://localhost:8000/api/v1/tasks?projectId=1 \
  -H "Authorization: Bearer TOKEN"

# Health check (if available)
curl http://localhost:8000/api/v1/projects \
  -H "Authorization: Bearer TOKEN"
```

### Available API Endpoints

- `GET /api/v1/projects` - Get all projects
- `POST /api/v1/projects` - Create a new project
- `GET /api/v1/projects/:id` - Get a project by ID
- `PATCH /api/v1/projects/:id` - Update a project
- `DELETE /api/v1/projects/:id` - Delete a project
- `POST /api/v1/projects/:id/archive` - Archive a project
- `POST /api/v1/projects/:id/restore` - Restore a project
- `GET /api/v1/tasks?projectId={id}` - Get tasks for a project
- `POST /api/v1/tasks` - Create a new task
- `GET /api/v1/tasks/:id` - Get a task by ID
- `PATCH /api/v1/tasks/:id` - Update a task
- `DELETE /api/v1/tasks/:id` - Delete a task
- `PATCH /api/v1/tasks/:id/status` - Update task status
- `POST /api/v1/tasks/:id/dependencies` - Add task dependency
- `DELETE /api/v1/tasks/:id/dependencies/:blockedById` - Remove task dependency
- `GET /api/v1/tasks/:id/dependencies` - Get task dependencies
- `GET /api/v1/tasks/:id/children` - Get child tasks
- `POST /api/v1/tasks/:id/watchers` - Add watcher to task
- `DELETE /api/v1/tasks/:id/watchers/:userId` - Remove watcher from task
- `GET /api/v1/tasks/:id/watchers` - Get task watchers
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/:cognitoId` - Get a user by Cognito ID
- `PATCH /api/v1/users/:cognitoId` - Update a user
- `DELETE /api/v1/users/:cognitoId` - Delete a user
- `GET /api/v1/projects/:projectId/tasks/user/:userId` - Get tasks for a user in a project
- `POST /api/v1/projects/:projectId/tasks` - Create a task in a project
- `GET /api/v1/projects/:projectId/tasks` - Get all tasks in a project
- `PATCH /api/v1/projects/:projectId/tasks/:id` - Update a task in a project
- `DELETE /api/v1/projects/:projectId/tasks/:id` - Delete a task from a project
- `GET /api/v1/projects/:projectId/tasks/:id` - Get a task in a project
- `GET /api/v1/projects/:projectId/tasks/:id/subtasks` - Get subtasks of a task in a project
- `POST /api/v1/projects/:projectId/tasks/:id/subtasks` - Create a subtask for a task in a project
- `PATCH /api/v1/projects/:projectId/tasks/:id/subtasks/:subtaskId` - Update a subtask
- `DELETE /api/v1/projects/:projectId/tasks/:id/subtasks/:subtaskId` - Delete a subtask
- `POST /api/v1/projects/:projectId/tasks/:id/move` - Move a task to a different status
- `POST /api/v1/projects/:projectId/backlog` - Create a backlog
- `GET /api/v1/projects/:projectId/backlog` - Get backlog
- `PATCH /api/v1/projects/:projectId/backlog` - Update backlog
- `POST /api/v1/projects/:projectId/backlog/tasks` - Add task to backlog
- `DELETE /api/v1/projects/:projectId/backlog/tasks/:taskId` - Remove task from backlog
- `GET /api/v1/teams` - Get all teams
- `POST /api/v1/teams` - Create a team
- `GET /api/v1/teams/:id` - Get a team by ID
- `PATCH /api/v1/teams/:id` - Update a team
- `DELETE /api/v1/teams/:id` - Delete a team
- `POST /api/v1/teams/:id/members` - Add member to team
- `GET /api/v1/teams/:id/members` - Get team members
- `DELETE /api/v1/teams/:id/members/:userId` - Remove member from team
- `GET /api/v1/search?query={query}` - Search tasks, projects, and users
- `GET/POST /api/v1/organizations/:orgId/calendar/events` - Calendar event CRUD
- `POST /api/v1/organizations/:orgId/calendar/sync` - Sync calendar from provider
- `POST /api/v1/organizations/:orgId/calendar/parse-ical` - Parse iCal data
- `POST /api/v1/organizations/:orgId/calendar/events/:eventId/link-task` - Link event to task
- `GET/PUT /api/v1/organizations/:orgId/ai/model-config` - AI model configuration
- `POST /api/v1/organizations/:orgId/ai/answer` - AI assistant query
- `POST /api/v1/organizations/:orgId/ai/search` - Natural language task search
- `POST /api/v1/organizations/:orgId/ai/report` - Generate project report
- `POST /api/v1/organizations/:orgId/ai/task-breakdown` - Get task breakdown suggestions
- `POST /api/v1/organizations/:orgId/ai/planning` - Get planning assistance
- `POST/GET /api/v1/organizations/:orgId/integrations/:id/credential` - Manage credentials
- `POST /api/v1/organizations/:orgId/integrations/activity/link` - Link external activity to task
- `POST /api/v1/organizations/:orgId/integrations/project/export` - Export project
- `POST /api/v1/organizations/:orgId/integrations/project/import` - Import project
- `POST /api/v1/organizations/:orgId/integrations/webhook/verify` - Verify webhook signature
- `POST/GET/DELETE /api/v1/organizations/:orgId/workflows/:type` - Workflow definition CRUD
- `POST /api/v1/organizations/:orgId/workflows/:type/validate-transition` - Validate workflow transition

## Development Commands

### Backend (from `server/` directory)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot-reload (NestJS CLI) |
| `npm run build` | Compile TypeScript to `nest/dist/` |
| `npm start` | Build and run production server |
| `npm run seed` | Seed the database with sample data |
| `npm run test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Lint source files |
| `npm run lint:fix` | Auto-fix lint errors |
| `npm run typecheck` | TypeScript type-check without emitting |
| `npm run format` | Format source files with Prettier |
| `npm run format:check` | Check formatting |
| `npx prisma studio` | Open Prisma Studio (GUI for DB) |

### Frontend (from `client/` directory)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Lint source files |

## Database Schema

The database uses Prisma with the following models:

- **User**: User accounts
- **Team**: Teams that users belong to
- **Project**: Projects managed by teams
- **Task**: Tasks within projects
- **TaskAssignment**: Many-to-many relationship between users and tasks
- **Attachment**: Files attached to tasks
- **Comments**: Comments on tasks
- **CalendarEvent**: Calendar events with optional task linking
- **CalendarSync**: Calendar provider sync configuration
- **Integration**: External service integrations (GitHub, GitLab)
- **IntegrationEvent**: Queued integration events
- **Organization**: Organization/company entity
- **OrganizationMembership**: User roles within organizations
- **OrganizationSetting**: Key-value org settings (workflows, AI config)
- **ActivityLog**: Audit trail of system events
- **Sprint**: Time-boxed work iterations
- **Milestone**: Project milestones
- **ProjectMembership**: User roles within projects
- **ProjectTeam**: Team-project associations
- **ProjectTemplate**: Reusable project templates
- **CustomFieldDefinition**: Custom field schemas
- **CustomFieldValue**: Custom field values
- **Notification**: User notifications
- **NotificationPreference**: User notification preferences
- **TaskDependency**: Task dependencies
- **TaskWatcher**: Task watchers
- **TaskHistory**: Task field change history
- **AiRequestLog**: AI usage tracking
- **AiFeedback**: AI response ratings

## Troubleshooting

### "CANNOT FIND MODULE" error when running `npm start`

The build output goes to `nest/dist/src/`. Use `npm run dev` for development, or if running production:

```bash
npm run build && node nest/dist/src/main.js
```

### Database connection issues

Ensure SQLite file exists and is writable:
```bash
npx prisma migrate dev --name init
```

### Port 8000 already in use

The server reads `PORT` from `.env`. Change it if needed:
```env
PORT=8001
```

### API returns 401 Unauthorized

Ensure you're sending a valid JWT token:
```bash
# Generate a test token
cd server && node -e "console.log(require('jsonwebtoken').sign({userId:1, cognitoId:'test-user', username:'testuser'}, 'fallback-secret-change-me', {expiresIn:'1h'}))"
```

### API returns 403 Project Access Denied

This means the JWT is valid but the user doesn't have access to the requested project. Seed data or adjust project memberships in the database.

## License

ISC
