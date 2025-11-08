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

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const canResendOTP = (user) => {
  if (!user.otpLastSent) return true;
  const timeSinceLastOTP = Date.now() - new Date(user.otpLastSent).getTime();
  const OTP_COOLDOWN = 30 * 1000;
  return timeSinceLastOTP > OTP_COOLDOWN;
};

/**
 * 🔹 Login (Generate OTP)
 */
export const login = async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email) return errorResponse(c, "Email is required", 400);

    if (email === ADMIN_CREDENTIALS.email) {
      return successResponse(c, "Admin login detected", {
        isAdmin: true,
        email,
      });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        recordId: generateRecordId(),
        email,
        role: "user",
        isActive: true,
      });
    }

    if (!canResendOTP(user))
      return errorResponse(c, "Please wait 30 seconds before requesting a new OTP", 429);

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 3 * 60 * 1000);

    await User.updateOne({ recordId: user.recordId }, {
      otp,
      otpExpires,
      otpLastSent: new Date(),
      otpAttempts: 0,
    });

    await sendEmail(email, otp);
    console.log(`OTP sent to ${email}: ${otp}`);

    return successResponse(c, "OTP sent successfully", {
      email,
      message: "OTP sent to your email",
      canResendAfter: 30,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return errorResponse(c, "Something went wrong", 500);
  }
};

/**
 * 🔹 Resend OTP
 */
export const resendOTP = async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email) return errorResponse(c, "Email is required", 400);

    const user = await User.findOne({ email });
    if (!user) return errorResponse(c, "User not found", 404);
    if (!canResendOTP(user)) {
      const remainingTime = Math.ceil(
        (30 * 1000 - (Date.now() - new Date(user.otpLastSent).getTime())) / 1000
      );
      return errorResponse(
        c,
        `Please wait ${remainingTime} seconds before requesting a new OTP`,
        429
      );
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 3 * 60 * 1000);

    await User.updateOne({ recordId: user.recordId }, {
      otp,
      otpExpires,
      otpLastSent: new Date(),
      otpAttempts: 0,
    });

    await sendEmail(email, otp);
    console.log(`Resent OTP to ${email}: ${otp}`);

    return successResponse(c, "OTP resent successfully", {
      email,
      message: "New OTP sent to your email",
      canResendAfter: 30,
    });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    return errorResponse(c, "Something went wrong", 500);
  }
};

/**
 * 🔹 Verify OTP and generate JWT
 */
export const verifyOTP = async (c) => {
  try {
    const { email, otp } = await c.req.json();
    if (!email || !otp) return errorResponse(c, "Email and OTP are required", 400);

    const user = await User.findOne({ email });
    if (!user) return errorResponse(c, "User not found", 404);

    if (user.otpExpires && new Date() > user.otpExpires)
      return errorResponse(c, "OTP has expired. Please request a new one.", 400);

    if (user.otp !== otp) {
      const attempts = (user.otpAttempts || 0) + 1;
      await User.updateOne({ recordId: user.recordId }, { otpAttempts: attempts });
      const remaining = 5 - attempts;
      return errorResponse(c, `Invalid OTP. ${remaining} attempts remaining.`, 400);
    }

    await User.updateOne({ recordId: user.recordId }, {
      otp: null,
      otpExpires: null,
      otpLastSent: null,
      otpAttempts: 0,
    });

    const token = generateToken({
      email: user.email,
      role: user.role,
      recordId: user.recordId,
    }, "7d", c.env);

    return successResponse(c, "Login successful", {
      jwtToken: token,
      user: {
        recordId: user.recordId,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return errorResponse(c, "Something went wrong", 500);
  }
};

/**
 * 🔹 Admin Login (no DB required)
 */
export const adminLogin = async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password)
      return errorResponse(c, "Email and password are required", 400);

    if (email !== ADMIN_CREDENTIALS.email || password !== ADMIN_CREDENTIALS.password)
      return errorResponse(c, "Invalid admin credentials", 401);

    let adminUser = null;
    try {
      adminUser = await User.findOne({ email });
    } catch {
      console.warn("[WARN] Skipping DB check — likely running without D1.");
    }

    if (!adminUser) {
      adminUser = {
        recordId: "admin-0001",
        name: "Admin",
        email,
        role: "admin",
      };
    }

    const token = generateToken({
      email: adminUser.email,
      role: adminUser.role,
      recordId: adminUser.recordId,
    }, "7d", c.env);

    return successResponse(c, "Admin login successful", {
      jwtToken: token,
      user: adminUser,
    });
  } catch (error) {
    console.error("Admin Login Error:", error);
    return errorResponse(c, "Something went wrong", 500);
  }
};
