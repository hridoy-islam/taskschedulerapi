import { Router } from "express";
import { UserRoutes } from "../modules/user/user.route";
import { AuthRoutes } from "../modules/auth/auth.router";
import { TaskRoutes } from "../modules/task/task.route";
import { NoteRoutes } from "../modules/notes/note.route";
import { CommentRoutes } from "../modules/comment/comment.route";
import { TagsRoutes } from "../modules/tags/tags.route";

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
  {
    path: "/tags",
    route: TagsRoutes,
  },
  {
    path: "/comment",
    route: CommentRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
