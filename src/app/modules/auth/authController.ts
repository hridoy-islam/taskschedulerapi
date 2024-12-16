import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AuthServices } from "./auth.service";
import { sendEmail } from "../../utils/sendEmail";
import { PasswordResetServices } from "../passwordReset/passwordReset.service";

const login = catchAsync(async (req, res) => {
  const result = await AuthServices.checkLogin(req.body);
  const { accessToken } = result;

  // res.cookie('refreshToken', refreshToken, {
  //   secure: config.NODE_ENV === 'production',
  //   httpOnly: true,
  // });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged In Successfully",
    data: {
      accessToken,
    },
  });
});

const googleLoginController = catchAsync(async (req, res) => {
  const result = await AuthServices.googleLogin(req.body);
  const { accessToken } = result;

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged in successfully using Google",
    data: {
      accessToken,
    },
  });
});




const createUser = catchAsync(async (req, res) => {
  const result = await AuthServices.createUserIntoDB(req.body);
  // send welcome email to user
  //await sendEmail("me.mrsajib@gmail.com", "hello");

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User Created Successfully",
    data: result,
  });
});

const forgetPassword = catchAsync(async (req, res) => {
  const email = req.body.email;
  const result = await PasswordResetServices.requestOtp(email);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "OTP Code is generated succesfully!",
    data: result,
  });
});

const validateReset = catchAsync(async (req, res) => {
  const email = req.body.email;
  const otp = req.body.otp;
  const result = await PasswordResetServices.validateOtp(email, otp);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "OTP Code is validated succesfully!",
    data: result,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const token = req.headers.authorization;
  const result = await AuthServices.resetPassword(req.body, token as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password reset succesful!",
    data: result,
  });
});

const verifyEmail = catchAsync(async (req, res) => {
  const email = req.body.email;
  const otp = req.body.otp;
  const result = await AuthServices.verifyEmailIntoDB(email, otp);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Email verified succesfully!",
    data: result,
  });
});

const emailVerifySendOtp = catchAsync(async (req, res) => {
  const email = req.body.email;
  const result = await AuthServices.EmailSendOTP(email);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Email OTP Send succesfully!",
    data: result,
  });
});



export const AuthControllers = {
  login,
  createUser,
  forgetPassword,
  resetPassword,
  googleLoginController,
  validateReset,
  verifyEmail,
  emailVerifySendOtp
};
