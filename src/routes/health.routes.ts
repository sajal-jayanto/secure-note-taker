import { Router, type Request, type Response } from "express";
import { StatusCodes } from "http-status-codes";

const healthRouter = Router();

healthRouter.get("/", (_req: Request, res: Response) => {
  const statusCodes = StatusCodes.OK;

  const response = {
    status: "ok",
    time: new Date().toISOString(),
    uptime: process.uptime(),
  };

  res.status(statusCodes).json(response);
});

export default healthRouter;
