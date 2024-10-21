import express from "express";

import auth from "../../middlewares/auth";
import { TaskControllers } from "./task.controller";

const router = express.Router();
router.get(
  "/",
  auth("admin", "director", "company", "creator", "user"),
  TaskControllers.getAllTask
);
router.post(
  "/",
  auth("admin", "director", "company", "creator", "user"),
  TaskControllers.createTask
);

router.patch(
  "/:id",
  auth("admin", "director", "user", "company", "creator"),
  TaskControllers.updateTask
);

router.get(
  "/getbothuser/:authorId/:assignedId",
  auth("admin", "company", "creator", "director", "user"),
  TaskControllers.getTaskForUsers
);

router.get(
  "/today/:userid",
  auth("admin", "company", "creator", "director", "user"),
  TaskControllers.getTodaysTasks
);

router.get(
  "/duetasks/:assignedId",
  auth("admin", "company", "creator", "director", "user"),
  TaskControllers.getDueTasks
);

router.get(
  "/upcommingtasks/:assignedId",
  auth("admin", "company", "creator", "director", "user"),
  TaskControllers.getUpcommingTask
);

router.get(
  "/planner/:year/:month/:assigned",
  auth("admin", "company", "creator", "director", "user"),
  TaskControllers.getPlannerTasks
);
router.get(
  "/planner/week/:year/:week/:assigned",
  auth("admin", "company", "creator", "director", "user"),
  TaskControllers.getPlannerTasksByWeek
);
router.get(
  "/planner/day/:date/:assigned",
  auth("admin", "company", "creator", "director", "user"),
  TaskControllers.getPlannerTasksByDay
);

export const TaskRoutes = router;
