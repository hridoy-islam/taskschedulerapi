/* eslint-disable @typescript-eslint/no-this-alias */
import { Schema, model } from "mongoose";
import { TPasswordReset } from "./passwordReset.interface";

const passwordResetSchema = new Schema<TPasswordReset>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    otp: {
        type: String,
        required: true,
    },
    otpExpiry : {
        type: Date,
        required: true,
    },
    isUsed: {
        type: Boolean,
        default: false,
    }
  },
  {
    timestamps: true,
  }
);

export const PasswordReset = model<TPasswordReset>("passwordReset", passwordResetSchema);
