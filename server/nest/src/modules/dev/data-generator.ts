import { PrismaClient } from "@prisma/client";

type Scale = "small" | "medium" | "large";

const SCALE_PRESETS: Record<Scale, { users: number; projects: number; tasks: number; sprints: number; milestones: number; notifications: number }> = {
  small: { users: 5, projects: 3, tasks: 10, sprints: 5, milestones: 3, notifications: 10 },
  medium: { users: 10, projects: 6, tasks: 30, sprints: 15, milestones: 10, notifications: 50 },
  large: { users: 20, projects: 10, tasks: 40, sprints: 30, milestones: 25, notifications: 200 },
};

function seededRandom(seed: number) {
  let state = seed;
  return function () {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function randomFrom<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function randomInt(min: number, max: number, rng: () => number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function randomDate(rng: () => number): Date {
  const year = randomInt(2023, 2025, rng);
  const month = Math.floor(rng() * 12);
  const day = 1 + Math.floor(rng() * 27);
  return new Date(year, month, day);
}

const FIRST_NAMES = ["Alice", "Bob", "Carol", "Dave", "Eve", "Frank", "Grace", "Henry", "Ivy", "Jack", "Karen", "Leo", "Mia", "Noah", "Olivia", "Paul", "Quinn", "Ruby", "Sam", "Tina"];
const LAST_NAMES = ["Smith", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", "Martinez", "Robinson", "Clark", "Lewis"];
const TEAM_NAMES = ["Alpha Team", "Bravo Team", "Charlie Team", "Delta Team", "Echo Team", "Foxtrot Team", "Golf Team", "Hotel Team", "India Team", "Juliet Team"];
const PROJECT_PREFIXES = ["Apollo", "Beacon", "Catalyst", "Delta", "Echo", "Foxtrot", "Golf", "Hotel", "India", "Juliet", "Kilo", "Lima", "Mirage", "Nexus", "Orion"];
const PROJECT_STATUSES = ["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"];
const PROJECT_PRIORITIES = ["Urgent", "High", "Medium", "Low", "Backlog"];
const PROJECT_HEALTHS = ["ON_TRACK", "AT_RISK", "OFF_TRACK", "BLOCKED"];
const TASK_STATUSES = ["To Do", "Work In Progress", "Under Review", "Completed"];
const TASK_PRIORITIES = ["Urgent", "High", "Medium", "Low", "Backlog"];
const SPRINT_STATUSES = ["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"];
const MILESTONE_STATUSES = ["PLANNED", "IN_PROGRESS", "COMPLETED", "DELAYED"];
const NOTIFICATION_TYPES = ["ASSIGNMENT", "MENTION", "STATUS_CHANGE", "COMMENT", "DUE_DATE_REMINDER", "OVERDUE_ALERT", "WORKFLOW_EVENT", "SYSTEM"] as const;
const NOTIFICATION_SEVERITIES = ["INFO", "WARNING", "ERROR"] as const;
const TASK_TAGS = ["Design", "Coding", "Testing", "Review", "Documentation", "Bug", "Feature", "Refactor"];
const ORG_NAMES = ["TechVision", "NexusCorp", "StellarWorks", "QuantumLabs", "ApexDynamics"];

const NOTIFICATION_TEMPLATES: Record<string, { titles: string[]; messages: string[] }> = {
  ASSIGNMENT: { titles: ["New task assigned", "Task reassigned to you"], messages: ["You have been assigned a new task.", "A task has been assigned to you for review."] },
  MENTION: { titles: ["You were mentioned", "New mention in comment"], messages: ["You were mentioned in a comment.", "Someone mentioned you in the discussion."] },
  STATUS_CHANGE: { titles: ["Status updated", "Task status changed", "Progress update"], messages: ["The status of your task has been updated.", "A task you own has had a status change."] },
  COMMENT: { titles: ["New comment", "Comment added to your task"], messages: ["A new comment was added to your task.", "Someone replied to your task."] },
  DUE_DATE_REMINDER: { titles: ["Due soon", "Upcoming deadline", "Reminder: task due soon"], messages: ["Your task is due soon.", "Reminder: approaching deadline for a task."] },
  OVERDUE_ALERT: { titles: ["Task overdue", "Overdue alert", "Past due date"], messages: ["Your task is now overdue.", "Action required: a task has passed its due date."] },
  WORKFLOW_EVENT: { titles: ["Workflow event", "Workflow transition", "Process change"], messages: ["A workflow event occurred on a task you own.", "Workflow state has changed."] },
  SYSTEM: { titles: ["System notice", "System notification", "Platform update"], messages: ["System maintenance notice.", "Important platform update available."] },
};

export interface GenerationResult {
  organizations: number;
  users: number;
  teams: number;
  projects: number;
  tasks: number;
  sprints: number;
  milestones: number;
  comments: number;
  notifications: number;
}

export class DataGenerator {
  private readonly rng: () => number;
  private readonly scale: { users: number; projects: number; tasks: number; sprints: number; milestones: number; notifications: number };
  private readonly baseTime: Date;

  constructor(seed: number = 42, scaleName: Scale = "large") {
    this.rng = seededRandom(seed);
    this.scale = SCALE_PRESETS[scaleName];
    this.baseTime = new Date("2026-01-01T00:00:00Z");
  }

  timeOffset(hours: number): Date {
    const d = new Date(this.baseTime);
    d.setHours(d.getHours() + hours);
    return d;
  }

  async generate(prisma: PrismaClient): Promise<GenerationResult> {
    const result = await prisma.$transaction(async (tx) => {
      const orgs: { id: number }[] = [];
      const orgCount = 3;
      for (let i = 0; i < orgCount; i++) {
        const org = await tx.organization.create({
          data: {
            name: ORG_NAMES[i % ORG_NAMES.length],
            slug: ORG_NAMES[i % ORG_NAMES.length].toLowerCase().replace(/\s/g, "-") + `-${i + 1}`,
            createdById: 1,
            settings: {
              create: {
                key: "auditRetentionDays",
                value: String(30 + i * 30),
              },
            },
          },
        });
        orgs.push({ id: org.id });
      }

      const teams: { id: number; teamName: string }[] = [];
      const teamCount = 5;
      for (let i = 0; i < teamCount; i++) {
        const team = await tx.team.create({
          data: {
            teamName: `${TEAM_NAMES[i % TEAM_NAMES.length]}`,
            productOwnerUserId: i + 1,
            projectManagerUserId: i + 1,
          },
        });
          teams.push({ id: team.id, teamName: team.teamName });
      }

      const users: { userId: number; username: string }[] = [];
      const userCount = this.scale.users;
      for (let i = 0; i < userCount; i++) {
        const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
        const lastName = LAST_NAMES[i % LAST_NAMES.length];
        const username = `${firstName}${lastName}`;
        const user = await tx.user.create({
          data: {
            username,
            cognitoId: `dev-user-${i + 1}`,
            teamId: teams[i % teamCount].id,
            capacityHoursPerWeek: 30 + (i % 5) * 5,
          },
        });
        users.push({ userId: user.userId, username });
      }

      // Assign org memberships
      for (let i = 0; i < users.length; i++) {
        const org = orgs[i % orgCount];
        const role = i < Math.ceil(users.length * 0.1) ? "OWNER" : i < Math.ceil(users.length * 0.2) ? "ADMIN" : i < Math.ceil(users.length * 0.4) ? "MANAGER" : "MEMBER";
        await tx.organizationMembership.create({
          data: {
            organizationId: org.id,
            userId: users[i].userId,
            role,
          },
        });
      }

      // Create notification preferences for all users
      for (const user of users) {
        await tx.notificationPreference.create({
          data: {
            userId: user.userId,
            notificationType: "ALL",
            emailEnabled: this.rng() > 0.2,
            inAppEnabled: this.rng() > 0.1,
          },
        });
      }

      const projects: { id: number; name: string }[] = [];
      const projectCount = this.scale.projects;
      for (let i = 0; i < projectCount; i++) {
        const prefix = PROJECT_PREFIXES[i % PROJECT_PREFIXES.length];
        const key = `${prefix}-${100 + i}`;
        const name = `${prefix} Project`;
        const startDate = randomDate(this.rng);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 2 + (i % 4));
        const status = randomFrom(PROJECT_STATUSES, this.rng);
        const priority = randomFrom(PROJECT_PRIORITIES, this.rng);
        const health = randomFrom(PROJECT_HEALTHS, this.rng);

        const orgId = orgs[i % orgCount].id;

        const project = await tx.project.create({
          data: {
            key,
            name,
            description: `A project for ${name}.`,
            startDate,
            endDate,
            dueDate: endDate,
            status,
            priority,
            health,
            archived: status === "ARCHIVED",
            organizationId: orgId,
          },
        });

        // Create project ownership for user 0
        await tx.projectMembership.create({
          data: {
            userId: users[0].userId,
            projectId: project.id,
            role: "OWNER",
            status: "ACTIVE",
          },
        });

        // Add 1-3 additional members
        const additionalMembers = 1 + Math.floor(this.rng() * 3);
        const usedMembers = new Set([0]);
        for (let m = 0; m < additionalMembers && m < users.length; m++) {
          const candidateIdx = Math.floor(this.rng() * users.length);
          if (!usedMembers.has(candidateIdx)) {
            usedMembers.add(candidateIdx);
            await tx.projectMembership.create({
              data: {
                userId: users[candidateIdx].userId,
                projectId: project.id,
                role: randomFrom(["MEMBER", "MEMBER", "ADMIN"], this.rng),
                status: "ACTIVE",
              },
            });
          }
        }

        projects.push({ id: project.id, name });
      }

      let taskCount = 0;
      const taskIds: number[] = [];
      for (const project of projects) {
        const numTasks = Math.floor(this.scale.tasks / projectCount);
        for (let t = 0; t < numTasks; t++) {
          const title = `Task ${t + 1} for ${project.name}`;
          const status = randomFrom(TASK_STATUSES, this.rng);
          const priority = randomFrom(TASK_PRIORITIES, this.rng);
          const assigneeIdx = Math.floor(this.rng() * users.length);
          const authorIdx = Math.floor(this.rng() * users.length);
          const startDate = randomDate(this.rng);
          const dueDate = new Date(startDate);
          dueDate.setDate(dueDate.getDate() + randomInt(3, 14, this.rng));

          const task = await tx.task.create({
            data: {
              title,
              description: `Implementation details for ${title}.`,
              status,
              priority,
              tags: randomFrom(TASK_TAGS, this.rng),
              startDate,
              dueDate,
              points: randomInt(1, 13, this.rng),
              projectId: project.id,
              authorUserId: users[authorIdx].userId,
              assignedUserId: users[assigneeIdx].userId,
            },
          });
          taskIds.push(task.id);
          taskCount++;
        }
      }

      // Create sprints per project
      let sprintCount = 0;
      let sprintsRemaining = this.scale.sprints;
      for (let pi = 0; pi < projects.length && sprintCount < this.scale.sprints; pi++) {
        const project = projects[pi];
        const projectsLeft = projects.length - pi;
        const maxForRemaining = sprintsRemaining;
        const minForThis = Math.max(1, Math.floor(maxForRemaining / projectsLeft));
        const maxForThis = Math.min(4, maxForRemaining - (projectsLeft - 1));
        const numSprints = Math.min(maxForThis, Math.max(minForThis, randomInt(1, 4, this.rng)));
        for (let s = 0; s < numSprints; s++) {
          const startDate = randomDate(this.rng);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 14);
          const ownerIdx = Math.floor(this.rng() * users.length);
          const name = `Sprint ${sprintCount + 1} - ${project.name}`;
          await tx.sprint.create({
            data: {
              name,
              projectId: project.id,
              goal: `Complete ${name} deliverables`,
              startDate,
              endDate,
              status: randomFrom(SPRINT_STATUSES, this.rng),
              capacity: 30 + sprintCount * 5,
              ownerId: users[ownerIdx].userId,
            },
          });
          sprintCount++;
        }
        sprintsRemaining = this.scale.sprints - sprintCount;
      }

      let milestoneCount = 0;
      let milestonesRemaining = this.scale.milestones;
      for (let pi = 0; pi < projects.length && milestoneCount < this.scale.milestones; pi++) {
        const project = projects[pi];
        const projectsLeft = projects.length - pi;
        const maxForRemaining = milestonesRemaining;
        const minForThis = Math.max(1, Math.floor(maxForRemaining / projectsLeft));
        const maxForThis = Math.min(3, maxForRemaining - (projectsLeft - 1));
        const numMilestones = Math.min(maxForThis, Math.max(minForThis, randomInt(1, 3, this.rng)));
        for (let m = 0; m < numMilestones; m++) {
          const dueDate = randomDate(this.rng);
          const startDate = new Date(dueDate);
          startDate.setDate(startDate.getDate() - 30);
          const ownerIdx = Math.floor(this.rng() * users.length);
          const name = `Milestone ${milestoneCount + 1} - ${project.name}`;
          await tx.milestone.create({
            data: {
              name,
              description: `Key milestone for ${project.name}`,
              projectId: project.id,
              startDate,
              dueDate,
              status: randomFrom(MILESTONE_STATUSES, this.rng),
              ownerId: users[ownerIdx].userId,
            },
          });
          milestoneCount++;
        }
        milestonesRemaining = this.scale.milestones - milestoneCount;
      }

      // Create comments
      let commentCount = 0;
      for (const taskId of taskIds) {
        if (this.rng() < 0.7) {
          const commenterIdx = Math.floor(this.rng() * users.length);
          await tx.comment.create({
            data: {
              text: `Comment on task ${taskId}.`,
              taskId,
              userId: users[commenterIdx].userId,
            },
          });
          commentCount++;
        }
      }

      // Create notifications
      let notificationCount = 0;
      for (let n = 0; n < this.scale.notifications; n++) {
        const userIdx = Math.floor(this.rng() * users.length);
        const type = randomFrom([...NOTIFICATION_TYPES], this.rng) as string;
        const tmpl = NOTIFICATION_TEMPLATES[type];
        const title = randomFrom([...tmpl.titles], this.rng);
        const message = randomFrom([...tmpl.messages], this.rng);
        const isRead = this.rng() < 0.6;
        const ts = this.timeOffset(-(n % 60));

        await tx.notification.create({
          data: {
            userId: users[userIdx].userId,
            type,
            title,
            message,
            read: isRead,
            link: `/tasks/${taskIds[n % taskIds.length] || 1}`,
            severity: randomFrom([...NOTIFICATION_SEVERITIES], this.rng) as string,
            status: randomFrom(["DELIVERED", "DELIVERED", "PENDING"], this.rng),
            readAt: isRead ? ts : null,
            archived: this.rng() < 0.05,
            createdAt: ts,
            updatedAt: ts,
          },
        });
        notificationCount++;
      }

      console.log(
        `[DataGenerator] Generated: ${userCount} users, ${projects.length} projects, ${taskCount} tasks, ${sprintCount} sprints, ${milestoneCount} milestones, ${commentCount} comments, ${notificationCount} notifications across ${orgCount} organizations`,
      );

      return {
        organizations: orgCount,
        users: userCount,
        teams: teamCount,
        projects: projects.length,
        tasks: taskCount,
        sprints: sprintCount,
        milestones: milestoneCount,
        comments: commentCount,
        notifications: notificationCount,
      };
    });

    return result;
  }
}
