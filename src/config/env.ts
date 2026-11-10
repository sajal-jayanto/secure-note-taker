import "dotenv/config";

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  db: {
    uri: required("MONGODB_URI"),
    name: process.env.MONGO_DB_NAME ?? "secure-note-taker",
    port: Number(process.env.MONGO_PORT ?? 27017),
    username: process.env.MONGO_ROOT_USERNAME,
    password: process.env.MONGO_ROOT_PASSWORD,
  },
  jwt: {
    secret: required("JWT_SECRET"),
    expiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
  },
} as const;

if (env.jwt.secret.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters long");
}
