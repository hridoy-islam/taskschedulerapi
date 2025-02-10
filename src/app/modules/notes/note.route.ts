import express from "express";

import auth from "../../middlewares/auth";
import { NoteControllers } from "./note.controller";

const router = express.Router();
router.post(
  "/",
  auth("admin", "director", "company", "creator", "user"),
  NoteControllers.createNote
);
router.get(
  "/",
  auth("admin", "director", "company", "creator", "user"),
  NoteControllers.getAllNotes
);
router.get(
  "/:id",
  auth("admin", "director", "company", "creator", "user"),
  NoteControllers.getNoteByUserId
);

router.get(
  "/singlenote/:id",
  auth("admin", "director", "company", "creator", "user"),
  NoteControllers.getSingleNoteById
);

router.patch(
  "/singlenote/:id",
  auth("admin", "director", "user", "company", "creator"),
  NoteControllers.updateNote
);
router.delete(
  "/singlenote/:id",
  auth("admin", "director", "user", "company", "creator"),
  NoteControllers.deleteNote
);

export const NoteRoutes = router;
