import Tax from "../models/tax.model.js";
import { errorResponse, successResponse } from "../utils/response.js";

// Utility: generate recordId
const generateRecordId = () => Date.now().toString();

// ✅ Add Tax
export const addTax = async (req, res) => {
  try {
    const { identifier, rate } = req.body;

    if (!identifier) {
      return errorResponse(res, "Identifier is required", 400);
    }

    // Check duplicate identifier
    const existing = await Tax.findOne({ identifier });
    if (existing) {
      return errorResponse(res, "Identifier already exists", 400);
    }

    const newTax = await Tax.create({
      recordId: generateRecordId(),
      identifier,
      rate,
      status: true,
      creationTime: Date.now(),
      lastModified: Date.now(),
    });

    return successResponse(res, "Tax created successfully", newTax);
  } catch (error) {
    console.error("Add Tax Error:", error);
    return errorResponse(res, "Failed to create Tax", 500);
  }
};

// ✅ Edit Tax
export const editTax = async (req, res) => {
  try {
    const { recordId, identifier, rate, status } = req.body;

    if (!recordId) {
      return errorResponse(res, "recordId is required to edit Tax", 400);
    }

    const tax = await Tax.findOne({ recordId });
    if (!tax) {
      return errorResponse(res, "Tax not found", 404);
    }

    const updatedTax = await Tax.updateOne(
      { recordId },
      {
        identifier: identifier ?? tax.identifier,
        rate: rate ?? tax.rate,
        status: status ?? tax.status,
      }
    );

    return successResponse(res, "Tax updated successfully", updatedTax);
  } catch (error) {
    console.error("Edit Tax Error:", error);
    return errorResponse(res, "Failed to update Tax", 500);
  }
};

// ✅ Delete Tax
export const deleteTax = async (req, res) => {
  try {
    const { recordId } = req.body;

    if (!recordId) return errorResponse(res, "recordId is required", 400);

    const tax = await Tax.findOne({ recordId });
    if (!tax) return errorResponse(res, "Tax not found", 404);
    await Tax.deleteOne({ recordId });
    const deleted = tax;

    return successResponse(res, "Tax deleted successfully", deleted);
  } catch (error) {
    console.error("Delete Tax Error:", error);
    return errorResponse(res, "Failed to delete Tax", 500);
  }
};

// ✅ Get All Taxes
export const getAllTaxes = async (req, res) => {
  try {
    const taxes = await Tax.find({}, { sort: { creationTime: -1 } });

    return successResponse(res, "Taxes fetched successfully", taxes);
  } catch (error) {
    console.error("Get All Taxes Error:", error);
    return errorResponse(res, "Failed to fetch taxes", 500);
  }
};

// ✅ Get Tax by recordId
export const getTaxByRecordId = async (req, res) => {
  try {
    const { recordId } = req.body;
    if (!recordId) return errorResponse(res, "recordId is required", 400);

    const tax = await Tax.findOne({ recordId });
    if (!tax) return errorResponse(res, "Tax not found", 404);

    return successResponse(res, "Tax fetched successfully", tax);
  } catch (error) {
    console.error("Get Tax Error:", error);
    return errorResponse(res, "Failed to fetch Tax", 500);
  }
};

export const getTaxes = async (req, res) => {
  try {
    const taxes = await Tax.find();
    return successResponse(res, "Taxes fetched successfully", taxes);
  } catch (error) {
    console.error("Get All Taxes Error:", error);
    return errorResponse(res, "Failed to fetch taxes", 500);
  }
};
