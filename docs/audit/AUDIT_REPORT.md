# Codebase Audit Report

## Summary

Comprehensive audit of the ProjeX v2 codebase covering frontend (Next.js), backend (Express.js + Prisma), and database (Prisma schema). The application is a project management system with projects, tasks, teams, users, search, and priority views.

## Audit Findings Priority Matrix

| Priority | Count | Description |
|----------|-------|-------------|
| Critical | 6 | Security holes, data integrity issues |
| High | 11 | Missing features, performance, code quality |
| Medium | 8 | Inconsistent UX, missing states |
| Low | 5 | Minor polish, naming |

## Critical Issues

1. **[Security] No authentication on backend** (`server/src/index.ts:27-38`): Express routes accept unauthenticated requests. The frontend sends Cognito JWT bearer tokens but the backend never validates them. Anyone with API access can read/modify all data.

2. **[Security] No authorization/ACL** (all controllers): Any user can create projects, tasks, and users. No project membership checks. No role-based permissions.

3. **[Security] No input validation** (all controllers): Request bodies destructured and passed directly to Prisma without DTOs, type checking, or sanitization. `Number()` casts on query params produce `NaN` for invalid input.

4. **[Security] Permissive CORS** (`server/src/index.ts:25`): `app.use(cors())` allows all origins with no whitelist.

5. **[Data Bug] UserCard hardcoded profile picture** (`client/src/components/UserCard/index.tsx:14`): All users show `/p1.jpeg` instead of `user.profilePictureUrl`.

6. **[Schema] Team owner/manager fields not relations** (`schema.prisma:35-36`): `productOwnerUserId` and `projectManagerUserId` are plain `Int?` without `@relation`, so Prisma cannot enforce integrity or allow includes. Seed data references users before they exist.

## High Issues

7. **[Performance] N+1 queries in getTeams** (`server/src/controllers/teamController.ts:10-28`): Each team triggers 2 extra queries. Should use a single batch query or join.

8. **[Performance] No pagination** (all list endpoints): `findMany()` returns all records with no `take`/`skip`. Will degrade with dataset growth.

9. **[Performance] Missing database indexes** (`schema.prisma`): No indexes on `Task.projectId`, `Task.status`, `Task.priority`, `Task.authorUserId`, `Task.assignedUserId`, `ProjectTeam.projectId`, `ProjectTeam.teamId`.

10. **[Code Quality] Business logic in controllers** (all controllers): No service layer. Prisma calls and business logic mixed directly in Express route handlers.

11. **[Code Quality] Multiple PrismaClient instances** (each controller): `const prisma = new PrismaClient()` duplicated across 5 controllers instead of a singleton.

12. **[Code Quality] Inconsistent response formats**: `createProject` returns the raw object; `postUser` returns `{ message, newUser }`; `search` returns `{ tasks, projects, users }`. No standardized API envelope.

13. **[Code Quality] All errors return 500** (all controllers): 404s, validation errors, and duplicate key violations all return HTTP 500 with internal error messages exposed to clients.

14. **[UX] AuthProvider commented out** (`client/src/app/dashboardWrapper.tsx:42`): The `<AuthProvider>` wrapper is disabled, so the app renders without authentication.

15. **[UX] Hardcoded userId in priority pages** (`client/src/app/priority/reusablePriorityPage/index.tsx:82`): `const userId = 3` instead of using the authenticated user's ID.

16. **[UX] Hardcoded settings data** (`client/src/app/settings/page.tsx:5-10`): Settings page displays hardcoded user data instead of fetching from API.

17. **[UX] Hardcoded project name** (`client/src/app/projects/ProjectHeader.tsx:30`): Project name hardcoded as "Product Design Development" instead of from route params/API.

## Medium Issues

18. **[UX] No loading skeletons** (all pages): Inline `<div>Loading...</div>` only. No spinners, skeletons, or progress indicators.

19. **[UX] No error boundaries** (all pages): Errors result in raw text. No retry mechanisms. `getTasks` errors show "An error occurred while fetching tasks" with no recovery path.

20. **[UX] No empty states** (most pages): Only `reusablePriorityPage` has an empty state. Other views show nothing when data is absent.

21. **[UX] Form validation logic bug** (`client/src/components/ModalNewTask/index.tsx:49-51`): `isFormValid` returns true when project ID is missing (negation logic error). Form should require projectId.

22. **[UX] No dark mode toggle on priority pages**: Dark mode state exists but priority pages don't consistently apply dark mode classes to all elements.

23. **[UX] No confirmation for destructive actions**: No confirmation dialogs for task/project deletion (though delete endpoints don't exist yet).

24. **[Code Quality] Duplicated column definitions** (`reusablePriorityPage`, `TableView`): Nearly identical GridColDef arrays with minor differences. Should be shared.

## Low Issues

25. **[Code Quality] No shared design system**: UI components are not abstracted into reusable design tokens or component library. Tailwind classes are inline and duplicated.

26. **[Code Quality] No API response envelope** (all endpoints): Raw Prisma objects returned without pagination metadata, status codes, or request IDs.

27. **[Code Quality] Seed data has explicit IDs** (`server/prisma/seedData/*.json`): Couples seed to specific ID sequences; will cause conflicts if migration order changes.

28. **[DevEx] No linting or formatting** (server): No ESLint or Prettier configured in `server/`. Frontend has ESLint but no lint scripts in root package.json.

29. **[DevEx] No tests** (server + client): Zero test coverage. Server test script is a placeholder. Client has no testing library installed.

30. **[DevEx] No CI/CD pipeline**: No GitHub Actions, no automated testing, no build validation.

## Frontend Findings Summary

- **Routes**: 16 client-side routes (App Router). No server-side routes.
- **Duplicated components**: ModalNewTask duplicated in 3 views with slightly different props. GridColDef columns duplicated across 2 files. Button styles duplicated across 5 components.
- **Static/mock data**: 5 instances of hardcoded data (userId=3, settings, project name, projectId=1, profile picture).
- **Unused files**: `authProvider.tsx` and `@aws-amplify/ui-react` effectively dead code (AuthProvider commented out).
- **Auth flow**: Cognito via Amplify, but auth is disabled. No guard on protected routes.
- **Issues**: 6 UI/API issues found (detailed above).

## Backend Findings Summary

- **Routes**: 6 Express routers mounted at `/projects`, `/tasks`, `/search`, `/users`, `/teams`.
- **Endpoints**: 9 total endpoints (5 GET, 2 POST, 1 PATCH).
- **Business logic**: Embedded in controllers, no service layer.
- **Endpoint mapping**: All 9 RTK Query endpoints map to corresponding Express routes.
- **Inconsistent responses**: 3 different response shapes identified.
- **Security gaps**: No auth, no validation, no authorization, permissive CORS.

## Database Findings Summary

- **Models**: 7 models with 15 relations.
- **Missing indexes**: 8 columns need indexes for query performance.
- **Duplicate/unclear fields**: `profilePictureUrl` stores file names not URLs. Team owner/manager fields lack relations. `tags` is comma-separated string.
- **Risky migrations**: Provider switch to SQLite complete. Seed data ordering has circular dependency (teams reference users before they exist).
- **Seed data**: 8 JSON files with 157 total records.

## Recommendations by Priority

### Must Fix (Critical)
1. Add authentication middleware to validate Cognito JWT tokens on backend.
2. Add authorization/permission checking (project access, role checks).
3. Add input validation (DTOs with Zod or class-validator).
4. Restrict CORS to known origins.
5. Fix UserCard profile picture bug.
6. Add proper `@relation` directives to Team owner/manager fields.

### Should Fix (High)
7. Add pagination to all list endpoints.
8. Add database indexes on foreign keys and filtered columns.
9. Refactor controllers into service layer.
10. Use single PrismaClient singleton.
11. Standardize API response envelope.
12. Return appropriate HTTP status codes (404, 400, 409) instead of all-500.
13. Enable AuthProvider in dashboardWrapper.
14. Use authenticated user ID instead of hardcoded userId=3.
15. Fetch settings data from API.
16. Use route params for project name.

### Nice to Have (Medium/Low)
17. Add loading skeletons and error boundaries.
18. Add empty states to all pages.
19. Fix form validation logic.
20. Create shared component library and design tokens.
21. Add soft delete functionality.
22. Add comprehensive test coverage.
23. Add CI/CD pipeline with linting and typechecking.
24. Fix seed data ordering and remove explicit IDs.
