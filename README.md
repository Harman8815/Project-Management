# ProjeX - Project Management System

A full-stack project management application built with Next.js (frontend) and Express.js + Prisma + PostgreSQL (backend). The application helps teams manage projects, tasks, teams, and users with priority-based task tracking, board/list/table/timeline views, and AWS Cognito authentication.

## Features

- **Project Management**: Create, view, and manage projects with multiple views (Board, List, Table, Timeline)
- **Task Management**: Create tasks with priorities (Urgent, High, Medium, Low, Backlog), statuses, tags, points, and due dates
- **Team & User Management**: Assign users to teams, roles (Product Owner, Project Manager)
- **Priority Views**: Filter tasks by priority level
- **Search**: Search across tasks, projects, and users
- **Authentication**: AWS Cognito based authentication
- **State Management**: Redux Toolkit with RTK Query for API calls and redux-persist for state persistence
- **Database**: PostgreSQL via Prisma ORM
- **Responsive UI**: Tailwind CSS + Material-UI components

## Tech Stack

### Frontend (Client)
- **Next.js** 14.2.5 (React framework)
- **TypeScript**
- **Tailwind CSS** + **Material-UI** (@mui/material, @mui/x-data-grid)
- **Redux Toolkit** & **RTK Query** for state management and API calls
- **redux-persist** for state persistence
- **AWS Amplify** for authentication
- **react-dnd** for drag-and-drop board
- **gantt-task-react** for timeline/Gantt charts
- **recharts** for charts

### Backend (Server)
- **Express.js** REST API
- **TypeScript**
- **Prisma ORM** with PostgreSQL
- **JWT/Cognito** authentication via AWS Amplify
- **helmet**, **cors**, **morgan** for security and logging

## Project Structure

```
.
├── client/                 # Next.js frontend
│   ├── public/
│   ├── src/
│   │   ├── app/           # Next.js App Router pages
│   │   ├── components/    # Reusable UI components
│   │   ├── state/         # Redux state & API
│   │   └── lib/           # Utilities
│   └── package.json
├── server/                 # Express.js backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   └── routes/        # API routes
│   ├── prisma/            # Prisma schema, migrations, seed data
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL database (or use a cloud provider like Supabase, Neon, or AWS RDS)
- AWS Cognito user pool (for authentication)

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables. Create a `.env` file in the `server` directory:
   ```env
   DATABASE_URL="postgresql://user:password@host:port/database"
   PORT=3000
   ```

4. Set up the database and run migrations:
   ```bash
   npx prisma migrate deploy
   ```

5. Seed the database with sample data:
   ```bash
   npm run seed
   ```

6. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables. Create a `.env.local` file in the `client` directory:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
   ```

4. Configure AWS Cognito in the Amplify configuration (see `authProvider.tsx`)

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

The backend exposes the following REST API endpoints:

- `GET /projects` - Get all projects
- `POST /projects` - Create a new project
- `GET /tasks?projectId={id}` - Get tasks for a project
- `POST /tasks` - Create a new task
- `PATCH /tasks/{taskId}/status` - Update task status
- `GET /users` - Get all users
- `GET /teams` - Get all teams
- `GET /search?query={query}` - Search tasks, projects, and users

## Database Schema

The database uses Prisma with the following models:

- **User**: User accounts with Cognito integration
- **Team**: Teams that users belong to
- **Project**: Projects managed by teams
- **Task**: Tasks within projects
- **TaskAssignment**: Many-to-many relationship between users and tasks
- **Attachment**: Files attached to tasks
- **Comments**: Comments on tasks

## Deployment

### Backend
The backend can be deployed using PM2 (see `ecosystem.config.js`):
```bash
pm2 start ecosystem.config.js
```

### Frontend
The frontend is a Next.js application and can be deployed to:
- Vercel (recommended)
- Any static hosting service (after `next build` and `next export`)

## License

ISC