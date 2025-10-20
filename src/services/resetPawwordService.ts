import nodemailer from "nodemailer";

export const sendPasswordResetEmail = async (email: string, code: string) => {

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "استعادة كلمة المرور - Password Reset",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">استعادة كلمة المرور 🔑</h2>
          <p>لقد طلبت استعادة كلمة المرور لحسابك. استخدم الكود التالي:</p>
          
          <div style="background: #fff3cd; padding: 15px; text-align: center; margin: 20px 0; border: 1px solid #ffeaa7;">
            <h1 style="color: #e74c3c; font-size: 32px; letter-spacing: 5px; margin: 0;">
              ${code}
            </h1>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            ⚠️ هذا الكود صالح لمدة 10 دقائق فقط<br>
            إذا لم تطلب استعادة كلمة المرور، يمكنك تجاهل هذه الرسالة
          </p>
          
          <div style="background: #f8f9fa; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #495057;">
              <strong>نصيحة أمنية:</strong> لا تشارك هذا الكود مع أي شخص
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            فريق التطبيق © ${new Date().getFullYear()}
          </p>
        </div>
      `,
    };
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

    await transporter.sendMail(mailOptions);
    console.log(`✅ تم إرسال كود استعادة كلمة المرور إلى: ${email}`);
  } catch (error) {
    console.error("❌ فشل في إرسال بريد استعادة كلمة المرور:", error);
    throw new Error("Failed to send password reset email");
  }
};