# Development Guide

## Prerequisites

- Node.js 20+
- npm 10+
- Git

## Project Structure

```
project-root/
├── client/          # Next.js frontend (Next.js 14 + App Router)
├── server/          # Express.js backend (Express + Prisma)
├── .github/          # CI/CD workflows
├── docs/             # Documentation
├── prisma/           # (via server/prisma/)
└── package.json      # (via client/server/)
```

## Getting Started

### Backend (Server)

```bash
cd server
npm install
```

1. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

2. Set up the database:
   - **SQLite (default, local development)**:
     ```bash
     npx prisma migrate dev --name init
     npm run seed
     ```
   - **PostgreSQL (production)**:
     ```bash
     npx prisma migrate deploy
     npm run seed
     ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend (Client)

```bash
cd client
npm install
npm run dev
```

## Database Commands

| Command | Description |
|---------|-------------|
| `npm run seed` | Seed the database with sample data |
| `npm run prisma:migrate:dev` | Create and apply a migration (SQLite) |
| `npm run prisma:migrate:deploy` | Apply migrations (production) |
| `npm run prisma:studio` | Open Prisma Studio database browser |
| `npm run prisma:generate` | Generate Prisma Client |

## Testing

```bash
cd server
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

## Linting and Formatting

### Server

```bash
cd server
npm run lint          # Check for lint errors
npm run lint:fix      # Auto-fix lint errors
npm run format        # Format code with Prettier
npm run format:check  # Check formatting without writing
npm run typecheck     # TypeScript type checking
```

### Client

```bash
cd client
npm run lint          # Run Next.js linter
npm run build         # Build for production
```

## CI/CD

GitHub Actions runs on every push and pull request to `main` and `develop` branches:

- **Lint**: ESLint checks on server code
- **Typecheck**: TypeScript compilation check
- **Test**: Jest test suite with SQLite test database
- **Build**: Next.js production build for client

## Environment Variables

### Server (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Database connection string |
| `PORT` | No | Server port (default: 3000) |

See `.env.example` for reference.
