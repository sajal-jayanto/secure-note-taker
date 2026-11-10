import express from "express";

import cors from "cors";
import helmet from "helmet";

import { notFoundHandler } from "./middlewares/notFound.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { requestLogger } from "./middlewares/requestLogger.middleware.js";

import healthRouter from "./routes/health.routes.js";
import apiRouter from "./routes/api.routes.js";

const app = express();

const createbootstrapApp = () => {
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  app.use("/health", healthRouter);
  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createbootstrapApp;
