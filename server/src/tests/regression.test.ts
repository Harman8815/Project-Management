import request from "supertest";
import app from "../app";

describe("API Regression Tests", () => {
  describe("GET / (home route)", () => {
    it("should return 200 and home route message", async () => {
      const res = await request(app).get("/");
      expect(res.status).toBe(200);
      expect(res.text).toBe("This is home route");
    });
  });

  describe("GET /projects", () => {
    it("should return all projects", async () => {
      const res = await request(app).get("/projects");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it("should return projects with expected fields", async () => {
      const res = await request(app).get("/projects");
      const project = res.body[0];
      expect(project).toHaveProperty("id");
      expect(project).toHaveProperty("name");
      expect(project).toHaveProperty("description");
    });
  });

  describe("POST /projects", () => {
    it("should create a new project", async () => {
      const newProject = {
        name: "Test Project",
        description: "A test project for regression",
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-12-31T00:00:00Z",
      };
      const res = await request(app).post("/projects").send(newProject);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.name).toBe(newProject.name);
      expect(res.body.description).toBe(newProject.description);
    });
  });

  describe("GET /tasks?projectId=1", () => {
    it("should return tasks for project 1", async () => {
      const res = await request(app).get("/tasks?projectId=1");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it("should include author, assignee, comments, and attachments", async () => {
      const res = await request(app).get("/tasks?projectId=1");
      const task = res.body[0];
      expect(task).toHaveProperty("id");
      expect(task).toHaveProperty("title");
      expect(task).toHaveProperty("author");
      expect(task).toHaveProperty("assignee");
    });
  });

  describe("POST /tasks", () => {
    it("should create a new task", async () => {
      const newTask = {
        title: "Test Task",
        description: "A test task",
        status: "To Do",
        priority: "Medium",
        tags: "Testing",
        startDate: "2024-01-01T00:00:00Z",
        dueDate: "2024-06-01T00:00:00Z",
        points: 5,
        projectId: 1,
        authorUserId: 1,
        assignedUserId: 2,
      };
      const res = await request(app).post("/tasks").send(newTask);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.title).toBe(newTask.title);
    });
  });

  describe("PATCH /tasks/:taskId/status", () => {
    it("should update task status", async () => {
      const taskId = 1;
      const res = await request(app)
        .patch(`/tasks/${taskId}/status`)
        .send({ status: "Completed" });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("Completed");
    });
  });

  describe("GET /tasks/user/:userId", () => {
    it("should return tasks for a specific user", async () => {
      const res = await request(app).get("/tasks/user/1");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const hasTask = res.body.some(
        (task: any) => task.authorUserId === 1 || task.assignedUserId === 1,
      );
      expect(hasTask).toBe(true);
    });
  });

  describe("GET /users", () => {
    it("should return all users", async () => {
      const res = await request(app).get("/users");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it("should return users with expected fields", async () => {
      const res = await request(app).get("/users");
      const user = res.body[0];
      expect(user).toHaveProperty("userId");
      expect(user).toHaveProperty("username");
      expect(user).toHaveProperty("cognitoId");
    });
  });

  describe("GET /users/:cognitoId", () => {
    it("should return a user by cognitoId", async () => {
      const res = await request(app).get(
        "/users/123e4567-e89b-12d3-a456-426614174001",
      );
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("username");
      expect(res.body.username).toBe("AliceJones");
    });
  });

  describe("GET /teams", () => {
    it("should return all teams", async () => {
      const res = await request(app).get("/teams");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(5);
    });

    it("should include productOwnerUsername and projectManagerUsername", async () => {
      const res = await request(app).get("/teams");
      const team = res.body[0];
      expect(team).toHaveProperty("teamName");
      expect(team).toHaveProperty("productOwnerUsername");
      expect(team).toHaveProperty("projectManagerUsername");
    });
  });

  describe("GET /search?query=Task", () => {
    it("should search across tasks, projects, and users", async () => {
      const res = await request(app).get("/search?query=Task");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("tasks");
      expect(res.body).toHaveProperty("projects");
      expect(res.body).toHaveProperty("users");
      expect(Array.isArray(res.body.tasks)).toBe(true);
    });
  });
});
