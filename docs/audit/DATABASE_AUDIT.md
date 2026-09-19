# Database Review

## Overview

The application uses a Prisma ORM schema with 7 models. SQLite is now the default for local development; PostgreSQL is recommended for production.

## 1. Model Definitions and Relationships

```
User
  - userId (Int, PK, autoincrement)
  - cognitoId (String, unique)
  - username (String, unique)
  - profilePictureUrl (String?, nullable)
  - teamId (Int?, nullable, FK to Team.id)

Team
  - id (Int, PK, autoincrement)
  - teamName (String)
  - productOwnerUserId (Int?, nullable)
  - projectManagerUserId (Int?, nullable)

Project
  - id (Int, PK, autoincrement)
  - name (String)
  - description (String?, nullable)
  - startDate (DateTime?, nullable)
  - endDate (DateTime?, nullable)

ProjectTeam (join table)
  - id (Int, PK, autoincrement)
  - teamId (Int, FK to Team.id)
  - projectId (Int, FK to Project.id)

Task
  - id (Int, PK, autoincrement)
  - title (String)
  - description (String?, nullable)
  - status, priority, tags (String?, nullable)
  - startDate, dueDate (DateTime?, nullable)
  - points (Int?, nullable)
  - projectId, authorUserId (Int, FKs)
  - assignedUserId (Int?, nullable, FK)

TaskAssignment (join table)
  - id (Int, PK, autoincrement)
  - userId (Int, FK to User.userId)
  - taskId (Int, FK to Task.id)

Attachment
  - id (Int, PK, autoincrement)
  - fileURL, fileName (String, fileName nullable)
  - taskId, uploadedById (Int, FKs)

Comment
  - id (Int, PK, autoincrement)
  - text (String)
  - taskId, userId (Int, FKs)
```

### Relationships Summary

| Relationship | Type |
|-------------|------|
| User.teamId -> Team.id | Many-to-One (optional) |
| Team.user (implicit) | One-to-Many (via User.teamId) |
| Project.tasks | One-to-Many |
| Project.projectTeams | One-to-Many |
| ProjectTeam.team -> Team | Many-to-One |
| ProjectTeam.project -> Project | Many-to-Many join |
| Task.project -> Project | Many-to-One |
| Task.author -> User (TaskAuthor) | Many-to-One |
| Task.assignee -> User (TaskAssignee) | Many-to-One (optional) |
| Task.taskAssignments | One-to-Many |
| Task.attachments | One-to-Many |
| Task.comments | One-to-Many |
| TaskAssignment.user -> User | Many-to-One |
| TaskAssignment.task -> Task | Many-to-Many join |
| Attachment.task -> Task | Many-to-One |
| Attachment.uploadedBy -> User | Many-to-One |
| Comment.task -> Task | Many-to-One |
| Comment.user -> User | Many-to-One |

## 2. Missing Indexes

Only two indexes exist (both auto-generated from unique constraints):
- `User_cognitoId_key` on `User(cognitoId)`
- `User_username_key` on `User(username)`

Missing indexes on frequently queried/filtered columns:
- `Task.projectId` - queried in `getTasks(projectId)` for every board view
- `Task.authorUserId` - queried in `getUserTasks` OR query
- `Task.assignedUserId` - queried in `getUserTasks` OR query
- `Task.status` - used in BoardView column filtering
- `Task.priority` - used in priority page filtering
- `ProjectTeam.projectId` - needed when listing teams per project
- `ProjectTeam.teamId` - needed when listing projects per team

Without these indexes, dashboard and task views will experience slow queries as data grows.

## 3. Missing Constraints

- **No foreign key cascade deletes**: Currently using `ON DELETE SET NULL` for optional relations and `ON DELETE RESTRICT` for required ones. There is no soft-delete mechanism; deleted records are hard-deleted with no audit trail.
- **No NOT NULL constraints beyond what Prisma infers**: `profilePictureUrl` is nullable; consider making it have a default.
- **No check constraints**: `Task.status` and `Task.priority` are free-text strings. Should be enums to prevent invalid values.
- **No composite unique constraints**: `ProjectTeam` allows duplicate (teamId, projectId) pairs. `TaskAssignment` allows duplicate (userId, taskId) pairs.

## 4. Duplicate or Unclear Fields

- **`profilePictureUrl` on User**: Stores relative file names (e.g., "p1.jpeg", "i1.jpg") pointing to static assets in `client/public/`, not actual file URLs. This conflates database storage with static asset serving and will break when moving to cloud storage.
- **`Team.productOwnerUserId` / `Team.projectManagerUserId`**: These are `Int?` (not actual foreign key relations in the Prisma schema). They store user IDs but have no `@relation` directive, meaning Prisma does not enforce referential integrity or allow nested includes.
- **`Task.tags`**: Single string field storing comma-separated tags instead of a normalized Tag model or JSON array.
- **Auto-increment integer IDs**: All models use `Int @id @default(autoincrement())`. For a multi-tenant SaaS application, this exposes ordinal IDs and is not portable across distributed databases.

## 5. Risky Migration Areas

- **Database provider change**: Migration from PostgreSQL to SQLite is complete. Switching back to PostgreSQL (or to MySQL) would require a new migration history. The `migration_lock.toml` now specifies `provider = "sqlite"`.
- **Seed data includes explicit IDs**: The seed JSON files explicitly set `id`, `userId`, `teamId`, etc. This couples seed data to specific ID sequences and will break if IDs change. SQLite `autoincrement` with explicit IDs may cause gaps or conflicts.
- **Seed ordering**: The seed script deletes data in a specific order (teams, projects, projectTeams, users, tasks, attachments, comments, taskAssignments) to respect foreign key constraints, but the insertion order (teams, projects, projectTeams, users, tasks, attachments, comments, taskAssignments) has a circular dependency issue: teams reference user IDs for productOwnerUserId/projectManagerUserId, but users are seeded after teams. This works only because the FK is not enforced at the Prisma level (no `@relation`), but would fail in a strict FK database.
- **Team seed data references user IDs before users exist**: `team.json` sets `productOwnerUserId: 1` and `projectManagerUserId: 2` before `user.json` is seeded. This works because there's no DB-level FK constraint on these fields.

## 6. Seed Data Quality

| File | Records | Notes |
|------|---------|-------|
| team.json | 5 | References user IDs 1-10 that don't exist yet at seed time |
| project.json | 10 | Explicit IDs 1-10 |
| projectTeam.json | 20 | Links 5 teams to 4 projects |
| user.json | 20 | Fixed cognitoId UUIDs, reuses profile picture files |
| task.json | 40 | Explicit IDs, references project/user IDs |
| attachment.json | 10 | References task IDs 1-10 |
| comment.json | 25 | References task/user IDs |
| taskAssignment.json | 30 | Links users to tasks 1-30 |

## 7. Recommendations

1. **Add indexes** on all foreign key columns and frequently filtered columns (status, priority, projectId, authorUserId, assignedUserId).
2. **Convert status and priority** to enum types for type safety and consistency.
3. **Add composite unique constraints** on join tables (ProjectTeam, TaskAssignment) to prevent duplicates.
4. **Implement soft deletes** with `deletedAt` timestamp columns.
5. **Consider using UUIDs** instead of autoincrement integers for future scalability.
6. **Decouple profilePictureUrl** from static asset paths; store actual file URLs or use a proper file storage model.
7. **Add proper `@relation` directives** to Team.productOwnerUserId and Team.projectManagerUserId.
8. **Fix seed ordering** to respect foreign key constraints properly.
