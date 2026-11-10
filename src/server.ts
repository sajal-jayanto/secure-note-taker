import createbootstrapApp from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { connectDB, disconnectDB } from "./db/init.js";

const app = createbootstrapApp();
const PORT = env.port;

const bootstrapServer = async () => {
  try {
    await connectDB();
  } catch (err) {
    logger.fatal({ err }, "❌ Failed to connect to MongoDB. Shutting down.");
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    logger.info(`✅ Service listening on port ${PORT} [${env.nodeEnv}]`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
      disconnectDB()
        .catch((err: unknown) => logger.error({ err }, "Error while closing MongoDB connection"))
        .finally(() => process.exit(0));
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

bootstrapServer().catch((err: unknown) => {
  logger.fatal({ err }, "❌ Server failed to start");
  process.exit(1);
});
