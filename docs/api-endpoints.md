# Express API Endpoints Reference

## Overview

The ProjeX backend exposes the following REST API endpoints on the Express server. Each endpoint is documented with its method, path, request/response shape, and authorization requirements.

All endpoints are prefixed at the root (`/`).

## Authentication

The API expects JWT bearer tokens in the `Authorization` header:

```
Authorization: Bearer <jwt-token>
```

Currently, the Express backend does not validate tokens (see audit report: No authentication on backend). JWT validation will be added during the NestJS migration.

## Endpoints

### Health Check

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | Health check endpoint |

**Response:**
```json
{
  "message": "Server is running"
}
```

### Projects

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/projects` | No | List all projects |
| POST | `/projects` | No | Create a new project |
| GET | `/projects/:id` | No | Get project by ID |
| PATCH | `/projects/:id` | No | Update project |
| DELETE | `/projects/:id` | No | Delete project |

**Create Project Request:**
```json
{
  "name": "Project Name",
  "description": "Project description",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

**Response (GET /projects):**
```json
[
  {
    "id": 1,
    "name": "Project Name",
    "description": "Description",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-12-31T00:00:00.000Z"
  }
]
```

### Tasks

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/tasks?projectId={projectId}` | No | List tasks by project |
| POST | `/tasks` | No | Create a new task |
| GET | `/tasks/user/{userId}` | No | List tasks by user |
| PATCH | `/tasks/{id}/status` | No | Update task status |
| GET | `/tasks/{id}` | No | Get task by ID |
| PATCH | `/tasks/{id}` | No | Update task |
| DELETE | `/tasks/{id}` | No | Delete task |

**Create Task Request:**
```json
{
  "title": "Task Title",
  "description": "Task description",
  "status": "TODO",
  "priority": "MEDIUM",
  "tags": "bug,urgent",
  "startDate": "2024-01-01",
  "dueDate": "2024-06-01",
  "points": 5,
  "projectId": 1,
  "authorUserId": 1,
  "assignedUserId": 2
}
```

**Update Task Status Request:**
```json
{
  "status": "IN_PROGRESS"
}
```

**Response (GET /tasks?projectId=1):**
```json
[
  {
    "id": 1,
    "title": "Task Title",
    "description": "Description",
    "status": "TODO",
    "priority": "MEDIUM",
    "tags": "bug,urgent",
    "startDate": "2024-01-01T00:00:00.000Z",
    "dueDate": "2024-06-01T00:00:00.000Z",
    "points": 5,
    "projectId": 1,
    "authorUserId": 1,
    "assignedUserId": 2,
    "author": { "id": 1, "username": "alice" },
    "assignee": { "id": 2, "username": "bob" }
  }
]
```

### Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users` | No | List all users |
| POST | `/users` | No | Create a new user |
| GET | `/users/{id}` | No | Get user by ID |
| PATCH | `/users/{id}` | No | Update user |
| DELETE | `/users/{id}` | No | Delete user |

### Teams

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/teams` | No | List all teams |
| POST | `/teams` | No | Create a new team |
| GET | `/teams/{id}` | No | Get team by ID |
| PATCH | `/teams/{id}` | No | Update team |
| DELETE | `/teams/{id}` | No | Delete team |

### Search

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/search?query={query}` | No | Search tasks, projects, and users |

**Response:**
```json
{
  "tasks": [...],
  "projects": [...],
  "users": [...]
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error Type",
  "message": "Error message",
  "statusCode": 400
}
```

Common error codes:
- `400 Bad Request` — Invalid input or missing required fields
- `401 Unauthorized` — Missing or invalid authentication
- `403 Forbidden` — Insufficient permissions
- `404 Not Found` — Resource not found
- `500 Internal Server Error` — Server error (should not occur in production)

## Migration Notes

The NestJS backend (`server/nest/`) mirrors this API surface with:
- Global `/api` prefix and `v` versioning
- JWT bearer authentication via `Authorization` header
- Class-validator DTOs for request validation
- Standardized error responses via `AllExceptionsFilter`
- Swagger/OpenAPI documentation at `/api/docs`

The NestJS API paths will be:
- `GET /api/v1/health` (health check)
- `GET /api/v1/users` (list users)
- `POST /api/v1/users` (create user)
- `GET /api/v1/users/:cognitoId` (get user)
- `PATCH /api/v1/users/:cognitoId` (update user)
- `DELETE /api/v1/users/:cognitoId` (delete user)
- `GET /api/v1/projects` (list projects)
- `POST /api/v1/projects` (create project)
- `GET /api/v1/projects/:id` (get project)
- `PATCH /api/v1/projects/:id` (update project)
- `DELETE /api/v1/projects/:id` (delete project)
- And similar for tasks, teams, and search endpoints.
