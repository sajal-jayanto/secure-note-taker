import { pinoHttp } from "pino-http";
import { logger } from "../config/logger.js";

const requestLogger = pinoHttp({
  logger,
  serializers: {
    req: (req: { method?: string; url?: string }) => ({ method: req.method, url: req.url }),
    res: (res: { statusCode?: number }) => ({ statusCode: res.statusCode }),
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
});

export { requestLogger };
