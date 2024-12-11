import { Router } from "express";
import { UserRoutes } from "../modules/user/user.route";
import { AuthRoutes } from "../modules/auth/auth.router";
import { TaskRoutes } from "../modules/task/task.route";
import { NoteRoutes } from "../modules/notes/note.route";
import { CommentRoutes } from "../modules/comment/comment.route";
import { TagsRoutes } from "../modules/tags/tags.route";
import { GroupRoutes } from "../modules/group/group.route";
import { GroupMessageRoutes } from '../modules/groupMessage/message.route';
import { NotificationsRoutes } from "../modules/notification/notification.route";

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
  {
    path: "/group",
    route: GroupRoutes,
  },
  {
    path: "/groupMessage",
    route: GroupMessageRoutes,
  },
  {
    path: "/notifications",
    route: NotificationsRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
