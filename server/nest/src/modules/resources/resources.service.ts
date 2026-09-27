import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ResourcesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getOverview(userId: number) {
    // Get user's accessible projects
    const memberships = await this.prisma.projectMembership.findMany({
      where: { userId, status: "ACTIVE" },
      select: { projectId: true },
    });
    const projectIds = memberships.map((m) => m.projectId);

    if (projectIds.length === 0) {
      return {
        totalEmployees: 0,
        allocatedEmployees: 0,
        availableEmployees: 0,
        benchEmployees: 0,
        vacantProjectSeats: 0,
        overallUtilization: 0,
        skillDistribution: [],
      };
    }

    // Get all employees in user's projects
    const projectMembers = await this.prisma.projectMembership.findMany({
      where: { projectId: { in: projectIds }, status: "ACTIVE" },
      include: { user: true },
    });

    const uniqueEmployees = new Map();
    projectMembers.forEach((pm) => {
      if (!uniqueEmployees.has(pm.userId)) {
        uniqueEmployees.set(pm.userId, pm.user);
      }
    });

    const employees = Array.from(uniqueEmployees.values());
    const totalEmployees = employees.length;
    const allocatedEmployees = employees.filter((e) => e.currentProjectId !== null).length;
    const availableEmployees = employees.filter((e) => e.availability === "FULL_TIME").length;
    const benchEmployees = employees.filter((e) => e.availability === "BENCH" || e.currentProjectId === null).length;

    // Calculate vacant seats
    const projects = await this.prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, key: true, name: true },
    });

    let vacantSeats = 0;
    for (const project of projects) {
      const memberCount = projectMembers.filter((pm) => pm.projectId === project.id).length;
      // Default capacity of 10 if not set
      const capacity = 10;
      vacantSeats += Math.max(0, capacity - memberCount);
    }

    // Overall utilization
    const totalCapacity = projects.length * 10;
    const overallUtilization = totalCapacity > 0 ? Math.round((allocatedEmployees / totalCapacity) * 100) : 0;

    // Skill distribution
    const skillDistribution = await this.getSkillDistribution(userId, projectIds);

    return {
      totalEmployees,
      allocatedEmployees,
      availableEmployees,
      benchEmployees,
      vacantProjectSeats: vacantSeats,
      overallUtilization,
      skillDistribution,
    };
  }

  async getEmployees(userId: number) {
    const memberships = await this.prisma.projectMembership.findMany({
      where: { userId, status: "ACTIVE" },
      select: { projectId: true },
    });
    const projectIds = memberships.map((m) => m.projectId);

    if (projectIds.length === 0) {
      return [];
    }

    const projectMembers = await this.prisma.projectMembership.findMany({
      where: { projectId: { in: projectIds }, status: "ACTIVE" },
      include: { 
        user: {
          include: {
            employeeSkills: { include: { skill: true } },
            projectMemberships: { where: { status: "ACTIVE" }, include: { project: true } },
          },
        },
      },
    });

    const uniqueEmployees = new Map();
    projectMembers.forEach((pm) => {
      if (!uniqueEmployees.has(pm.user.userId)) {
        uniqueEmployees.set(pm.user.userId, {
          ...pm.user,
          currentProjectMemberships: pm.user.projectMemberships,
        });
      }
    });

    return Array.from(uniqueEmployees.values()).map((emp) => ({
      userId: emp.userId,
      username: emp.username,
      email: emp.cognitoId,
      experienceLevel: emp.experienceLevel,
      availability: emp.availability,
      benchDate: emp.benchDate,
      currentProjectId: emp.currentProjectId,
      skills: emp.employeeSkills?.map((es: { skillId: number; skill: { name: string; category: string }; level: string; yearsExp: number | null }) => ({
        skillId: es.skillId,
        skillName: es.skill.name,
        skillCategory: es.skill.category,
        level: es.level,
        yearsExp: es.yearsExp,
      })) || [],
      projects: emp.currentProjectMemberships?.map((pm: { projectId: number; project: { name: string; key: string }; role: string }) => ({
        projectId: pm.projectId,
        projectName: pm.project.name,
        projectKey: pm.project.key,
        role: pm.role,
      })) || [],
    }));
  }

  async getResourcesByProject(userId: number) {
    const memberships = await this.prisma.projectMembership.findMany({
      where: { userId, status: "ACTIVE" },
      select: { projectId: true },
    });
    const projectIds = memberships.map((m) => m.projectId);

    if (projectIds.length === 0) {
      return [];
    }

    const projects = await this.prisma.project.findMany({
      where: { id: { in: projectIds } },
      include: {
        members: {
          where: { status: "ACTIVE" },
          include: {
            user: {
              include: {
                employeeSkills: { include: { skill: true } },
              },
            },
          },
        },
      },
    });

    return projects.map((project) => {
      const capacity = 10; // Default capacity
      const allocated = project.members.length;
      const utilization = capacity > 0 ? Math.round((allocated / capacity) * 100) : 0;
      
      // Get required skills for project (from tasks)
      // Note: This is a synchronous filter since tasks are not fetched here
      // For now, return empty requiredSkills - could be enhanced to fetch separately
      const requiredSkills: string[] = [];

      return {
        projectId: project.id,
        projectName: project.name,
        projectKey: project.key,
        status: project.status,
        capacity,
        allocatedResources: allocated,
        vacantSeats: Math.max(0, capacity - allocated),
        utilizationPercentage: utilization,
        requiredSkills,
        employees: project.members.map((m) => ({
          userId: m.user.userId,
          username: m.user.username,
          role: m.role,
          skills: m.user.employeeSkills?.map((es: { skillId: number; skill: { name: string }; level: string }) => ({
            skillId: es.skillId,
            skillName: es.skill.name,
            level: es.level,
          })) || [],
          availability: m.user.availability,
        })),
      };
    });
  }

  async getResourcesBySkill(userId: number) {
    const memberships = await this.prisma.projectMembership.findMany({
      where: { userId, status: "ACTIVE" },
      select: { projectId: true },
    });
    const projectIds = memberships.map((m) => m.projectId);

    if (projectIds.length === 0) {
      return [];
    }

    // Get all employees in user's projects with their skills
    const projectMembers = await this.prisma.projectMembership.findMany({
      where: { projectId: { in: projectIds }, status: "ACTIVE" },
      include: { user: { include: { employeeSkills: { include: { skill: true } } } } },
    });

    const skillMap = new Map<string, { total: number; allocated: number; available: number; bench: number }>();
    const skillCategories = [
      "Backend", "Frontend", "QA", "DevOps", "Data/ML", "Design", "Marketing", "Product"
    ];

    // Initialize skill categories
    skillCategories.forEach((cat) => {
      skillMap.set(cat, { total: 0, allocated: 0, available: 0, bench: 0 });
    });

    const uniqueEmployees = new Map();
    projectMembers.forEach((pm) => {
      if (!uniqueEmployees.has(pm.userId)) {
        uniqueEmployees.set(pm.userId, pm.user);
      }
    });

    uniqueEmployees.forEach((emp) => {
      const empSkills = emp.employeeSkills || [];
      if (empSkills.length === 0) {
        // Unskilled employees
        if (!skillMap.has("Unassigned")) {
          skillMap.set("Unassigned", { total: 0, allocated: 0, available: 0, bench: 0 });
        }
        const cat = skillMap.get("Unassigned")!;
        cat.total++;
        if (emp.currentProjectId) cat.allocated++;
        if (emp.availability === "FULL_TIME") cat.available++;
        if (emp.availability === "BENCH" || emp.currentProjectId === null) cat.bench++;
      } else {
        empSkills.forEach((es: { skill: { category: string | null } }) => {
          const category = es.skill.category || "Unassigned";
          if (!skillMap.has(category)) {
            skillMap.set(category, { total: 0, allocated: 0, available: 0, bench: 0 });
          }
          const cat = skillMap.get(category)!;
          cat.total++;
          if (emp.currentProjectId) cat.allocated++;
          if (emp.availability === "FULL_TIME") cat.available++;
          if (emp.availability === "BENCH" || emp.currentProjectId === null) cat.bench++;
        });
      }
    });

    return Array.from(skillMap.entries()).map(([skill, counts]) => ({
      skill,
      ...counts,
    }));
  }

  async getBenchCandidates(userId: number) {
    const memberships = await this.prisma.projectMembership.findMany({
      where: { userId, status: "ACTIVE" },
      select: { projectId: true },
    });
    const projectIds = memberships.map((m) => m.projectId);

    if (projectIds.length === 0) {
      return [];
    }

    // Get all employees in user's projects
    const projectMembers = await this.prisma.projectMembership.findMany({
      where: { projectId: { in: projectIds }, status: "ACTIVE" },
      include: { user: { include: { employeeSkills: { include: { skill: true } }, projectMemberships: { include: { project: true } } } } },
    });

    const uniqueEmployees = new Map();
    projectMembers.forEach((pm) => {
      if (!uniqueEmployees.has(pm.userId)) {
        uniqueEmployees.set(pm.userId, pm.user);
      }
    });

    return Array.from(uniqueEmployees.values())
      .filter((emp) => emp.availability === "BENCH" || emp.currentProjectId === null)
      .map((emp) => ({
        userId: emp.userId,
        username: emp.username,
        email: emp.cognitoId,
        role: emp.projectMemberships?.[0]?.role || "MEMBER",
        skills: emp.employeeSkills?.map((es: { skillId: number; skill: { name: string; category: string }; level: string; yearsExp: number | null }) => ({
          skillId: es.skillId,
          skillName: es.skill.name,
          skillCategory: es.skill.category,
          level: es.level,
          yearsExp: es.yearsExp,
        })) || [],
        experienceLevel: emp.experienceLevel,
        availability: emp.availability,
        benchDate: emp.benchDate,
        previousProject: emp.projectMemberships?.[0]?.project?.name,
        potentialMatches: this.getPotentialMatches(emp, projectIds),
      }));
  }

  private async getSkillDistribution(userId: number, projectIds: number[]) {
    const projectMembers = await this.prisma.projectMembership.findMany({
      where: { projectId: { in: projectIds }, status: "ACTIVE" },
      include: { user: { include: { employeeSkills: { include: { skill: true } } } } },
    });

    const skillCounts = new Map<string, number>();
    const uniqueEmployees = new Map();
    projectMembers.forEach((pm) => {
      if (!uniqueEmployees.has(pm.userId)) {
        uniqueEmployees.set(pm.userId, pm.user);
      }
    });

    uniqueEmployees.forEach((emp) => {
      emp.employeeSkills?.forEach((es: { skill: { name: string } }) => {
        const name = es.skill.name;
        skillCounts.set(name, (skillCounts.get(name) || 0) + 1);
      });
    });

    return Array.from(skillCounts.entries())
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count);
  }

  private getPotentialMatches(employee: { employeeSkills?: Array<{ skill: { name: string } }> }, projectIds: number[]) {
    const empSkills = employee.employeeSkills?.map((es: { skill: { name: string } }) => es.skill.name.toLowerCase()) || [];
    
    // Simple matching based on project tasks
    return projectIds.slice(0, 3).map((pid) => ({
      projectId: pid,
      matchReason: empSkills.length > 0 ? `Has ${empSkills[0]} skills` : "Available for assignment",
    }));
  }
}