/* eslint-disable no-unused-vars */
import { Model, Types } from "mongoose";
import { USER_ROLE } from "./user.constant";

export interface BrowserInfo {
  name?: string;
  version?: string;
}

export interface OSInfo {
  name?: string;
  version?: string;
}

export interface DeviceInfo {
  model?: string;
  type?: string;
  vendor?: string;
}

export interface CPUInfo {
  architecture?: string;
}

export interface UserAgentInfo {
  browser?: BrowserInfo;
  os?: OSInfo;
  device?: DeviceInfo;
  cpu?: CPUInfo;
  ipAddress: string;
  macAddress: string;
  timestamp?: Date;
}


export interface TUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: "user" | "admin" | "company" | "creator" | "director";
  status: "block" | "active";
  company?: Types.ObjectId;
  colleagues?: Types.ObjectId[]; 
  isDeleted: boolean;
  authorized: boolean;
  
  address?: string;
  image?: string; 
  phone?: string;
  jobTitle?: string;
  bio?: string;     
  socialLinks?: string[];
  companyType?: string;
  companyWebsite?: string;
  heardAboutUs?: string;
  industryType?: string;
  numberOfEmployees?: string;
  googleUid?: string;
  otp?: string;
  refreshToken?: string;
  otpExpiry: Date;
  isUsed: boolean;
  companyEmail: string;
  isValided: boolean;
  userAgentInfo: UserAgentInfo[];
}

export interface UserModel extends Model<TUser> {
  //instance methods for checking if the user exist
  isUserExists(email: string): Promise<TUser>;
  //instance methods for checking if passwords are matched
  isPasswordMatched(
    plainTextPassword: string,
    hashedPassword: string
  ): Promise<boolean>;
  // isJWTIssuedBeforePasswordChanged(
  //   passwordChangedTimestamp: Date,
  //   jwtIssuedTimestamp: number,
  // ): boolean;
}

export type TUserRole = keyof typeof USER_ROLE;
