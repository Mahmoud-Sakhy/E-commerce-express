// controllers/user.controller.ts
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserModel from "../model/user.schema";
import { sendVerificationEmail } from "../services/emailService";

const JWT_SECRET = process.env.JWT_SECRET as string;

// دالة إنشاء كود التحقق
const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, age, email, gender, password, role } = req.body;

    // التحقق من الحقول المطلوبة
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "الحقول التالية مطلوبة: الاسم، البريد الإلكتروني، كلمة المرور" 
      });
    }

    if (name.length < 3) {
      return res.status(400).json({ 
        success: false,
        message: "الاسم يجب أن يكون至少 3 أحرف" 
      });
    }

    if (age < 18) {
      return res.status(400).json({ 
        success: false,
        message: "العمر يجب أن يكون 18 سنة على الأقل" 
      });
    }

    if (gender !== "male" && gender !== "female") {
      return res.status(400).json({ 
        success: false,
        message: "الجنس يجب أن يكون ذكر أو أنثى" 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: "كلمة المرور يجب أن تكون至少 6 أحرف" 
      });
    }

    // التحقق من وجود المستخدم
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "المستخدم موجود بالفعل" 
      });
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);

    // إنشاء المستخدم
    const user = await UserModel.create({
      name,
      age,
      email,
      gender,
      password: hashedPassword,
      role,
      verificationCode,
      verificationCodeExpires,
      isVerified: false
    });

    // إرسال كود التحقق بشكل غير متزامن
    sendVerificationEmail(email, verificationCode).catch(console.error);

    return res.status(201).json({
      success: true,
      message: "تم التسجيل بنجاح! يرجى تفعيل حسابك باستخدام الكود المرسل إلى بريدك الإلكتروني",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("خطأ في التسجيل:", error);
    return res.status(500).json({ 
      success: false,
      message: "فشل في عملية التسجيل" 
    });
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "البريد الإلكتروني وكلمة المرور مطلوبان" 
      });
    }

    // جلب المستخدم مع الحقول المطلوبة فقط
    const user = await UserModel.findOne({ email })
      .select("+password +isVerified"); // + لأن password محجوب افتراضياً

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" 
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({ 
        success: false,
        message: "الحساب غير مفعل. يرجى تفعيل حسابك أولاً" 
      });
    }

    // التحقق من كلمة المرور
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" 
      });
    }

    // إنشاء التوكن
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        name: user.name, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // تعيين الكوكي
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // سبع أيام
    });

    return res.status(200).json({
      success: true,
      message: "تم تسجيل الدخول بنجاح",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          gender: user.gender,
          role: user.role,
          createdAt: user.createdAt,
        },
        token
      },
    });
  } catch (error) {
    console.error("خطأ في تسجيل الدخول:", error);
    return res.status(500).json({ 
      success: false,
      message: "فشل في تسجيل الدخول" 
    });
  }
}

export const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "تم تسجيل الخروج بنجاح",
    });
  } catch (error) {
    console.error("خطأ في تسجيل الخروج:", error);
    return res.status(500).json({ 
      success: false, 
      message: "فشل في تسجيل الخروج" 
    });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // استخدام projection بدلاً من select للأداء
    const users = await UserModel.find(
      {}, 
      { password: 0, verificationCode: 0, verificationCodeExpires: 0 }
    ).lean(); // lean() للحصول على كائنات JavaScript عادية (أسرع)

    return res.status(200).json({
      success: true,
      data: {
        users,
        count: users.length
      }
    });
  } catch (error) {
    console.error("خطأ في جلب المستخدمين:", error);
    return res.status(500).json({ 
      success: false, 
      message: "فشل في جلب بيانات المستخدمين" 
    });
  }
};