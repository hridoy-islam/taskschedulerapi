import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { User } from "../user/user.model";
import { TCreateUser, TLogin } from "./auth.interface";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";

import { createToken, verifyToken } from "./auth.utils";
import { sendEmail } from "../../utils/sendEmail";
import { jwtHelpers } from "../../helpers/jwtHelpers";
import { Secret } from "jsonwebtoken";
import config from "../../config";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import moment from "moment";
import * as UAParser from "ua-parser-js";

import requestIp from "request-ip";
import crypto from "crypto";

function generateOtpAndExpiry() {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const otpExpiry = moment().add(10, "minutes").toDate();

  return { otp, otpExpiry };
}

const checkLogin = async (payload: TLogin, req: any) => {
  try {
    // Ensure req is available
    if (!req) {
      throw new AppError(httpStatus.BAD_REQUEST, "Request object is missing");
    }

    const foundUser = await User.isUserExists(payload.email);
    if (!foundUser) {
      throw new AppError(httpStatus.NOT_FOUND, "Login details are incorrect");
    }

    if (foundUser.isDeleted) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "This account has been deleted."
      );
    }

    if (
      !(await User.isPasswordMatched(payload?.password, foundUser?.password))
    ) {
      throw new AppError(httpStatus.FORBIDDEN, "Password does not match");
    }

    // Get the client's IP address
    const ipAddress = requestIp.getClientIp(req);
    if (!ipAddress) {
      console.error("Could not retrieve IP address from request.");
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "IP address retrieval failed"
      );
    }

    // Parse user agent
    const parser = new UAParser.UAParser(req.headers["user-agent"]);
    const uaResult = parser.getResult();

    // Create device fingerprint
    const deviceFingerprint = crypto
      .createHash("sha256")
      .update(req.headers["user-agent"] + req.headers["accept-language"])
      .digest("hex");

    // Prepare user agent info object
    const userAgentInfo = {
      browser: {
        name: uaResult.browser.name,
        version: uaResult.browser.version,
      },
      os: {
        name: uaResult.os.name,
        version: uaResult.os.version,
      },
      device: {
        model: uaResult.device?.model || "Desktop",
        type: uaResult.device?.type || "desktop",
        vendor: uaResult.device?.vendor || "unknown",
      },
      cpu: {
        architecture: uaResult.cpu.architecture,
      },
      ipAddress: ipAddress,
      macAddress: deviceFingerprint,
      timestamp: new Date(),
    };

    const existingLoginInfo = foundUser.userAgentInfo || [] ;

    const alreadyLoggedInFromSameDevice = existingLoginInfo.some(
      (info) =>
        info.ipAddress === ipAddress || info.macAddress === deviceFingerprint
    );

    if (!alreadyLoggedInFromSameDevice) {
      await User.findByIdAndUpdate(foundUser._id, {
        $push: {
          userAgentInfo: userAgentInfo,
        },
      });
    }

    // Prepare JWT payload
    const jwtPayload = {
      _id: foundUser._id?.toString(),
      email: foundUser?.email,
      name: foundUser?.name,
      role: foundUser?.role,
      authorized: foundUser?.authorized,
      isValided: foundUser?.isValided,
    };

    // If user is not authorized, generate OTP and send it
    if (!foundUser.isValided) {
      const { otp, otpExpiry } = generateOtpAndExpiry();

      await User.findByIdAndUpdate(foundUser._id, {
        otp,
        otpExpiry,
        isUsed: false,
      });

      const emailSubject = "Please Verify Your Email Address for Task Planner";
      await sendEmail(
        foundUser.email,
        "verify_email_template",
        emailSubject,
        foundUser.name,
        otp
      );
    }

    // Generate access and refresh tokens
    const accessToken = createToken(
      jwtPayload,
      config.jwt_access_secret as string,
      config.jwt_access_expires_in as string
    );

    const refreshToken = createToken(
      jwtPayload,
      config.jwt_refresh_secret as string,
      config.jwt_refresh_expires_in as string
    );

    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error("Error in checkLogin service:", error);
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "An error occurred during login"
    );
  }
};

const refreshToken = async (token: string) => {
  if (!token || typeof token !== "string") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Refresh token is required and should be a valid string."
    );
  }
  const decoded = verifyToken(token, config.jwt_refresh_secret as string);

  const { email } = decoded;

  const foundUser = await User.isUserExists(email);

  if (!foundUser) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid refresh token");
  }

  try {
    const jwtPayload = {
      _id: foundUser._id.toString(),
      email: foundUser.email,
      name: foundUser.name,
      role: foundUser.role,
    };

    // Generate new access token
    const newAccessToken = createToken(
      jwtPayload,
      config.jwt_access_secret as string,
      config.jwt_access_expires_in as string
    );

    return {
      accessToken: newAccessToken,
    };
  } catch (err) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid Refresh Token");
  }
};

const googleLogin = async (payload: {
  email: string;
  name: string;
  password: string;
  googleUid: string;
  image?: string;
  phone?: string;
}) => {
  try {
    // Check if the user exists
    const foundUser = await User.isUserExists(payload.email);

    if (!foundUser) {
      // If user doesn't exist, register them
      const newUser = await User.create({
        email: payload.email,
        name: payload.name,
        password: payload.password,
        googleUid: payload.googleUid,
        image: payload.image,
        phone: payload.phone,
        role: "company",
      });

      // Generate JWT for the new user
      const accessToken = jwt.sign(
        {
          _id: newUser._id?.toString(),
          email: newUser?.email,
          name: newUser?.name,
          role: newUser?.role,
        },
        `${config.jwt_access_secret}`,
        {
          expiresIn: "4d",
        }
      );

      return {
        accessToken,
      };
    }

    // If user is deleted, block access
    if (foundUser.isDeleted) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "This Account Has Been Deleted."
      );
    }

    // Generate JWT for the existing user
    const accessToken = jwt.sign(
      {
        _id: foundUser._id?.toString(),
        email: foundUser?.email,
        name: foundUser?.name,
        role: foundUser?.role,
      },
      `${config.jwt_access_secret}`,
      {
        expiresIn: "7d",
      }
    );

    return {
      accessToken,
    };
  } catch (error: any) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Something went wrong during Google login"
    );
  }
};

const createUserIntoDB = async (payload: TCreateUser) => {
  const user = await User.isUserExists(payload.email);
  if (user) {
    throw new AppError(httpStatus.NOT_FOUND, "This user is already exits!");
  }

  // const { otp, otpExpiry } = generateOtpAndExpiry();
  const newUserPayload = {
    ...payload,
    // otp,
    // otpExpiry
  };

  const result = await User.create(newUserPayload);

  try {
    // const emailSubject = 'Your Password Reset OTP';
    // await sendEmail(
    //   payload.email,
    //   'reset_password_template',
    //   emailSubject,
    //   payload.name,
    //   otp
    // );

    await sendEmail(
      payload.email,
      "welcome_template",
      "Welcome to Task Planner – Let’s Get Started!",
      payload.name
    );
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }

  return result;
};

const EmailSendOTP = async (email: string) => {
  const user = await User.isUserExists(email);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "No User Found");
  }
  const { otp, otpExpiry } = generateOtpAndExpiry();

  const emailSubject = "Please Verify Your Email Address for Task Planner";
  await sendEmail(
    user.email,
    "verify_email_template",
    emailSubject,
    user.name,
    otp
  );

  await User.updateOne({ email }, { otp, otpExpiry });
};

export const verifyEmailIntoDB = async (email: string, otp: string) => {
  const foundUser = await User.findOne({ email: email.toLowerCase() });

  if (!foundUser) {
    throw new AppError(httpStatus.NOT_FOUND, "Email is not correct");
  }

  // Check OTP
  if (foundUser.otp !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP!");
  }

  // Check OTP expiry using moment
  if (foundUser.otpExpires && moment().isAfter(moment(foundUser.otpExpires))) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP has expired");
  }

  // Update user: mark as authorized and clear OTP
  await User.updateOne(
    { email: email.toLowerCase() },
    { otp: "", otpExpires: null, isValided: true }
  );

  const jwtPayload = {
    _id: foundUser._id?.toString(),
    email: foundUser.email,
    name: foundUser.name,
    role: foundUser.role,
    isValided: foundUser.isValided,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string
  );

  return {
    accessToken,
    refreshToken,
  };
};

// const forgetPassword = async (email: string) => {
//   const user = await User.isUserExists(email);
//   if (!user) {
//     throw new AppError(httpStatus.NOT_FOUND, "This user is not found !");
//   }
//   const jwtPayload = {
//     email: user.email,
//     role: user.role,
//   };
//   const resetToken = createToken(
//     jwtPayload,
//     config.jwt_access_secret as string,
//     "10m"
//   );
//   const resetUILink = `${config.reset_pass_ui_link}?id=${user.email}&token=${resetToken} `;
//   sendEmail(user.email, resetUILink);
// };

const forgetPasswordOtp = async (email: string) => {
  const user = await User.isUserExists(email);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "This user is not found !");
  }
};

const resetPassword = async (payload: { userId: string; password: string }) => {
  // Corrected line: passing the userId in an object
  const user = await User.findOne({ _id: payload.userId }).select("+password");

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "This user is not found !");
  }

  // const decoded = jwt.verify(token, config.jwt_access_secret as string) as JwtPayload;

  // if (payload.userId !== decoded._id) {
  //   throw new AppError(httpStatus.FORBIDDEN, "You are forbidden!");
  // }
  //   console.log("New Password:", payload.password);  // Should be a non-empty string
  //   console.log("Salt Rounds:", config.bcrypt_salt_rounds);  // Should be a valid number

  //   const salt = await bcrypt.genSalt(Number(config.bcrypt_salt_rounds));
  // const hashedPassword = await bcrypt.hash(payload.password,salt );

  user.password = payload.password;
  await user.save();

  return { message: "Password updated successfully" };
};

const ChangePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  // Step 1: Find the user by ID
  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  // Step 2: Verify the current password
  const isPasswordValid = await User.isPasswordMatched(
    currentPassword,
    user.password
  );
  if (!isPasswordValid) {
    throw new AppError(httpStatus.BAD_REQUEST, "Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  // Return success message
  return { message: "Password updated successfully" };
};

const requestOtp = async (email: string) => {
  const foundUser = await User.isUserExists(email);
  if (!foundUser) {
    throw new AppError(httpStatus.NOT_FOUND, "Email is not correct");
  }

  const { otp, otpExpiry } = generateOtpAndExpiry();

  await User.findByIdAndUpdate(foundUser._id, {
    otp,
    otpExpiry,
    isUsed: false,
  });
  const emailSubject = "Reset Your Task Planner Password";

  await sendEmail(
    email,
    "reset_password_template",
    emailSubject,
    foundUser.name,
    otp
  );
};

const validateOtp = async (email: string, otp: string) => {
  // Check if the user exists
  const foundUser = await User.isUserExists(email.toLowerCase());
  if (!foundUser) {
    console.log("User not found for email:", email);
    throw new AppError(httpStatus.NOT_FOUND, "Email not found");
  }

  // Check if the OTP is linked to a valid reset request and is not already used
  const passwordReset = await User.findOne({
    _id: foundUser._id,
    isUsed: false,
  });

  if (!passwordReset || passwordReset.otp !== otp) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid OTP");
  }

  // Check if OTP has expired using moment
  if (moment(passwordReset.otpExpiry).isBefore(moment())) {
    console.log(
      "OTP Expired. Expiry Time:",
      passwordReset.otpExpiry,
      "Current Time:",
      moment().toDate()
    );
    throw new AppError(httpStatus.FORBIDDEN, "OTP has expired");
  }

  // Mark OTP as used
  passwordReset.isUsed = true;
  await passwordReset.save();

  // Create the reset token (JWT)
  const resetToken = jwt.sign(
    {
      _id: foundUser._id.toString(),
      email: foundUser.email,
      name: foundUser.name,
      role: foundUser.role,
    },
    `${config.jwt_access_secret}`,
    { expiresIn: "10m" } // Set token expiry to 10 minutes
  );

  // Send confirmation email to the user
  await sendEmail(
    email,
    "validated_otp_template",
    "OTP Validated Successfully",
    foundUser.name
  );

  // Return the reset token for further use
  return { resetToken };
};
const personalInformationIntoDB = async (id: string, payload: any) => {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const result = await User.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};

export const AuthServices = {
  checkLogin,
  createUserIntoDB,
  resetPassword,
  forgetPasswordOtp,
  googleLogin,
  verifyEmailIntoDB,
  EmailSendOTP,
  refreshToken,
  ChangePassword,
  validateOtp,
  requestOtp,
  personalInformationIntoDB,
};
