import { Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId | string;
  name: string;
  age: number;
  email: string;
  gender: "male" | "female";
  password: string;
  role?: string;
  isVerified?: boolean;
  verificationCode?: string;
  verificationCodeExpires?: Date;
  resetPasswordCode?: string; 
  resetPasswordCodeExpires?: Date; 
  createdAt?: Date;
}