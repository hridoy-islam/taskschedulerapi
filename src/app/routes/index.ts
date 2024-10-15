import { Router } from "express";
import { UserRoutes } from "../modules/user/user.route";
import { AuthRoutes } from "../modules/auth/auth.router";
import { TaskRoutes } from "../modules/task/task.route";
import { NoteRoutes } from "../modules/notes/note.route";

const router = Router();

const moduleRoutes = [
  {
    path: "/users",
    route: UserRoutes,
  },
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/task",
    route: TaskRoutes,
  },
  {
    path: "/notes",
    route: NoteRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
