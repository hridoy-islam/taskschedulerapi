/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { CommentControllers } from "./message.controller";
import auth from "../../middlewares/auth";
const router = express.Router();
router.post(
  "/",
  auth("admin", "company", "creator", "user", "director"),
  CommentControllers.createMessages
);
router.get(
  "/:id",
  auth("admin", "user", "director", "company", "creator"),
  CommentControllers.getMessages
);
router.patch(
  "/:id",
  auth("admin", "user", "director", "company", "creator"),
  CommentControllers.updateMessage
);

export const GroupMessageRoutes = router;
