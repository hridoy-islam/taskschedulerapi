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
import { UploadDocumentRoutes } from "../modules/documents/documents.route";
import { CompanyReportRoutes } from "../modules/companyReport/companyReport.router";
import { SubscriptionPlanRoutes } from "../modules/subscriptionPlan/subscriptionPlan.router";
import { ScheduleTaskRoutes } from "../modules/scheduleTask/scheduleTask.route";

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
  {
    path: "/documents",
    route: UploadDocumentRoutes,
  },
    {
    path: "/company-report",
    route: CompanyReportRoutes,
  },
    {
    path: "/subscription-plans",
    route: SubscriptionPlanRoutes,
  },
    {
    path: "/schedule-task",
    route: ScheduleTaskRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
