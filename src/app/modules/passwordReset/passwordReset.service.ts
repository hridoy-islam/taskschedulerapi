import { User } from "../user/user.model";
import { PasswordReset } from "./passwordReset.model";
import moment from 'moment';
import jwt from "jsonwebtoken";
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import config from "../../config";
import { sendEmail } from "../../utils/sendEmail";

const requestOtp = async (email: string) => {
  const foundUser = await User.isUserExists(email);
  if (!foundUser) {
    throw new AppError(httpStatus.NOT_FOUND, "Email is not correct");
  }

  // Step 1: Delete all previous unused OTPs for this user
  await PasswordReset.deleteMany({
    userId: foundUser._id,
  });

  const otp = Math.floor(1000 + Math.random() * 9000).toString(); // Generate 4-digit OTP
  const otpExpiry = moment().add(10, 'minutes').toDate(); // Set expiry to 10 minutes from now

  await PasswordReset.create({
    userId: foundUser._id,
    otp,
    otpExpiry,
    isUsed: false,
  });

  const emailSubject = 'Your Password Reset OTP';
  //   const emailBody = `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`;

  await sendEmail(email, 'reset_password_template', emailSubject, foundUser.name, otp);
};



const validateOtp = async (email: string, otp: string) => {
  const foundUser = await User.isUserExists(email.toLowerCase());
  if (!foundUser) {
    console.log('User not found for email:', email);
    throw new AppError(httpStatus.NOT_FOUND, "Email is not correct");
  }

  const passwordReset = await PasswordReset.findOne({
    userId: foundUser._id,
    isUsed: false,
  })

  

  if (!passwordReset || passwordReset.otp !== otp) {
    throw new AppError(httpStatus.NOT_FOUND, "Invalid OTP");
  }

  // Check OTP expiry using moment
  if (moment(passwordReset.otpExpiry).isBefore(moment())) {
    console.log('OTP Expired. Expiry Time:', passwordReset.otpExpiry, 'Current Time:', moment().toDate());
    throw new AppError(httpStatus.NOT_FOUND, "Expired OTP");
  }

  // Mark OTP as used
  passwordReset.isUsed = true;
  await passwordReset.save();

  const resetToken = jwt.sign(
    {
      _id: foundUser._id.toString(),
      email: foundUser.email,
      name: foundUser.name,
      role: foundUser.role,
    },
    `${config.jwt_access_secret}`,
    { expiresIn: "10m" }
  );
  // send email
  await sendEmail(email, 'validated_otp_template', "OTP Validated Successfully", foundUser.name);
  return { resetToken };
};




export const PasswordResetServices = {
  requestOtp,
  validateOtp
}
