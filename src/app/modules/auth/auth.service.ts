import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { User } from "../user/user.model";
import { TCreateUser, TLogin } from "./auth.interface";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";

import { createToken, verifyToken } from "./auth.utils";
import { sendEmail } from "../../utils/sendEmail";
import { jwtHelpers } from "../../helpers/jwtHelpers";
import { Secret } from 'jsonwebtoken';
import config from '../../config';
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

const checkLogin = async (payload: TLogin) => {
  try {
    const foundUser = await User.isUserExists(payload.email);
    if (!foundUser) {
      throw new AppError(httpStatus.NOT_FOUND, "Login Detials is not correct");
    }
    if (foundUser.isDeleted) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "This Account Has Been Deleted."
      );
    }

    if (!(await User.isPasswordMatched(payload?.password, foundUser?.password)))
      throw new AppError(httpStatus.FORBIDDEN, "Password do not matched");

    const accessToken = jwt.sign(
      {
        _id: foundUser._id?.toString(),
        email: foundUser?.email,
        name: foundUser?.name,
        role: foundUser?.role,
      },
      `${config.jwt_access_secret}`,
      {
        expiresIn: "2 days",
      }
    );

    const refreshToken = jwt.sign(
      {
        _id: foundUser._id?.toString(),
        email: foundUser?.email,
        name: foundUser?.name,
        role: foundUser?.role,
      },
      `${config.jwt_refresh_secret}`,
       {
        expiresIn: "4 days", // Refresh Token expires in 7 days
      }
    );
    await User.updateOne({ _id: foundUser._id }, { refreshToken });
    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    throw new AppError(httpStatus.NOT_FOUND, "Details doesnt match");
  }
};



const refreshToken = async (token: string) => {
  if (!token || typeof token !== "string") {
    throw new AppError(httpStatus.BAD_REQUEST, "Refresh token is required and should be a valid string.");
  }

  // 🔥 Check if the token exists in the database
  const foundUser = await User.findOne({ 
    refreshToken: { $eq: token } });

  

  if (!foundUser) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid refresh token");
  }

  try {
    // ✅ Fix: Await `jwt.verify()` to properly handle async
    const decoded = jwt.verify(token,  `${config.jwt_refresh_secret}`,);

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        _id: foundUser._id.toString(),
        email: foundUser.email,
        name: foundUser.name,
        role: foundUser.role,
      },
      `${config.jwt_access_secret}`,
      { expiresIn: "2 days" }
    );

    // Generate new refresh token (optional rotation)
    const newRefreshToken = jwt.sign(
      {
        _id: foundUser._id.toString(),
        email: foundUser.email,
        name: foundUser.name,
        role: foundUser.role,
      },
      `${config.jwt_refresh_secret}`,
      { expiresIn: "4 days" }
    );

    // 🔥 Update refresh token in the database
    foundUser.refreshToken = newRefreshToken;
    await foundUser.save();

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
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
        role: "company", // Default role for new users
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
          expiresIn: "2 days",
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
        expiresIn: "2 days",
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
  const result = await User.create(payload);
  return result;
};

const EmailSendOTP = async (email: string) => {
  const user = await User.isUserExists(email);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "No User Found");
  }
  // Generate OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP
  await User.updateOne({ email }, { otp });
  // send email
};

const verifyEmailIntoDB = async (email: string, otp: string) => {
  const foundUser = await User.isUserExists(email.toLowerCase());
  if (!foundUser) {
    throw new AppError(httpStatus.NOT_FOUND, "Email is not correct");
  }

  // Check if the OTP matches
  if (foundUser.otp !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP!");
  }
  await User.updateOne({ email }, { authorized: true });
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

const resetPassword = async (
  payload: { email: string; newPassword: string },
  token: string
) => {
  const user = await User.isUserExists(payload?.email);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "This user is not found !");
  }

  const decoded = jwt.verify(
    token,
    config.jwt_access_secret as string
  ) as JwtPayload;

  if (payload.email !== decoded.email) {
    throw new AppError(httpStatus.FORBIDDEN, "You are forbidden!");
  }

  const newHashedPassword = await bcrypt.hash(
    payload.newPassword,
    Number(config.bcrypt_salt_rounds)
  );

  await User.findOneAndUpdate(
    { email: decoded.email, role: decoded.role },
    {
      password: newHashedPassword,
    }
  );
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
};
