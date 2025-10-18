import mongoose, { Schema } from "mongoose";
import { IUser } from "../types/user.type";


const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    email: { type: String, required: true, unique: true },
    gender: { type: String, enum: ["male", "female"], default: "male" },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

const UserModel = mongoose.model<IUser>("User", userSchema);
export default UserModel;
