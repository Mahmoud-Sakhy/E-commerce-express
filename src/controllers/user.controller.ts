import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserModel from "../model/user.schema";


const JWT_SECRET = process.env.JWT_SECRET as string;


 export const register = async  (req: Request, res: Response) => {
    try {
    const { name, age, email, gender, password } = req.body;

    if (!name || !email || !password)
      return res
        .status(400)
        .json({ message: "Registration Failed - Missing fields" });

    if (name.length < 3)
      return res
        .status(400)
        .json({ message: "Name must be at least 3 characters" });

    if (age < 18)
      return res
        .status(400)
        .json({ message: "Age must be at least 18" });

    if (gender !== "male" && gender !== "female")
      return res
        .status(400)
        .json({ message: "Gender must be male or female" });

    if (password.length < 6)
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });

    const existingUser = await UserModel.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = bcrypt.hashSync(password, 10);

    const user = await UserModel.create({
      name,
      age,
      email,
      gender,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" } 
    );
  res.cookie("token",token,{
    httpOnly:true, // بتمنع الجافا استكربت استخدمها من المتصفح نفسه
    secure:false, //علشان استخدم اللوكل هوست لو عاوز  https اخليها true
      maxAge: 1000 * 60 * 60 * 24 * 7,  //سبع ايام

  })

    return res.status(201).json({
      message: "Registration Successful",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        gender: user.gender,
        createdAt: user.createdAt,
        token,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Registration Failed", error });
  }
}

 export const login = async  (req: Request, res: Response) => {
    try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
      res.cookie("token",token,{
    httpOnly:true, // بتمنع الجافا استكربت استخدمها من المتصفح نفسه
    secure:false, //علشان استخدم اللوكل هوست لو عاوز  https اخليها true
    maxAge: 1000 * 60 * 60 * 24 * 7,  //سبع ايام
  })


    return res.status(200).json({
      message: "Login Successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        gender: user.gender,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Login Failed", error });
  }

}
 export const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Logout Failed", error });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await UserModel.find().select("-password");
    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch users", error });
  }
};