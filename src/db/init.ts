import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

export const connectDB = async (): Promise<void> => {
  mongoose.connection.on("disconnected", () => logger.warn("⚠️ MongoDB disconnected"));
  mongoose.connection.on("reconnected", () => logger.info("🔄 MongoDB reconnected"));
  mongoose.connection.on("error", (err) => logger.error({ err }, "MongoDB connection error"));

  await mongoose.connect(env.db.uri, {
    dbName: env.db.name,
    serverSelectionTimeoutMS: 5000,
  });

  logger.info(
    `✅ MongoDB connected [${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}]`,
  );
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.connection.close();
  logger.info("MongoDB connection closed");
};
