# Architecture

## Overview

ProjeX v2 is a monorepo project management application with a Next.js frontend and Express.js + Prisma backend.

```
project-root/
├── client/                    # Next.js 14 frontend (App Router)
│   ├── src/
│   │   ├── app/               # App Router pages and layouts
│   │   ├── components/        # Reusable React components
│   │   ├── lib/               # Utility functions
│   │   └── state/             # Redux store, RTK Query API, global state
│   ├── public/                # Static assets (images)
│   └── package.json
├── server/                    # Express.js backend
│   ├── src/
│   │   ├── controllers/       # Request handlers (business logic)
│   │   ├── routes/            # Express routers
│   │   ├── app.ts             # Express app (middleware + routes)
│   │   └── index.ts           # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   ├── migrations/        # Migration files
│   │   ├── seed.ts            # Database seed script
│   │   └── seedData/          # Seed data JSON files
│   └── package.json
├── .github/workflows/         # CI/CD
├── docs/                      # Documentation
└── .gitignore
```

## Architecture Diagram

```
┌─────────────────────┐       HTTP/REST       ┌─────────────────────┐
│   Client (Browser)  │ ◄───────────────────► │   Backend (Express) │
│                     │                       │                     │
│   Next.js 14        │                       │   Express 4.x       │
│   React 18          │                       │   TypeScript        │
│   Redux Toolkit     │                       │                     │
│   RTK Query         │                       │   Prisma Client     │
│   AWS Amplify       │                       │   (SQLite/PostgreSQL)│
│   (Auth - disabled) │                       │                     │
└─────────────────────┘                       └──────────┬──────────┘
                                                           │ Prisma
                                                           ▼
                                                  ┌─────────────────┐
                                                  │   Database      │
                                                  │   SQLite (dev)  │
                                                  │   PostgreSQL    │
                                                  │   (production)  │
                                                  └─────────────────┘
```

## Data Flow

```
1. User interacts with UI (Next.js frontend)
2. RTK Query sends HTTP request to Express backend
3. Express route handler calls Prisma Client
4. Prisma Client executes SQL against database
5. Response flows back: DB → Prisma → Express → RTK Query → Redux Store → React Component
```

## Key Technologies

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js | 14.2.5 |
| Frontend | React | 18 |
| Frontend | TypeScript | 5 |
| Frontend | Redux Toolkit | 2.2.7 |
| Frontend | RTK Query | 2.2.7 |
| Frontend | Tailwind CSS | 3.4.1 |
| Frontend | Material-UI | 5.16.6 |
| Frontend | AWS Amplify | 6.5.1 |
| Backend | Express.js | 4.19.2 |
| Backend | TypeScript | 5.5.4 |
| Backend | Prisma | 5.18.0 |
| Backend | SQLite | (local dev) |
| Backend | PostgreSQL | (production) |
| Testing | Jest | 30.x |
| Testing | ts-jest | 29.x |
| Testing | Supertest | 7.x |
| Auth | AWS Cognito | - |
| CI/CD | GitHub Actions | - |

## API Contract

### Endpoints

All endpoints return raw JSON objects (no standardized envelope).

| Method | Path | Controller | Description |
|--------|------|-----------|-------------|
| GET | `/projects` | getProjects | List all projects |
| POST | `/projects` | createProject | Create a project |
| GET | `/tasks?projectId=N` | getTasks | List tasks for a project |
| POST | `/tasks` | createTask | Create a task |
| PATCH | `/tasks/:taskId/status` | updateTaskStatus | Update task status |
| GET | `/tasks/user/:userId` | getUserTasks | Get tasks for a user |
| GET | `/users` | getUsers | List all users |
| GET | `/users/:cognitoId` | getUser | Get user by Cognito ID |
| POST | `/users` | postUser | Create a user |
| GET | `/teams` | getTeams | List all teams with owner/manager |
| GET | `/search?query=X` | search | Search tasks, projects, users |

### Frontend API Integration (RTK Query)

| Hook | Endpoint | Purpose |
|------|----------|---------|
| `useGetProjectsQuery` | GET `/projects` | Fetch all projects |
| `useCreateProjectMutation` | POST `/projects` | Create project |
| `useGetTasksQuery({projectId})` | GET `/tasks` | Fetch tasks for project |
| `useCreateTaskMutation` | POST `/tasks` | Create task |
| `useUpdateTaskStatusMutation` | PATCH `/tasks/:id/status` | Update task status |
| `useGetTasksByUserQuery(userId)` | GET `/tasks/user/:userId` | Fetch user's tasks |
| `useGetUsersQuery` | GET `/users` | Fetch all users |
| `useGetUserQuery(cognitoId)` | GET `/users/:cognitoId` | Fetch user by Cognito ID |
| `useCreateUserMutation` | POST `/users` | Create user |
| `useGetTeamsQuery` | GET `/teams` | Fetch all teams |
| `useSearchQuery(query)` | GET `/search` | Search across models |
| `useGetAuthUserQuery` | GET `/users/:userSub` | Fetch authenticated user |

### TypeScript Interfaces

The frontend `src/state/api.ts` defines these interfaces matching backend models:
- `Project` - id, name, description, startDate, endDate
- `Task` - id, title, description, status, priority, tags, startDate, dueDate, points, projectId, authorUserId, assignedUserId, author, assignee, comments, attachments
- `User` - userId, cognitoId, username, profilePictureUrl, teamId
- `Team` - teamId, teamName, productOwnerUsername, projectManagerUsername
- `Attachment` - id, fileURL, fileName, taskId, uploadedById
- `Comment` - id, text, taskId, userId
- `TaskAssignment` - id, userId, taskId
- `Status` (enum) - ToDo, WorkInProgress, UnderReview, Completed
- `Priority` (enum) - Urgent, High, Medium, Low, Backlog
