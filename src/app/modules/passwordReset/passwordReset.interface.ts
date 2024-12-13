import { Schema } from "mongoose";

export interface RequestOtpInput {
    email: string;
  }

export interface TValidateOtpInput {
    email: string;
    otp: string;
}

export interface TPasswordReset {
    userId: Schema.Types.ObjectId;
    otp: string;
    otpExpiry: Date;
    isUsed: boolean;
}