import { z } from "zod";

const loginValidationSchema = z.object({
  body: z.object({
    email: z.string({ required_error: "Email is required." }),
    password: z.string({ required_error: "Password is required" }),
  }),
});

const forgetPasswordValidationSchema = z.object({
  body: z.object({
    email: z.string({
      required_error: "User email is required!",
    }),
  }),
});

const createUserValidationSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "User Name is Required" }),
    email: z.string({ required_error: "User Email is Required" }),
    password: z.string({ required_error: "Password required" }),
  }),
});

export const AuthValidations = {
  loginValidationSchema,
  forgetPasswordValidationSchema,
  createUserValidationSchema,
};
