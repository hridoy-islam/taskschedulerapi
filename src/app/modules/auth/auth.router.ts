import express from "express";
import { AuthControllers } from "./authController";
import validateRequest from "../../middlewares/validateRequest";
import { AuthValidations } from "./auth.validation";
import auth from "../../middlewares/auth";
const router = express.Router();

router.post(
  "/login",
  validateRequest(AuthValidations.loginValidationSchema),
  AuthControllers.login
);

router.post(
  "/google",
  validateRequest(AuthValidations.googleValidationSchema),
  AuthControllers.googleLoginController
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
  "/forget",
  validateRequest(AuthValidations.forgetPasswordValidationSchema),
  AuthControllers.forgetPassword
);

router.post(
  "/validate",
  validateRequest(AuthValidations.validateOtpSchema),
  AuthControllers.validate
);

export const AuthRoutes = router;
