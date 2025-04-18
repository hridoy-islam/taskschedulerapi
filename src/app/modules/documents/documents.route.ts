/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/multer";
import { UploadDocumentController } from "./documents.controller";
// import auth from '../../middlewares/auth';

const router = express.Router();

router.post(
  "/",
  auth("admin", "director", "company", "creator", "user"),
  upload.single('file'),
  UploadDocumentController.UploadDocument
);


export const UploadDocumentRoutes = router;
