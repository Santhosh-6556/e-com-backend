import User from "../models/user.model.js";
import { generateRecordId } from "../utils/recordId.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const addAddress = async (req, res) => {
  try {
    const userId = req.user.recordId;
    const {
      firstName,
      lastName,
      phone,
      email,
      line1,
      line2,
      city,
      state,
      country,
      isDefaultDelivery,
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      !phone ||
      !line1 ||
      !city ||
      !state ||
      !country
    ) {
      return errorResponse(res, "All required fields must be filled", 400);
    }

    const user = await User.findOne({ recordId: userId });
    if (!user) return errorResponse(res, "User not found", 404);

    if (isDefaultDelivery) {
      user.addresses.forEach((addr) => (addr.isDefaultDelivery = false));
    }

    const newAddress = {
      recordId: generateRecordId(),
      firstName,
      lastName,
      phone,
      email,
      line1,
      line2,
      city,
      state,
      country,
      isDefaultDelivery: !!isDefaultDelivery,
    };

    user.addresses.push(newAddress);
    await user.save();

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

    if (firstName) address.firstName = firstName;
    if (lastName) address.lastname = lastName;
    if (phone) address.phone = phone;
    if (email) address.email = email;
    if (line1) address.line1 = line1;
    if (line2) address.line2 = line2;
    if (city) address.city = city;
    if (state) address.state = state;
    if (country) address.country = country;

    if (isDefaultDelivery) {
      user.addresses.forEach((addr) => (addr.isDefaultDelivery = false));
      address.isDefaultDelivery = true;
    }

    await user.save();

    return successResponse(res, "Address updated successfully", address);
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

    const addressIndex = user.addresses.findIndex(
      (addr) => addr.recordId === recordId
    );
    if (addressIndex === -1)
      return errorResponse(res, "Address not found", 404);

    user.addresses.splice(addressIndex, 1);
    await user.save();

    return successResponse(res, "Address deleted successfully", user.addresses);
  } catch (err) {
    console.error("DeleteAddress Error:", err);
    return errorResponse(res, "Failed to delete address", 500);
  }
};
