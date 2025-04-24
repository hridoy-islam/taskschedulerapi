/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { CommentControllers } from "./comment.controller";
import auth from "../../middlewares/auth";
const router = express.Router();
router.post(
  "/",
  auth("admin", "company", "creator", "user", "director"),
  CommentControllers.createComment
);
router.get(
  "/:id",
  auth("admin", "user", "director", "company", "creator"),
  CommentControllers.getComments
);
router.patch(
  "/:id",
  auth("admin", "user", "director", "company", "creator"),
  CommentControllers.updateComment
);

export const CommentRoutes = router;
