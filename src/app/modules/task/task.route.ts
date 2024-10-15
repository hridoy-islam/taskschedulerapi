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
// router.get("/:id", auth("admin", "user"), UserControllers.getSingleUser);

router.patch(
  "/:id",
  auth("admin", "director", "user", "company", "creator"),
  TaskControllers.updateTask
);

export const TaskRoutes = router;
