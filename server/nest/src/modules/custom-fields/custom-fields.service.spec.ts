import { BadRequestException } from "@nestjs/common";
import { CustomFieldsService } from "./custom-fields.service";

describe("CustomFieldsService", () => {
  it("rejects unsupported field types", async () => {
    const service = new CustomFieldsService({} as any, { assertRole: jest.fn() } as any);
    await expect(service.create(1, 2, { name: "Bad", key: "bad", fieldType: "OBJECT" })).rejects.toThrow(BadRequestException);
  });

  it("validates numeric values within organization scope", async () => {
    const organizations = { assertRole: jest.fn().mockResolvedValue({ role: "ADMIN" }) };
    const prisma = { customFieldDefinition: { findUnique: jest.fn().mockResolvedValue({ id: 4, organizationId: 2, fieldType: "NUMBER" }) } };
    const service = new CustomFieldsService(prisma as any, organizations as any);
    await expect(service.setValue(1, 4, { taskId: 8, value: "not-a-number" })).rejects.toThrow(BadRequestException);
    expect(organizations.assertRole).toHaveBeenCalledWith(1, 2);
  });
});
