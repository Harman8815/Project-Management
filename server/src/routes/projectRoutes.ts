import { Router } from "express";
import { createProject, getProjects } from "../controllers/projectController";
import { validate } from "../middleware/validation";
import { CreateProjectSchema } from "../dtos";

const router = Router();

router.get("/", getProjects);
router.post("/", validate({ body: CreateProjectSchema }), createProject);

export default router;
