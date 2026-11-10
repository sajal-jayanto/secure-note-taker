import { Router, type RequestHandler } from "express";

declare module "express-serve-static-core" {
  interface Router {
    group(prefix: string, define: (router: Router) => void): this;
    group(prefix: string, middlewares: RequestHandler[], define: (router: Router) => void): this;
  }
}

type GroupDefine = (router: Router) => void;

function group(
  this: Router,
  prefix: string,
  middlewaresOrDefine: RequestHandler[] | GroupDefine,
  maybeDefine?: GroupDefine,
): Router {
  const middlewares = Array.isArray(middlewaresOrDefine) ? middlewaresOrDefine : [];
  const define = Array.isArray(middlewaresOrDefine) ? maybeDefine : middlewaresOrDefine;
  if (typeof define !== "function") {
    throw new TypeError(`router.group("${prefix}") requires a callback`);
  }

  const subRouter = Router();
  define(subRouter);
  this.use(prefix, ...middlewares, subRouter);
  return this;
}

(Router as unknown as { prototype: { group: typeof group } }).prototype.group = group;
