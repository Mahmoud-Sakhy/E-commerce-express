// controllers/password.controller.ts
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import UserModel from "../model/user.schema";
import { sendPasswordResetEmail } from "../services/resetPawwordService";

// دالة إنشاء كود استعادة
const generateResetCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// طلب استعادة كلمة المرور
export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: "البريد الإلكتروني مطلوب" 
      });
    }

    // البحث عن المستخدم
    const user = await UserModel.findOne({ email });
    if (!user) {
      // لأسباب أمنية، لا نخبر المستخدم بأن الإيميل غير موجود
      return res.status(200).json({
        success: true,
        message: "إذا كان هذا البريد الإلكتروني مسجلاً، سيصلك كود الاستعادة"
      });
    }

    // التحقق من أن الحساب مفعل
    if (!user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "الحساب غير مفعل. يرجى تفعيل الحساب أولاً"
      });
    }

    // إنشاء كود استعادة جديد
    const resetCode = generateResetCode();
    const resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 دقائق

    // حفظ الكود في قاعدة البيانات
    await UserModel.updateOne(
      { email },
      { 
        resetPasswordCode: resetCode,
        resetPasswordCodeExpires: resetCodeExpires
      }
    );

    // إرسال البريد الإلكتروني بشكل غير متزامن
    sendPasswordResetEmail(email, resetCode).catch(console.error);

    return res.status(200).json({
      success: true,
      message: "إذا كان هذا البريد الإلكتروني مسجلاً، سيصلك كود الاستعادة"
    });
  } catch (error) {
    console.error("خطأ في طلب استعادة كلمة المرور:", error);
    return res.status(500).json({ 
      success: false, 
      message: "فشل في عملية استعادة كلمة المرور" 
    });
  }
};

// التحقق من كود الاستعادة
export const verifyResetCode = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ 
        success: false, 
        message: "البريد الإلكتروني والكود مطلوبان" 
      });
    }

    const user = await UserModel.findOne({ email })
      .select("resetPasswordCode resetPasswordCodeExpires");

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "المستخدم غير موجود" 
      });
    }

    // التحقق من صحة الكود وتاريخ انتهائه
    if (user.resetPasswordCode !== code) {
      return res.status(400).json({ 
        success: false, 
        message: "كود الاستعادة غير صحيح" 
      });
    }

    if (user.resetPasswordCodeExpires && user.resetPasswordCodeExpires < new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: "كود الاستعادة منتهي الصلاحية" 
      });
    }

    return res.status(200).json({
      success: true,
      message: "كود الاستعادة صحيح"
    });
  } catch (error) {
    console.error("خطأ في التحقق من كود الاستعادة:", error);
    return res.status(500).json({ 
      success: false, 
      message: "فشل في التحقق من كود الاستعادة" 
    });
  }
};

// تغيير كلمة المرور
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "جميع الحقول مطلوبة" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: "كلمة المرور يجب أن تكون至少 6 أحرف" 
      });
    }

    const user = await UserModel.findOne({ email })
      .select("resetPasswordCode resetPasswordCodeExpires");

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "المستخدم غير موجود" 
      });
    }

    // التحقق من صحة الكود وتاريخ انتهائه
    if (user.resetPasswordCode !== code) {
      return res.status(400).json({ 
        success: false, 
        message: "كود الاستعادة غير صحيح" 
      });
    }

    if (user.resetPasswordCodeExpires && user.resetPasswordCodeExpires < new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: "كود الاستعادة منتهي الصلاحية" 
      });
    }

    // تشفير كلمة المرور الجديدة
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // تحديث كلمة المرور وإزالة كود الاستعادة
    await UserModel.updateOne(
      { email },
      { 
        password: hashedPassword,
        resetPasswordCode: undefined,
        resetPasswordCodeExpires: undefined
      }
    );

    return res.status(200).json({
      success: true,
      message: "تم تغيير كلمة المرور بنجاح"
    });
  } catch (error) {
    console.error("خطأ في تغيير كلمة المرور:", error);
    return res.status(500).json({ 
      success: false, 
      message: "فشل في تغيير كلمة المرور" 
    });
  }
};