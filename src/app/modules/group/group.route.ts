import express from "express";

import auth from "../../middlewares/auth";
import { GroupControllers } from "./group.controller";

const router = express.Router();
router.get(
  "/",
  auth("admin", "director", "company", "creator", "user"),
  GroupControllers.getAllGroup
);
router.post(
  "/",
  auth("admin", "director", "company", "creator", "user"),
  GroupControllers.createGroup
);
// get single user  group
router.get(
  "/single",
  auth("admin", "director", "company", "creator", "user"),
  GroupControllers.getGroupsByUserId
);
router.get(
  "/single/:id",
  auth("admin", "director", "company", "creator", "user"),
  GroupControllers.getSingleGroup
);

router.patch(
  "/single/:id",
  auth("admin", "director", "user", "company", "creator"),
  GroupControllers.updateGroup
);

router.post(
  "/addmember",
  auth("admin", "director", "user", "company", "creator"),
  GroupControllers.addGroupMember
);

router.post(
  "/removemember",
  auth("admin", "director", "user", "company", "creator"),
  GroupControllers.removeGroupMember
);

router.post(
  "/updateuserrole",
  auth("admin", "director", "user", "company", "creator"),
  GroupControllers.updateUsersRoleInGroup
);

router.delete(
  "/:id",
  auth("admin", "director", "company", "creator", "user"),
  GroupControllers.deleteGroup
);

router.post(
  "/updatereadmessage",
  auth("admin", "director", "user", "company", "creator"),
  GroupControllers.updateReadMessage
);


export const GroupRoutes = router;
