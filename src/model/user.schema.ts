// model/user.schema.ts
import mongoose, { Schema } from "mongoose";
import { IUser } from "../types/user.type";

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    email: { type: String, required: true, unique: true },
    gender: { type: String, enum: ["male", "female"], default: "male" },
    password: { type: String, required: true },
    role: {
      type: String, 
      enum: ['user', 'admin'],
      default: "user"
    },
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationCodeExpires: { type: Date },
    resetPasswordCode: { type: String },
    resetPasswordCodeExpires: { type: Date } 
  },
  { timestamps: true }
);
const UserModel = mongoose.model<IUser>("User", userSchema);
export default UserModel;