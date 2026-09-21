import { buildProject, buildProjectMembership, buildTask, buildUser } from "./factories";

describe("test factories", () => {
  it("builds deterministic fixtures and accepts overrides", () => {
    expect(buildUser({ userId: 7 }).userId).toBe(7);
    expect(buildProject({ status: "ACTIVE" }).status).toBe("ACTIVE");
    expect(buildTask({ projectId: 4 }).projectId).toBe(4);
    expect(buildProjectMembership({ role: "OWNER" })).toMatchObject({ role: "OWNER", status: "ACTIVE" });
  });
});
