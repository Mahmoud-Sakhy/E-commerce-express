// controllers/verification.controller.ts
import type { Request, Response } from "express";
import UserModel from "../model/user.schema";
import { sendVerificationEmail } from "../services/emailService";

// دالة إنشاء كود تحقق عشوائي
const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendVerificationCode = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: "البريد الإلكتروني مطلوب" 
      });
    }

    // استخدام select لتحديد الحقول المطلوبة فقط
    const user = await UserModel.findOne({ email })
      .select("isVerified verificationCode verificationCodeExpires");

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "المستخدم غير موجود" 
      });
    }

    if (user.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: "الحساب مفعل بالفعل" 
      });
    }

    // إنشاء كود تحقق جديد
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 دقيقة

    // تحديث الحقول المطلوبة فقط
    await UserModel.updateOne(
      { email },
      { 
        verificationCode, 
        verificationCodeExpires 
      }
    );

    // إرسال البريد الإلكتروني بشكل غير متزامن
    sendVerificationEmail(email, verificationCode).catch(console.error);

    return res.status(200).json({
      success: true,
      message: "تم إرسال كود التحقق إلى بريدك الإلكتروني",
    });
  } catch (error) {
    console.error("خطأ في إرسال كود التحقق:", error);
    return res.status(500).json({ 
      success: false, 
      message: "فشل في إرسال كود التحقق" 
    });
  }
};

// التحقق من الكود
export const verifyCode = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ 
        success: false, 
        message: "البريد الإلكتروني والكود مطلوبان" 
      });
    }

    const user = await UserModel.findOne({ email })
      .select("isVerified verificationCode verificationCodeExpires");

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "المستخدم غير موجود" 
      });
    }

    // التحقق من صحة الكود وتاريخ انتهائه
    if (user.verificationCode !== code) {
      return res.status(400).json({ 
        success: false, 
        message: "كود التحقق غير صحيح" 
      });
    }

    if (user.verificationCodeExpires && user.verificationCodeExpires < new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: "كود التحقق منتهي الصلاحية" 
      });
    }

    // تفعيل الحساب
    await UserModel.updateOne(
      { email },
      { 
        isVerified: true,
        verificationCode: undefined,
        verificationCodeExpires: undefined
      }
    );

    return res.status(200).json({
      success: true,
      message: "تم تفعيل الحساب بنجاح",
    });
  } catch (error) {
    console.error("خطأ في تفعيل الحساب:", error);
    return res.status(500).json({ 
      success: false, 
      message: "فشل في تفعيل الحساب" 
    });
  }
};