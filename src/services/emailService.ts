// utils/emailService.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email: string, code: string) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "كود تحقق حسابك - Verification Code",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">مرحباً بك! 👋</h2>
          <p>شكراً لتسجيلك في تطبيقنا. استخدم الكود التالي لتفعيل حسابك:</p>
          
          <div style="background: #f4f4f4; padding: 15px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px; margin: 0;">
              ${code}
            </h1>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            ⚠️ هذا الكود صالح لمدة 15 دقيقة فقط<br>
            إذا لم تطلب هذا الكود، يمكنك تجاهل هذه الرسالة
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            فريق التطبيق © ${new Date().getFullYear()}
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ تم إرسال كود التحقق إلى: ${email}`);
  } catch (error) {
    console.error("❌ فشل في إرسال البريد:", error);
    throw new Error("Failed to send verification email");
  }
};