import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import { errorResponse, successResponse } from "../utils/response.js";
import { generateToken } from "../utils/jwt.js";
import { generateRecordId } from "../utils/recordId.js";
import { sendEmail } from "../utils/mailer.js";

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

export const login = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, "Email is required", 400);
    }

    if (email === ADMIN_CREDENTIALS.email) {
      return successResponse(res, "Admin login detected", {
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
        res,
        "Please wait 30 seconds before requesting a new OTP",
        429
      );
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 3 * 60 * 1000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    user.otpLastSent = new Date();
    user.otpAttempts = 0;
    await user.save();

    try {
      await sendEmail(email, otp);
      console.log(`OTP sent to ${email}: ${otp}`);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      return errorResponse(res, "Failed to send OTP email", 500);
    }

    return successResponse(res, "OTP sent successfully", {
      email: email,
      isAdmin: false,
      message: "OTP sent to your email",
      canResendAfter: 30,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return errorResponse(res, "Something went wrong", 500);
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, "Email is required", 400);
    }

    const user = await User.findOne({ email });

    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    if (!canResendOTP(user)) {
      const timeSinceLastOTP =
        Date.now() - new Date(user.otpLastSent).getTime();
      const remainingTime = Math.ceil((30 * 1000 - timeSinceLastOTP) / 1000);

      return errorResponse(
        res,
        `Please wait ${remainingTime} seconds before requesting a new OTP`,
        429
      );
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 3 * 60 * 1000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    user.otpLastSent = new Date();
    user.otpAttempts = 0;
    await user.save();

    try {
      await sendEmail(email, otp);
      console.log(`Resent OTP to ${email}: ${otp}`);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      return errorResponse(res, "Failed to send OTP email", 500);
    }

    return successResponse(res, "OTP resent successfully", {
      email: email,
      message: "New OTP sent to your email",
      canResendAfter: 30,
    });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    return errorResponse(res, "Something went wrong", 500);
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return errorResponse(res, "Email and OTP are required", 400);
    }

    const user = await User.findOne({ email });

    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    if (user.otpExpires && new Date() > user.otpExpires) {
      return errorResponse(
        res,
        "OTP has expired. Please request a new one.",
        400
      );
    }

    const MAX_OTP_ATTEMPTS = 5;
    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      return errorResponse(
        res,
        "Too many invalid OTP attempts. Please request a new OTP.",
        429
      );
    }

    if (user.otp !== otp) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();

      const remainingAttempts = MAX_OTP_ATTEMPTS - user.otpAttempts;
      return errorResponse(
        res,
        `Invalid OTP. ${remainingAttempts} attempts remaining.`,
        400
      );
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    user.otpLastSent = undefined;
    user.otpAttempts = 0;
    await user.save();

    const token = generateToken({
      email: user.email,
      role: user.role,
      recordId: user.recordId,
    });

    return successResponse(res, "Login successful", {
      jwtToken: token,
      user: {
        recordId: user.recordId,
        id: user._id,
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
    return errorResponse(res, "Something went wrong", 500);
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, "Email and password are required", 400);
    }

    if (
      email !== ADMIN_CREDENTIALS.email ||
      password !== ADMIN_CREDENTIALS.password
    ) {
      return errorResponse(res, "Invalid admin credentials", 401);
    }

    let adminUser = await User.findOne({ email: ADMIN_CREDENTIALS.email });

    if (!adminUser) {
      adminUser = await User.create({
        recordId: generateRecordId(),
        email: ADMIN_CREDENTIALS.email,
        name: "Admin",
        role: "admin",
        password: await bcrypt.hash(ADMIN_CREDENTIALS.password, 10),
        isActive: true,
      });
    }

    const token = generateToken({
      email: adminUser.email,
      role: adminUser.role,
      recordId: adminUser.recordId,
    });

    return successResponse(res, "Admin login successful", {
      jwtToken: token,
      user: {
        recordId: adminUser.recordId,
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        createdAt: adminUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Admin Login Error:", error);
    return errorResponse(res, "Something went wrong", 500);
  }
};
