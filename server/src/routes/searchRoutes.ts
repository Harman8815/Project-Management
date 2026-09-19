import { Router } from "express";
import { search } from "../controllers/searchController";
import { validate } from "../middleware/validation";
import { SearchQuerySchema } from "../dtos";

const router = Router();

router.get("/", validate({ query: SearchQuerySchema }), search);

export default router;
