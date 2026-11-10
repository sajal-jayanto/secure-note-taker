import { Router } from "express";
import "../utils/routerGroup.js";
import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import { validateBody, validateParams, validateQuery } from "../middlewares/validate.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/isAdmin.middleware.js";
import { AuthController } from "../controllers/auth.controller.js";
import { UserController } from "../controllers/user.controller.js";
import { NoteController } from "../controllers/note.controller.js";
import { PostController } from "../controllers/post.controller.js";
import { AuthService } from "../services/auth.service.js";
import { UserService } from "../services/user.service.js";
import { NoteService } from "../services/note.service.js";
import { PostService } from "../services/post.service.js";
import { UserRepository } from "../repositories/user.repository.js";
import { NoteRepository } from "../repositories/note.repository.js";
import { PostRepository } from "../repositories/post.repository.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
} from "../validators/user.validator.js";
import { paginationQuerySchema } from "../validators/pagination.validator.js";
import { createPostSchema } from "../validators/post.validator.js";
import {
  createNoteSchema,
  noteIdParamSchema,
  updateNoteSchema,
} from "../validators/note.validator.js";

const userRepository = new UserRepository();
const authService = new AuthService(userRepository);
const authController = new AuthController(authService);

const userService = new UserService(userRepository);
const userController = new UserController(userService);

const noteRepository = new NoteRepository();
const noteService = new NoteService(noteRepository);
const noteController = new NoteController(noteService);

const postRepository = new PostRepository();
const postService = new PostService(postRepository);
const postController = new PostController(postService);

const apiRouter = Router();

apiRouter.group("/auth", (router) => {
  router.post("/register", validateBody(registerSchema), asyncHandler(authController.register));
  router.post("/login", validateBody(loginSchema), asyncHandler(authController.login));
});

apiRouter.group("/users", [authenticate], (router) => {
  router.get("/", asyncHandler(userController.listNames));
  router.get("/me", asyncHandler(userController.getMe));
  router.get("/interests", asyncHandler(userController.groupByinterests));
  router.get(
    "/:id/posts",
    validateParams(userIdParamSchema),
    validateQuery(paginationQuerySchema),
    asyncHandler(postController.listByUser),
  );
});

apiRouter.group("/admin", [authenticate], (router) => {
  router.get(
    "/users",
    isAdmin,
    validateQuery(paginationQuerySchema),
    asyncHandler(userController.list),
  );
  router.post(
    "/user",
    isAdmin,
    validateBody(createUserSchema),
    asyncHandler(userController.create),
  );
  router.patch(
    "/user/:id",
    isAdmin,
    validateParams(userIdParamSchema),
    validateBody(updateUserSchema),
    asyncHandler(userController.update),
  );
  router.delete(
    "/user/:id",
    isAdmin,
    validateParams(userIdParamSchema),
    asyncHandler(userController.remove),
  );

  router.get(
    "/notes",
    isAdmin,
    validateQuery(paginationQuerySchema),
    asyncHandler(noteController.listAll),
  );
  router.get(
    "/user/:id/notes",
    isAdmin,
    validateParams(userIdParamSchema),
    validateQuery(paginationQuerySchema),
    asyncHandler(noteController.listByUser),
  );
});

apiRouter.group("/notes", [authenticate], (router) => {
  router.get("/", validateQuery(paginationQuerySchema), asyncHandler(noteController.list));
  router.get("/:id", validateParams(noteIdParamSchema), asyncHandler(noteController.getOne));
  router.post("/", validateBody(createNoteSchema), asyncHandler(noteController.create));
  router.patch(
    "/:id",
    validateParams(noteIdParamSchema),
    validateBody(updateNoteSchema),
    asyncHandler(noteController.update),
  );
  router.delete("/:id", validateParams(noteIdParamSchema), asyncHandler(noteController.remove));
});

apiRouter.group("/posts", [authenticate], (router) => {
  router.post("/", validateBody(createPostSchema), asyncHandler(postController.create));
});

export default apiRouter;
