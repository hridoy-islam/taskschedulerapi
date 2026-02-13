import express from "express";

import auth from "../../middlewares/auth";
import { TaskControllers } from "./task.controller";

const router = express.Router();
router.get(
  "/",
  auth("admin", "director", "company", "creator", "user"),
  TaskControllers.getAllTask
);
router.get(
  "/alltasks/:id",
  auth("admin", "director", "company", "creator", "user"),
  TaskControllers.getAllTaskForUser
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
router.patch(
  "/reassign/:id",
  auth("admin", "director", "user", "company", "creator"),
  TaskControllers.reassignTask
);
router.get(
  "/:id",
  auth("admin", "director", "user", "company", "creator"),
  TaskControllers.getSingleTask
);

router.get(
  "/getbothuser/:authorId/:assignedId",
  auth("admin", "company", "creator", "director", "user"),
  TaskControllers.getTaskForUsers
);
router.get(
  "/needtofinish/:authorId/:assignedId",
  auth("admin", "company", "creator", "director", "user"),
  TaskControllers.getNeedToFinishTaskForUsers
);
router.get(
  "/completetask/:authorId/:assignedId",
  auth("admin", "company", "creator", "director", "user"),
  TaskControllers.getCompleteTaskForUsers
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
  "/assignedtasks/:authorId",
  auth("admin", "company", "creator", "director", "user"),
  TaskControllers.getAssignedTask
);
router.get(
  "/important/:userId",
  auth("admin", "company", "creator", "director", "user"),
  TaskControllers.getImportantTaskByUser
);
router.get(
  "/needtofinish/:authorId",
  auth("admin", "company", "creator", "director", "user"),
  TaskControllers.getNeedToFinishTask
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
router.post(
  "/readcomment",
  auth("admin", "company", "creator", "director", "user"),
  TaskControllers.updateReadComment
);

export const TaskRoutes = router;
