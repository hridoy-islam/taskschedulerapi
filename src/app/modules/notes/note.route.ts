import express from "express";

import auth from "../../middlewares/auth";
import { NoteControllers } from "./note.controller";

const router = express.Router();
router.get(
  "/",
  auth("admin", "company", "creator", "user"),
  NoteControllers.getAllNotes
);
router.get(
  "/:id",
  auth("admin", "company", "creator", "user"),
  NoteControllers.getSingleNote
);
router.post(
  "/",
  auth("admin", "company", "creator", "user"),
  NoteControllers.createNote
);

router.patch(
  "/:id",
  auth("admin", "user", "company", "creator"),
  NoteControllers.updateNote
);
router.delete(
  "/:id",
  auth("admin", "user", "company", "creator"),
  NoteControllers.deleteNote
);

export const NoteRoutes = router;
