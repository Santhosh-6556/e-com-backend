import nodemailer from "nodemailer";

export const sendEmail = async (email, otp, isResend = false) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const subject = isResend
      ? "Your New OTP Code - SBV App"
      : "Your OTP Code - SBV App";
    const message = isResend ? "New OTP code" : "OTP code";

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${subject}</h2>
          <p style="font-size: 16px;">Use the following ${message} to login to your account:</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <h1 style="margin: 0; color: #333; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p style="font-size: 14px; color: #666;">
            This OTP will expire in 10 minutes. 
            ${isResend ? "This is your new OTP code." : ""}
          </p>
          <p style="font-size: 12px; color: #999;">
            If you didn't request this, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999;">SBV App Team</p>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email}:`, result.messageId);
    return true;
  } catch (error) {
    console.error("Email sending error:", error);
    throw new Error("Failed to send email");
  }
};
