import express from "express";
import { AuthControllers } from "./authController";
import validateRequest from "../../middlewares/validateRequest";
import { AuthValidations } from "./auth.validation";
import auth from "../../middlewares/auth";
// import auth from '../../middlewares/auth';
const router = express.Router();

router.post(
  "/login",
  validateRequest(AuthValidations.loginValidationSchema),
  AuthControllers.login
);
router.post(
  "/signup",
  validateRequest(AuthValidations.createUserValidationSchema),
  AuthControllers.createUser
);
// router.post(
//   '/create-user',
//   auth('admin'),
//   validateRequest(AuthValidations.createUserValidationSchema),
//   AuthControllers.createUser,
// );
router.post(
  "/forget-password",
  validateRequest(AuthValidations.forgetPasswordValidationSchema),
  AuthControllers.forgetPassword
);

router.post(
  "/reset",
  validateRequest(AuthValidations.forgetPasswordValidationSchema),
  AuthControllers.resetPassword
);

export const AuthRoutes = router;
