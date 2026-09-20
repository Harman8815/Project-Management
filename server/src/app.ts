import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import { RequestWithId, requestIdMiddleware, httpLogger } from "./middleware/logger";
import { sanitizeMessage } from "./middleware/logger";

import projectRoutes from "./routes/projectRoutes";
import taskRoutes from "./routes/taskRoutes";
import searchRoutes from "./routes/searchRoutes";
import userRoutes from "./routes/userRoutes";
import teamRoutes from "./routes/teamRoutes";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const requiredEnvVars = ["DATABASE_URL"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  const errorMsg = `Missing required environment variables: ${missingEnvVars.join(", ")}`;
  if (process.env.NODE_ENV !== "test") {
    console.error(errorMsg);
    process.exit(1);
  } else {
    console.warn(`⚠️  ${errorMsg}`);
  }
}

const app = express();

app.use(requestIdMiddleware);
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(httpLogger);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

app.get("/", (req, res) => {
  res.send("This is home route");
});

app.use("/projects", projectRoutes);
app.use("/tasks", taskRoutes);
app.use("/search", searchRoutes);
app.use("/users", userRoutes);
app.use("/teams", teamRoutes);

app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Not found",
  });
});

app.use(errorHandler);

export default app;
