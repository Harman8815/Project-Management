import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import crypto from "crypto";

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

app.use((req, res, next) => {
  req.headers["x-request-id"] =
    req.headers["x-request-id"] || crypto.randomUUID();
  next();
});

app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("combined"));

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

app.use(errorHandler);

export default app;
