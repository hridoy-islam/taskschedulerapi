import express from "express";

import auth from "../../middlewares/auth";
import { ScheduleTaskControllers } from "./scheduleTask.controller";

const router = express.Router();
router.get(
  "/",
  auth("admin", "director", "company", "creator", "user"),
  ScheduleTaskControllers.getAllScheduleTask
);


router.post(
  "/",
  auth("admin", "director", "company", "creator", "user"),
  ScheduleTaskControllers.createScheduleTask
);

router.patch(
  "/:id",
  auth("admin", "director", "user", "company", "creator"),
  ScheduleTaskControllers.updateScheduleTask
);
router.delete(
  "/:id",
  auth("admin", "director", "user", "company", "creator"),
  ScheduleTaskControllers.deleteScheduleTask
);

router.get(
  "/:id",
  auth("admin", "director", "user", "company", "creator"),
  ScheduleTaskControllers.getSingleScheduleTask
);



router.get(
  "/assignedScheduleTasks/:authorId/:assignedId",
  auth("admin", "company", "creator", "director", "user"),
  ScheduleTaskControllers.getAssignedScheduleTask
);
router.get(
  "/personal-task/:authorId",
  auth("admin", "company", "creator", "director", "user"),
  ScheduleTaskControllers.getPersonalScheduleTasks
);


export const ScheduleTaskRoutes = router;
