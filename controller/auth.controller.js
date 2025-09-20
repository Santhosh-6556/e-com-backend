import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import { errorResponse, successResponse } from "../utils/response.js";
import { generateToken } from "../utils/jwt.js";
import { generateRecordId } from "../utils/recordId.js";

export const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, addresses ,confirmPassword} = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, "User already exists with this email", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      recordId:generateRecordId(),
      name,
      email,
      password: hashedPassword,   
      role,
      phone,
      addresses,
      confirmPassword
    });

    return successResponse(res, "User registered successfully", {
      recordId:newUser.recordId,
      confirmPassword : newUser.confirmPassword,
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      phone: newUser.phone,
      addresses: newUser.addresses,
      createdAt: newUser.createdAt,
    });
  } catch (error) {
    console.error("Register Error:", error);
    return errorResponse(res, "Something went wrong", 500);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return errorResponse(res, "Invalid credentials", 401);
    }

    if (user.role !== "admin") {
      return errorResponse(res, "Access denied. Only admin can login", 403);
    }

    const token = generateToken({ email: user.email, role: user.role });

    return res.status(200).json({
      jwtToken: token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return errorResponse(res, "Server error", 500);
  }
};
