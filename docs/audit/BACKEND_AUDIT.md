# Backend and API Audit

## Overview

The backend is an Express.js application written in TypeScript. It uses Prisma ORM (now SQLite for local development, PostgreSQL for production) and exposes a REST API consumed by the Next.js frontend.

## 1. Express Application Structure

### Entry Point

- **`src/index.ts`**: Express app with middleware:
  - `express.json()` - JSON body parsing
  - `helmet()` - Security headers
  - `helmet.crossOriginResourcePolicy({ policy: "cross-origin" })`
  - `morgan("common")` - Request logging (no correlation IDs)
  - `bodyParser.json()` and `bodyParser.urlencoded({ extended: false })`
  - `cors()` - Permissive CORS (allows all origins)
  - `dotenv.config()` - Environment loading

### Routes

| Route | Controller File | Methods | Description |
|-------|----------------|---------|-------------|
| `/projects` | `projectController.ts` | GET, POST | List all projects, create project |
| `/tasks` | `taskController.ts` | GET, POST, PATCH | List tasks (by projectId), create task, update task status |
| `/tasks/user/:userId` | `taskController.ts` | GET | Get tasks for a specific user (author or assignee) |
| `/users` | `userController.ts` | GET, POST | List all users, create user |
| `/users/:cognitoId` | `userController.ts` | GET | Get user by Cognito ID |
| `/teams` | `teamController.ts` | GET | List all teams with owner/manager usernames |
| `/search` | `searchController.ts` | GET | Search tasks, projects, and users by query string |

## 2. Controllers

### Business Logic Location

All business logic resides directly inside Express route handlers in the controllers. There is no service layer abstraction. Each controller imports `PrismaClient` directly and instantiates it as a module-level singleton (`const prisma = new PrismaClient()`).

### Controller Details

#### projectController.ts
- `getProjects`: Returns all projects via `prisma.project.findMany()`
- `createProject`: Creates project from body fields `{ name, description, startDate, endDate }`

#### taskController.ts
- `getTasks`: Returns tasks filtered by `projectId` query param. Includes author, assignee, comments, attachments.
- `createTask`: Creates task from full body. Accepts all Task fields including `authorUserId`, `assignedUserId`.
- `updateTaskStatus`: Updates task status by `taskId` param.
- `getUserTasks`: Returns tasks where user is author or assignee via OR query.

#### userController.ts
- `getUsers`: Returns all users.
- `getUser`: Returns user by `cognitoId` param.
- `postUser`: Creates user with `{ username, cognitoId, profilePictureUrl, teamId }`. Defaults `profilePictureUrl` to "i1.jpg" and `teamId` to 1.

#### teamController.ts
- `getTeams`: Returns all teams. Makes N+1 queries: for each team, queries for productOwner and projectManager usernames separately.

#### searchController.ts
- `search`: Performs `findMany` with `contains` filter on tasks (title, description), projects (name, description), users (username) simultaneously.

## 3. Endpoint-to-Frontend Mapping

| Frontend API Call (RTK Query) | Backend Endpoint | Controller |
|-------------------------------|------------------|------------|
| `getProjects` | GET `/projects` | `getProjects` |
| `createProject` | POST `/projects` | `createProject` |
| `getTasks({ projectId })` | GET `/tasks?projectId=X` | `getTasks` |
| `createTask` | POST `/tasks` | `createTask` |
| `updateTaskStatus({ taskId, status })` | PATCH `/tasks/{taskId}/status` | `updateTaskStatus` |
| `getTasksByUser(userId)` | GET `/tasks/user/{userId}` | `getUserTasks` |
| `getUsers` | GET `/users` | `getUsers` |
| `getTeams` | GET `/teams` | `getTeams` |
| `search(query)` | GET `/search?query=X` | `search` |
| `getAuthUser` | GET `/users/{userSub}` | `getUser` |

## 4. Inconsistent Responses and Error Formats

### Response Formats
- Successful responses return raw Prisma objects (no envelope/wrapper). Different controllers return different shapes.
- `createProject` returns the created project object directly.
- `postUser` returns `{ message: "User Created Successfully", newUser }` - a different shape than `createProject`.
- `getTeams` returns enriched objects with `productOwnerUsername` and `projectManagerUsername` added.
- `search` returns `{ tasks, projects, users }` - a composite response.

### Error Formats
- All errors use `res.status(500).json({ message: \`Error <action>: ${error.message}\` })`
- Every error returns 500 status code, even for validation errors, not-found cases, or duplicate key violations.
- No error codes, no structured error envelope, no request correlation IDs.
- Error messages leak internal database error strings directly to the client.

## 5. Security and Validation Gaps

### Authentication
- **No authentication middleware**: The backend has zero authentication or authorization checks. Although the frontend sends `Authorization: Bearer <accessToken>` headers (Cognito JWT), the backend never validates them.
- **No token verification**: Cognito tokens are not validated on the server. Any client can make requests without a token.

### Input Validation
- **No input validation**: No DTOs, no Zod/Joi/express-validator. Request bodies are destructured and passed directly to Prisma.
- **No type coercion safety**: Query params like `projectId` are cast with `Number()` without validation. Invalid values produce `NaN` which Prisma may handle unpredictably.
- **No sanitization**: User input flows directly to database queries.

### Authorization
- **No role-based access control**: Any user can create projects, tasks, and users.
- **No ownership checks**: Users can modify any task regardless of project membership.
- **No rate limiting**: No DDoS or brute-force protection.

### Other Security Issues
- **Permissive CORS**: `app.use(cors())` allows all origins.
- **No request body size limits**: Can lead to DoS.
- **Sensitive data in errors**: Database error messages exposed to clients.
- **No HTTPS enforcement**: Server listens on HTTP only.
- **Hardcoded credentials**: The `DATABASE_URL` in `.env` contains inline credentials. `.env` is gitignored but committed env files are not tracked.

## 6. Performance Issues

- **N+1 queries in `getTeams`**: Each team triggers 2 additional Prisma queries (product owner + project manager).
- **No pagination**: `findMany()` calls have no `take`/`skip` or cursor pagination.
- **No database indexes**: Only unique constraints on `User.cognitoId` and `User.username`. All other foreign key and filter columns lack indexes.
- **No caching layer**: No Redis or in-memory cache for frequently accessed data.

## 7. Code Quality

- **No service layer**: Business logic embedded in controllers.
- **No DTOs**: Raw request bodies used directly.
- **No centralized error handler**: Each controller has its own try/catch.
- **No logging abstraction**: Uses `morgan("common")` only for HTTP request logging. No structured application logging.
- **No tests**: Zero test coverage (test script is a placeholder).
- **No linting or formatting**: No ESLint or Prettier configured in the server.
- **Inconsistent code style**: `postUser` returns a different shape than other create endpoints.

## 8. Prisma Client Usage

- Each controller file creates its own `PrismaClient` instance (`const prisma = new PrismaClient()`), resulting in multiple client instances. Should be a singleton or injected via DI.
- The `include` option is used in `getTasks` but not in `getUserTasks` (which only includes author and assignee).
