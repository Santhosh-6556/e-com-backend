import User from "../models/user.model.js";
import { errorResponse, successResponse } from "../utils/response.js";
import { generateToken } from "../utils/jwt.js";
import { generateRecordId } from "../utils/recordId.js";
import { sendEmail } from "../utils/mailer.js";

const hashPassword = async (password) => {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } else {
    try {
      const bcrypt = await import("bcrypt");
      return await bcrypt.hash(password, 10);
    } catch (e) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  }
};

const ADMIN_CREDENTIALS = {
  email: "admin@gmail.com",
  password: "welcome12345",
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const canResendOTP = (user) => {
  if (!user.otpLastSent) return true;

  const timeSinceLastOTP = Date.now() - new Date(user.otpLastSent).getTime();
  const OTP_COOLDOWN = 30 * 1000;

  return timeSinceLastOTP > OTP_COOLDOWN;
};

export const login = async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return errorResponse(c, "Email is required", 400);
    }

    if (email === ADMIN_CREDENTIALS.email) {
      return successResponse(c, "Admin login detected", {
        isAdmin: true,
        email: email,
      });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        recordId: generateRecordId(),
        email: email,
        role: "user",
        isActive: true,
      });
    }

    if (!canResendOTP(user)) {
      return errorResponse(
        c,
        "Please wait 30 seconds before requesting a new OTP",
        429
      );
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 3 * 60 * 1000);

    await User.updateOne(
      { recordId: user.recordId },
      {
        otp,
        otpExpires,
        otpLastSent: new Date(),
        otpAttempts: 0,
      }
    );

    try {
      await sendEmail(email, otp);
      console.log(`OTP sent to ${email}: ${otp}`);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      return errorResponse(c, "Failed to send OTP email", 500);
    }

    return successResponse(c, "OTP sent successfully", {
      email: email,
      isAdmin: false,
      message: "OTP sent to your email",
      canResendAfter: 30,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return errorResponse(c, "Something went wrong", 500);
  }
};

export const resendOTP = async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return errorResponse(c, "Email is required", 400);
    }

    const user = await User.findOne({ email });

    if (!user) {
      return errorResponse(c, "User not found", 404);
    }

    if (!canResendOTP(user)) {
      const timeSinceLastOTP =
        Date.now() - new Date(user.otpLastSent).getTime();
      const remainingTime = Math.ceil((30 * 1000 - timeSinceLastOTP) / 1000);

      return errorResponse(
        c,
        `Please wait ${remainingTime} seconds before requesting a new OTP`,
        429
      );
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 3 * 60 * 1000);

    await User.updateOne(
      { recordId: user.recordId },
      {
        otp,
        otpExpires,
        otpLastSent: new Date(),
        otpAttempts: 0,
      }
    );

    try {
      await sendEmail(email, otp);
      console.log(`Resent OTP to ${email}: ${otp}`);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      return errorResponse(c, "Failed to send OTP email", 500);
    }

    return successResponse(c, "OTP resent successfully", {
      email: email,
      message: "New OTP sent to your email",
      canResendAfter: 30,
    });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    return errorResponse(c, "Something went wrong", 500);
  }
};

export const verifyOTP = async (c) => {
  try {
    const { email, otp } = await c.req.json();

    if (!email || !otp) {
      return errorResponse(c, "Email and OTP are required", 400);
    }

    const user = await User.findOne({ email });

    if (!user) {
      return errorResponse(c, "User not found", 404);
    }

    if (user.otpExpires && new Date() > user.otpExpires) {
      return errorResponse(
        c,
        "OTP has expired. Please request a new one.",
        400
      );
    }

    const MAX_OTP_ATTEMPTS = 5;
    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      return errorResponse(
        c,
        "Too many invalid OTP attempts. Please request a new OTP.",
        429
      );
    }

    if (user.otp !== otp) {
      const newAttempts = (user.otpAttempts || 0) + 1;
      await User.updateOne(
        { recordId: user.recordId },
        {
          otpAttempts: newAttempts,
        }
      );
      user.otpAttempts = newAttempts;

      const remainingAttempts = MAX_OTP_ATTEMPTS - user.otpAttempts;
      return errorResponse(
        c,
        `Invalid OTP. ${remainingAttempts} attempts remaining.`,
        400
      );
    }

    await User.updateOne(
      { recordId: user.recordId },
      {
        otp: null,
        otpExpires: null,
        otpLastSent: null,
        otpAttempts: 0,
      }
    );

    const token = generateToken({
      email: user.email,
      role: user.role,
      recordId: user.recordId,
    });

    return successResponse(c, "Login successful", {
      jwtToken: token,
      user: {
        recordId: user.recordId,
        id: user.recordId,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        addresses: user.addresses,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return errorResponse(c, "Something went wrong", 500);
  }
};

export const adminLogin = async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return errorResponse(c, "Email and password are required", 400);
    }

    if (
      email !== ADMIN_CREDENTIALS.email ||
      password !== ADMIN_CREDENTIALS.password
    ) {
      return errorResponse(c, "Invalid admin credentials", 401);
    }

    let adminUser = await User.findOne({ email: ADMIN_CREDENTIALS.email });

    if (!adminUser) {
      adminUser = await User.create({
        recordId: generateRecordId(),
        email: ADMIN_CREDENTIALS.email,
        name: "Admin",
        role: "admin",
        password: await hashPassword(ADMIN_CREDENTIALS.password),
        isActive: true,
      });
    }

    const token = generateToken({
      email: adminUser.email,
      role: adminUser.role,
      recordId: adminUser.recordId,
    });

    return successResponse(c, "Admin login successful", {
      jwtToken: token,
      user: {
        recordId: adminUser.recordId,
        id: adminUser.recordId,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        createdAt: adminUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Admin Login Error:", error);
    return errorResponse(c, "Something went wrong", 500);
  }
};
