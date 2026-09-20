import { Test, TestingModule } from "@nestjs/testing";
import { WorkflowService, DEFAULT_WORKFLOW } from "./workflow.service";
import { BadRequestException } from "@nestjs/common";

describe("WorkflowService", () => {
  let service: WorkflowService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkflowService],
    }).compile();

    service = module.get<WorkflowService>(WorkflowService);
  });

  describe("DEFAULT_WORKFLOW", () => {
    it("should have all expected statuses", () => {
      expect(DEFAULT_WORKFLOW.statuses).toEqual([
        "To Do",
        "In Progress",
        "In Review",
        "Completed",
        "Blocked",
      ]);
    });

    it("should define valid transitions for To Do", () => {
      const todoTransitions = DEFAULT_WORKFLOW.transitions.find(
        (t) => t.from === "To Do",
      );
      expect(todoTransitions?.to).toContain("In Progress");
      expect(todoTransitions?.to).toContain("Blocked");
    });

    it("should have no transitions from Completed", () => {
      const completedTransitions = DEFAULT_WORKFLOW.transitions.find(
        (t) => t.from === "Completed",
      );
      expect(completedTransitions?.to).toEqual([]);
    });
  });

  describe("validateTransition", () => {
    it("should allow valid transition: To Do -> In Progress", () => {
      expect(
        service.validateTransition("To Do", "In Progress"),
      ).toBe(true);
    });

    it("should allow valid transition: In Progress -> In Review", () => {
      expect(
        service.validateTransition("In Progress", "In Review"),
      ).toBe(true);
    });

    it("should allow valid transition: Blocked -> To Do", () => {
      expect(
        service.validateTransition("Blocked", "To Do"),
      ).toBe(true);
    });

    it("should throw BadRequestException for invalid transition", () => {
      expect(() =>
        service.validateTransition("To Do", "Completed"),
      ).toThrow(BadRequestException);
    });

    it("should throw BadRequestException for completed -> in progress", () => {
      expect(() =>
        service.validateTransition("Completed", "In Progress"),
      ).toThrow("Invalid status transition");
    });

    it("should allow transition when current status is null", () => {
      expect(service.validateTransition(null, "In Progress")).toBe(true);
    });
  });

  describe("getValidTransitions", () => {
    it("should return valid transitions for a status", () => {
      const transitions = service.getValidTransitions("To Do");
      expect(transitions).toContain("In Progress");
      expect(transitions).toContain("Blocked");
    });

    it("should return empty array for terminal status", () => {
      const transitions = service.getValidTransitions("Completed");
      expect(transitions).toEqual([]);
    });

    it("should return empty array for unknown status", () => {
      const transitions = service.getValidTransitions("Unknown");
      expect(transitions).toEqual([]);
    });
  });

  describe("isTerminalStatus", () => {
    it("should return true for Completed", () => {
      expect(service.isTerminalStatus("Completed")).toBe(true);
    });

    it("should return false for In Progress", () => {
      expect(service.isTerminalStatus("In Progress")).toBe(false);
    });
  });

  describe("validateStatus", () => {
    it("should return true for valid status", () => {
      expect(service.validateStatus("To Do")).toBe(true);
    });

    it("should return false for invalid status", () => {
      expect(service.validateStatus("Unknown")).toBe(false);
    });
  });

  describe("setProjectWorkflow", () => {
    it("should set a custom workflow for a project", () => {
      const customWorkflow = {
        statuses: ["Backlog", "In Progress", "Done"],
        transitions: [
          { from: "Backlog", to: ["In Progress"] },
          { from: "In Progress", to: ["Done"] },
          { from: "Done", to: [] },
        ],
      };

      service.setProjectWorkflow(1, customWorkflow);

      expect(service.validateTransition("Backlog", "In Progress", 1)).toBe(
        true,
      );
      expect(() =>
        service.validateTransition("Backlog", "Done", 1),
      ).toThrow("Invalid status transition");
    });

    it("should fall back to default workflow for unknown project", () => {
      expect(
        service.validateTransition("To Do", "In Progress", 999),
      ).toBe(true);
    });
  });
});
