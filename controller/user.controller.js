import User from "../models/user.model.js";
import { generateRecordId } from "../utils/recordId.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.recordId; // from auth middleware

    const user = await User.findOne({ recordId: userId });
    if (!user) return errorResponse(res, "User not found", 404);

    // Return the full user document
    return successResponse(res, "User retrieved successfully", user);
  } catch (err) {
    console.error("GetUserProfile Error:", err);
    return errorResponse(res, "Failed to get user profile", 500);
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    // const userId = req.user.recordId;
    const { name, email, phone, dob, recordId } = req.body;

    const user = await User.findOne({ recordId: recordId });
    if (!user) return errorResponse(res, "User not found", 404);

    // Update only the provided fields
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (dob) updateData.dob = dob;

    const updatedUser = await User.updateOne(
      { recordId: recordId },
      updateData
    );

    return successResponse(res, "Profile updated successfully", {
      recordId: updatedUser.recordId,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      dob: updatedUser.dob,
    });
  } catch (err) {
    console.error("UpdateUserProfile Error:", err);
    return errorResponse(res, "Failed to update profile", 500);
  }
};

export const addAddress = async (req, res) => {
  try {
    const userId = req.user.recordId;
    const {
      firstName,
      lastName,
      phone,
      email,
      addressType,
      line1,
      line2,
      city,
      state,
      country,
      pinCode,
      isDefaultDelivery,
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      !phone ||
      !addressType ||
      !line1 ||
      !city ||
      !state ||
      !country ||
      !pinCode
    ) {
      return errorResponse(res, "All required fields must be filled", 400);
    }

    const user = await User.findOne({ recordId: userId });
    if (!user) return errorResponse(res, "User not found", 404);

    const newAddress = {
      recordId: generateRecordId(),
      firstName,
      lastName,
      phone,
      email,
      addressType,
      line1,
      line2,
      city,
      state,
      country,
      pinCode,
      isDefaultDelivery: !!isDefaultDelivery,
    };

    await User.addAddress(userId, newAddress);

    return successResponse(res, "Address added successfully", newAddress);
  } catch (err) {
    console.error("AddAddress Error:", err);
    return errorResponse(res, "Failed to add address", 500);
  }
};

export const getAddresses = async (req, res) => {
  try {
    const userId = req.user.recordId;
    const user = await User.findOne({ recordId: userId });
    if (!user) return errorResponse(res, "User not found", 404);

    return successResponse(
      res,
      "Addresses retrieved successfully",
      user.addresses
    );
  } catch (err) {
    console.error("GetAddresses Error:", err);
    return errorResponse(res, "Failed to get addresses", 500);
  }
};

export const updateAddress = async (req, res) => {
  try {
    const userId = req.user.recordId;
    const {
      recordId,
      firstName,
      lastName,
      phone,
      email,
      pinCode,
      addressType,
      line1,
      line2,
      city,
      state,
      country,
      isDefaultDelivery,
    } = req.body;

    if (!recordId) {
      return errorResponse(res, "Address recordId is required", 400);
    }

    const user = await User.findOne({ recordId: userId });
    if (!user) return errorResponse(res, "User not found", 404);

    const address = user.addresses.find((addr) => addr.recordId === recordId);
    if (!address) return errorResponse(res, "Address not found", 404);

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (email) updateData.email = email;
    if (addressType) updateData.addressType = addressType;
    if (pinCode) updateData.pinCode = pinCode;
    if (line1) updateData.line1 = line1;
    if (line2) updateData.line2 = line2;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (country) updateData.country = country;
    if (isDefaultDelivery !== undefined)
      updateData.isDefaultDelivery = isDefaultDelivery;

    await User.updateAddress(userId, recordId, updateData);
    const updatedUser = await User.findOne({ recordId: userId });
    const updatedAddress = updatedUser.addresses.find(
      (addr) => addr.recordId === recordId
    );

    return successResponse(res, "Address updated successfully", updatedAddress);
  } catch (err) {
    console.error("UpdateAddress Error:", err);
    return errorResponse(res, "Failed to update address", 500);
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.recordId;
    const { recordId } = req.body;

    if (!recordId)
      return errorResponse(res, "Address recordId is required", 400);

    const user = await User.findOne({ recordId: userId });
    if (!user) return errorResponse(res, "User not found", 404);

    const address = user.addresses.find((addr) => addr.recordId === recordId);
    if (!address) return errorResponse(res, "Address not found", 404);

    await User.deleteAddress(userId, recordId);
    const updatedUser = await User.findOne({ recordId: userId });

    return successResponse(
      res,
      "Address deleted successfully",
      updatedUser.addresses
    );
  } catch (err) {
    console.error("DeleteAddress Error:", err);
    return errorResponse(res, "Failed to delete address", 500);
  }
};
