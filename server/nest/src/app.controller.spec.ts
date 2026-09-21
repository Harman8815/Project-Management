import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

describe("AppController", () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe("GET /", () => {
    it("should return home route message", () => {
      expect(appController.getHello()).toBe("This is home route");
    });
  });

  describe("GET /health", () => {
    it("should return ok status", () => {
      expect(appController.check()).toEqual({ status: "ok" });
    });
  });
});
