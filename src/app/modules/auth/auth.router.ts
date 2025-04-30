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
  '/refreshToken',
  validateRequest(AuthValidations.refreshTokenZodSchema),
  AuthControllers.refreshToken
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
router.patch(
  "/forget",
  // validateRequest(AuthValidations.forgetPasswordValidationSchema),
  AuthControllers.forgetPassword
);

router.patch(
  "/validate",
  AuthControllers.validateReset
);

router.patch('/reset', AuthControllers.resetPassword)

router.post('/emailotp', validateRequest(AuthValidations.emailSentOtpSchema), AuthControllers.emailVerifySendOtp);

router.patch(
  "/verifyemail",
  validateRequest(AuthValidations.verifyEmailAccount),
  AuthControllers.verifyEmail
);

router.patch(
  "/resend-otp",
  AuthControllers.emailVerifySendOtp
);
router.patch(
  "/:id/change-password",

  AuthControllers.ChangePassword
);
router.patch(
  "/users/:id",
  AuthControllers.PersonalInformation
);



export const AuthRoutes = router;
