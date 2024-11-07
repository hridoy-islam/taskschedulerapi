import express from "express";

import auth from "../../middlewares/auth";
import { TagsControllers } from "./tags.controller";

const router = express.Router();
router.post(
  "/",
  auth("admin", "director", "company", "creator", "user"),
  TagsControllers.createTags
);
router.get(
  "/",
  auth("admin", "director", "company", "creator", "user"),
  TagsControllers.getAllTags
);
router.get(
  "/:id",
  auth("admin", "director", "company", "creator", "user"),
  TagsControllers.getSingleTags
);

router.patch(
  "/:id",
  auth("admin", "director", "user", "company", "creator"),
  TagsControllers.updateTags
);
router.delete(
  "/:id",
  auth("admin", "director", "user", "company", "creator"),
  TagsControllers.deleteTags
);

export const TagsRoutes = router;
