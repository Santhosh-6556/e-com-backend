import FAQ from "../models/faq.model.js";
import { successResponse, errorResponse } from "../utils/response.js";

// Utility to generate recordId
const generateRecordId = () => Date.now().toString();

// ✅ Add FAQ
export const addFAQ = async (req, res) => {
  try {
    const { identifier, question, answer } = req.body;

    if (!identifier || !question || !answer) {
      return errorResponse(res, "All fields are required", 400);
    }

    const existing = await FAQ.findOne({ identifier });
    if (existing) return errorResponse(res, "Identifier already exists", 400);

    const newFAQ = await FAQ.create({
      recordId: generateRecordId(),
      identifier,
      question,
      answer,
      status: true,
      creationTime: Date.now(),
      lastModified: Date.now(),
    });

    return successResponse(res, "FAQ added successfully", newFAQ);
  } catch (err) {
    console.error("Add FAQ Error:", err);
    return errorResponse(res, "Failed to add FAQ", 500);
  }
};

// ✅ Edit FAQ
export const editFAQ = async (req, res) => {
  try {
    const { recordId, identifier, question, answer, status } = req.body;

    if (!recordId) return errorResponse(res, "recordId is required", 400);

    const faq = await FAQ.findOne({ recordId });
    if (!faq) return errorResponse(res, "FAQ not found", 404);

    const updatedFAQ = await FAQ.updateOne(
      { recordId },
      {
        identifier: identifier ?? faq.identifier,
        question: question ?? faq.question,
        answer: answer ?? faq.answer,
        status: status ?? faq.status,
        lastModified: Math.floor(Date.now() / 1000),
      }
    );

    return successResponse(res, "FAQ updated successfully", updatedFAQ);
  } catch (err) {
    console.error("Edit FAQ Error:", err);
    return errorResponse(res, "Failed to update FAQ", 500);
  }
};

// ✅ Delete FAQ
export const deleteFAQ = async (req, res) => {
  try {
    const { recordId } = req.body;

    if (!recordId) return errorResponse(res, "recordId is required", 400);

    const faq = await FAQ.findOne({ recordId });
    if (!faq) return errorResponse(res, "FAQ not found", 404);
    await FAQ.deleteOne({ recordId });
    const deleted = faq;

    return successResponse(res, "FAQ deleted successfully", deleted);
  } catch (err) {
    console.error("Delete FAQ Error:", err);
    return errorResponse(res, "Failed to delete FAQ", 500);
  }
};

// ✅ Get All FAQs
export const getAllFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find({}, { sort: { creationTime: -1 } });
    return successResponse(res, "FAQs fetched successfully", faqs);
  } catch (err) {
    console.error("Get FAQs Error:", err);
    return errorResponse(res, "Failed to fetch FAQs", 500);
  }
};

// ✅ Get FAQ by recordId
export const getFAQByRecordId = async (req, res) => {
  try {
    const { recordId } = req.body;
    if (!recordId) return errorResponse(res, "recordId is required", 400);

    const faq = await FAQ.findOne({ recordId });
    if (!faq) return errorResponse(res, "FAQ not found", 404);

    return successResponse(res, "FAQ fetched successfully", faq);
  } catch (err) {
    console.error("Get FAQ Error:", err);
    return errorResponse(res, "Failed to fetch FAQ", 500);
  }
};
